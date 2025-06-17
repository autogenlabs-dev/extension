#!/usr/bin/env node

/**
 * ExtensionView Integration Migration Script
 *
 * This script helps migrate ExtensionView from one VS Code extension to another.
 * It handles file copying, command renaming, and basic conflict resolution.
 *
 * Usage:
 *   node migration-script.js --source ./current-extension --target ./target-extension --namespace myExtension
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

class ExtensionMigrator {
	constructor(options) {
		this.sourceDir = options.source
		this.targetDir = options.target
		this.namespace = options.namespace || "integrated"
		this.backupDir = path.join(this.targetDir, ".migration-backup")

		this.filesToCopy = ["src/extentionView/", "src/viewHandlers/viewHandlers.ts"]

		this.commandMappings = {
			"extension.openAutoGenBuilder": `${this.namespace}.openBuilder`,
			"extension.openChat": `${this.namespace}.openChat`,
			"extension.showPreview": `${this.namespace}.showPreview`,
			"extension.openBuilderUI": `${this.namespace}.openBuilderUI`,
		}
	}

	async migrate() {
		console.log("🚀 Starting ExtensionView migration...")

		try {
			await this.validateDirectories()
			await this.createBackup()
			await this.copyFiles()
			await this.updatePackageJson()
			await this.updateExtensionTs()
			await this.updateImports()
			await this.generateIntegrationReport()

			console.log("✅ Migration completed successfully!")
			console.log(`📋 Check migration-report.md for details`)
		} catch (error) {
			console.error("❌ Migration failed:", error.message)
			console.log("🔄 Restoring from backup...")
			await this.restoreBackup()
		}
	}

	async validateDirectories() {
		console.log("🔍 Validating directories...")

		if (!fs.existsSync(this.sourceDir)) {
			throw new Error(`Source directory not found: ${this.sourceDir}`)
		}

		if (!fs.existsSync(this.targetDir)) {
			throw new Error(`Target directory not found: ${this.targetDir}`)
		}

		// Check if ExtensionView exists in source
		const extensionViewPath = path.join(this.sourceDir, "src/extentionView")
		if (!fs.existsSync(extensionViewPath)) {
			throw new Error("ExtensionView not found in source directory")
		}

		console.log("✅ Directories validated")
	}

	async createBackup() {
		console.log("💾 Creating backup...")

		if (fs.existsSync(this.backupDir)) {
			fs.rmSync(this.backupDir, { recursive: true })
		}

		fs.mkdirSync(this.backupDir, { recursive: true })

		// Backup critical files
		const filesToBackup = ["package.json", "src/extension.ts"]

		for (const file of filesToBackup) {
			const sourcePath = path.join(this.targetDir, file)
			const backupPath = path.join(this.backupDir, file)

			if (fs.existsSync(sourcePath)) {
				fs.mkdirSync(path.dirname(backupPath), { recursive: true })
				fs.copyFileSync(sourcePath, backupPath)
			}
		}

		console.log("✅ Backup created")
	}

	async copyFiles() {
		console.log("📁 Copying ExtensionView files...")

		for (const filePattern of this.filesToCopy) {
			const sourcePath = path.join(this.sourceDir, filePattern)
			const targetPath = path.join(this.targetDir, filePattern)

			if (fs.existsSync(sourcePath)) {
				await this.copyRecursive(sourcePath, targetPath)
				console.log(`✅ Copied: ${filePattern}`)
			} else {
				console.warn(`⚠️  File not found: ${filePattern}`)
			}
		}
	}

	async copyRecursive(src, dest) {
		const stat = fs.statSync(src)

		if (stat.isDirectory()) {
			if (!fs.existsSync(dest)) {
				fs.mkdirSync(dest, { recursive: true })
			}

			const files = fs.readdirSync(src)
			for (const file of files) {
				await this.copyRecursive(path.join(src, file), path.join(dest, file))
			}
		} else {
			fs.copyFileSync(src, dest)
		}
	}

	async updatePackageJson() {
		console.log("📦 Updating package.json...")

		const packageJsonPath = path.join(this.targetDir, "package.json")
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

		// Add new commands
		if (!packageJson.contributes) {
			packageJson.contributes = {}
		}

		if (!packageJson.contributes.commands) {
			packageJson.contributes.commands = []
		}

		const newCommands = [
			{
				command: `${this.namespace}.openBuilder`,
				title: "Open Builder UI",
				category: "Builder",
			},
			{
				command: `${this.namespace}.openChat`,
				title: "Open Chat Interface",
				category: "Builder",
			},
		]

		// Check for conflicts and add new commands
		for (const newCmd of newCommands) {
			const exists = packageJson.contributes.commands.find((cmd) => cmd.command === newCmd.command)

			if (!exists) {
				packageJson.contributes.commands.push(newCmd)
				console.log(`✅ Added command: ${newCmd.command}`)
			} else {
				console.warn(`⚠️  Command already exists: ${newCmd.command}`)
			}
		}

		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
		console.log("✅ package.json updated")
	}

	async updateExtensionTs() {
		console.log("🔧 Updating extension.ts...")

		const extensionTsPath = path.join(this.targetDir, "src/extension.ts")
		let content = fs.readFileSync(extensionTsPath, "utf8")

		// Add ExtensionView import
		const importStatement = `import { ExtensionView } from "./extentionView/extensionView";`
		if (!content.includes(importStatement)) {
			// Find a good place to add the import
			const importRegex = /import.*from.*["'];/g
			const imports = content.match(importRegex)
			if (imports && imports.length > 0) {
				const lastImport = imports[imports.length - 1]
				content = content.replace(lastImport, lastImport + "\n" + importStatement)
			} else {
				// Add at the top if no imports found
				content = importStatement + "\n" + content
			}
		}

		// Add command registration
		const commandRegistration = `
  // ExtensionView Integration
  let builderCommand = vscode.commands.registerCommand(
    "${this.namespace}.openBuilder",
    () => {
      const extensionView = new ExtensionView(context);
    }
  );
  
  context.subscriptions.push(builderCommand);`

		// Find activate function and add command registration
		const activateRegex = /export function activate\(context: vscode\.ExtensionContext\)\s*{/
		const match = content.match(activateRegex)

		if (match) {
			const insertIndex = content.indexOf(match[0]) + match[0].length
			content = content.slice(0, insertIndex) + commandRegistration + content.slice(insertIndex)
		} else {
			console.warn("⚠️  Could not find activate function. Manual integration required.")
		}

		fs.writeFileSync(extensionTsPath, content)
		console.log("✅ extension.ts updated")
	}

	async updateImports() {
		console.log("🔗 Updating import paths...")

		const extensionViewPath = path.join(this.targetDir, "src/extentionView/extensionView.ts")

		if (fs.existsSync(extensionViewPath)) {
			let content = fs.readFileSync(extensionViewPath, "utf8")

			// Update AutoGenProvider import path if needed
			const autoGenImportRegex = /import.*AutoGenProvider.*from.*["'](.*)["']/
			const match = content.match(autoGenImportRegex)

			if (match) {
				const currentPath = match[1]
				// Adjust path based on target extension structure
				const newPath = currentPath.replace(
					"../core/webview/AutogenProvider",
					"../core/webview/AutogenProvider",
				)
				content = content.replace(match[0], match[0].replace(currentPath, newPath))
			}

			fs.writeFileSync(extensionViewPath, content)
			console.log("✅ Import paths updated")
		}
	}

	async generateIntegrationReport() {
		console.log("📋 Generating integration report...")

		const reportPath = path.join(this.targetDir, "migration-report.md")
		const report = `# ExtensionView Migration Report

## Migration Summary
- **Date**: ${new Date().toISOString()}
- **Source**: ${this.sourceDir}
- **Target**: ${this.targetDir}
- **Namespace**: ${this.namespace}

## Files Copied
${this.filesToCopy.map((file) => `- ✅ ${file}`).join("\n")}

## Commands Added
${Object.entries(this.commandMappings)
	.map(([old, new_]) => `- \`${old}\` → \`${new_}\``)
	.join("\n")}

## Manual Steps Required

### 1. Review AutoGenProvider Integration
Check if the AutoGenProvider import path is correct in:
- \`src/extentionView/extensionView.ts\`

### 2. Test Command Registration
Verify that the new commands work correctly:
${Object.values(this.commandMappings)
	.map((cmd) => `- \`${cmd}\``)
	.join("\n")}

### 3. Resolve Any Conflicts
Check for:
- Duplicate command names
- Conflicting message handlers
- CSS style conflicts

### 4. Update Documentation
- Update README.md with new features
- Document new commands and shortcuts
- Create user guide for integrated features

## Backup Location
Original files backed up to: \`.migration-backup/\`

## Rollback Instructions
If you need to rollback:
\`\`\`bash
# Restore from backup
cp .migration-backup/package.json ./package.json
cp .migration-backup/src/extension.ts ./src/extension.ts

# Remove copied files
rm -rf src/extentionView/
\`\`\`

## Next Steps
1. Test the integration
2. Run the extension in development mode
3. Verify all features work correctly
4. Update version number in package.json
5. Update CHANGELOG.md

## Support
If you encounter issues, refer to:
- EXTENSION_VIEW_INTEGRATION_GUIDE.md
- IDE_INTEGRATION_CHECKLIST.md
- EXTENSION_ARCHITECTURE.md
`

		fs.writeFileSync(reportPath, report)
		console.log("✅ Integration report generated")
	}

	async restoreBackup() {
		if (fs.existsSync(this.backupDir)) {
			const files = fs.readdirSync(this.backupDir, { recursive: true })

			for (const file of files) {
				const backupPath = path.join(this.backupDir, file)
				const targetPath = path.join(this.targetDir, file)

				if (fs.statSync(backupPath).isFile()) {
					fs.copyFileSync(backupPath, targetPath)
				}
			}

			console.log("✅ Backup restored")
		}
	}
}

// CLI Interface
function parseArgs() {
	const args = process.argv.slice(2)
	const options = {}

	for (let i = 0; i < args.length; i += 2) {
		const key = args[i].replace("--", "")
		const value = args[i + 1]
		options[key] = value
	}

	return options
}

function showHelp() {
	console.log(`
ExtensionView Migration Script

Usage:
  node migration-script.js --source <source-dir> --target <target-dir> [--namespace <namespace>]

Options:
  --source      Path to source extension directory
  --target      Path to target extension directory  
  --namespace   Command namespace (default: 'integrated')
  --help        Show this help message

Examples:
  node migration-script.js --source ./current-extension --target ./target-extension
  node migration-script.js --source ./src --target ./target --namespace myExtension
`)
}

// Main execution
async function main() {
	const options = parseArgs()

	if (options.help || !options.source || !options.target) {
		showHelp()
		process.exit(0)
	}

	const migrator = new ExtensionMigrator(options)
	await migrator.migrate()
}

if (require.main === module) {
	main().catch((error) => {
		console.error("💥 Fatal error:", error)
		process.exit(1)
	})
}

module.exports = { ExtensionMigrator }
