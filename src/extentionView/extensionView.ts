import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getSidebarHtml } from "./components/Sidebar";
import { getMainContentHtml } from "./components/MainContent";
import { showDesignContent, getDesignPrompt } from "./components/DesignPanel";
import { showDocumentationContent } from "./components/DocumentationPanel";
// Import AutoGenProvider to access its static methods and potentially types
import { AutoGenProvider } from "../core/webview/AutogenProvider"; // Added import
import { reactWithTailwind } from "./components/setups/reactWithTailwindSetup"; // Import for React + Tailwind setup
import { nextjsWithTailwind } from "./components/setups/nextjsWithTailwindSetup"; // Import for Next.js + Tailwind setup
import { reactWithBootstrap } from "./components/setups/reactWithBootstrapSetup"; // Import for React + Bootstrap setup
import { nextjsWithBootstrap } from "./components/setups/nextjsWithBootstrapSetup"; // Import for Next.js + Bootstrap setup

class ExtensionView {
    private panel: vscode.WebviewPanel;

    constructor(context: vscode.ExtensionContext) {
        this.panel = vscode.window.createWebviewPanel(
            "autoGenBuilder",
            "AutoGen Code Builder",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        // Set webview content
        this.panel.webview.html = this.getWebviewContent(
            this.panel.webview,
            context.extensionUri
        );

        // Set up message handling
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                try {
                    console.log("Received message in ExtensionView:", message);

                    switch (message.command) {
                        case "createComponentFile":
                            if (!vscode.workspace.rootPath) {
                                throw new Error("No workspace found!");
                            }

                            let targetPath: string | undefined = undefined; // Define targetPath here to access later

                            try {
                                // Clean up the file path to remove leading slash and fix project name
                                const cleanPath = message.filePath.replace(/^\/vs-code-extension/, '');
                                targetPath = path.join(vscode.workspace.rootPath, cleanPath); // Assign value
                                const targetDir = path.dirname(targetPath);

                                console.log("Creating file at:", targetPath);
                                console.log("In directory:", targetDir);

                                // Create directory if it doesn't exist
                                if (!fs.existsSync(targetDir)) {
                                    fs.mkdirSync(targetDir, { recursive: true });
                                }

                                // Write the file
                                const finalCode = `${message.componentCode}`;

                                fs.writeFileSync(targetPath, finalCode, 'utf-8');

                                // Verify file was created
                                if (fs.existsSync(targetPath)) {
                                    console.log("File created successfully at:", targetPath);
                                    vscode.window.showInformationMessage(`Component created at: ${targetPath}`);

                                    // --- START: New logic to trigger AutoGen task ---
                                    const autoGenProvider = AutoGenProvider.getVisibleInstance();
                                    if (autoGenProvider) {
                                        const relativePath = path.relative(vscode.workspace.rootPath, targetPath);
                                        const componentData = {
                                            title: message.title || "unknown",
                                            filePath: message.filePath || "unknown",
                                            dependencies: message.dependencies || [],
                                            language: message.language || "JavaScript",
                                            framework: message.framework || "React",
                                            cssFramework: message.cssFramework || "unknown",
                                            category: message.category || "unknown",
                                            type: message.type || "unknown",
                                            difficulty: message.difficulty || "unknown",
                                            hasAnimation: message.hasAnimation || false
                                        };

                                        // Using string concatenation instead of template literals to avoid nesting issues
                                        const prompt = "Analyze the newly generated component with the following details:\\n" +
                                            "- Title: " + componentData.title + "\\n" +
                                            "- File path: " + componentData.filePath + "\\n" +
                                            "- Dependencies: " + JSON.stringify(componentData.dependencies) + "\\n" +
                                            "- Language: " + componentData.language + "\\n" +
                                            "- Framework: " + componentData.framework + "\\n" +
                                            "- CSS Framework: " + componentData.cssFramework + "\\n" +
                                            "- Category: " + componentData.category + "\\n" +
                                            "- Type: " + componentData.type + "\\n" +
                                            "- Difficulty: " + componentData.difficulty + "\\n" +
                                            "- Has animation: " + componentData.hasAnimation + "\\n" +
                                            "Please check the file, install any dependencies if needed, fix imports and navigation, run the project, and make any necessary adjustments based on this component data.";

                                        // Ensure the AutoGen panel is visible/focused
                                        // Use the correct command ID for the AutoGen view
                                        await vscode.commands.executeCommand('claude-dev.SidebarProvider.focus'); // Focus the view directly
                                        // A slight delay might be needed for the view to fully activate before starting the task
                                        await new Promise(resolve => setTimeout(resolve, 200));

                                        await autoGenProvider.initAutoGenWithTask(prompt);
                                        console.log("Triggered new AutoGen task for:", targetPath);
                                    } else {
                                        console.warn("AutoGenProvider instance not found. Cannot trigger follow-up task.");
                                        vscode.window.showWarningMessage("Component created, but couldn't automatically start analysis task. Please open the AutoGen chat manually.");
                                    }
                                    // --- END: New logic ---

                                } else {
                                     // Added else block for clarity
                                     console.error("File verification failed after write:", targetPath);
                                     throw new Error("File verification failed after writing.");
                                }

                            } catch (error: any) {
                                console.error("File creation error:", error);
                                // Ensure targetPath is defined before showing error message
                                const errorMsgPath = targetPath ? ` at ${targetPath}` : '';
                                vscode.window.showErrorMessage(`Failed to create component${errorMsgPath}: ${error.message}`);
                                // Do not re-throw here to avoid duplicate error messages if caught below
                            }
                            break; // Added break statement

                        case "initializePrompt":
                            {
                                let autoGenProvider = AutoGenProvider.getVisibleInstance();

                                // Fallback: get any existing instance
                                if (!autoGenProvider && (AutoGenProvider as any).activeInstances) {
                                    const instances = Array.from((AutoGenProvider as any).activeInstances as Set<any>);
                                    if (instances.length > 0) {
                                        autoGenProvider = instances[0];
                                    }
                                }

                                if (autoGenProvider) {
                                    try {
                                        await vscode.commands.executeCommand('claude-dev.SidebarProvider.focus');
                                        await new Promise(resolve => setTimeout(resolve, 200));
                                        await autoGenProvider.initAutoGenWithTask(message.prompt);
                                        console.log("Triggered AutoGen task with prompt from ExtensionView");
                                    } catch (error) {
                                        console.error("Failed to trigger AutoGen task:", error);
                                    }
                                } else {
                                    console.warn("AutoGenProvider instance not found. Cannot trigger analysis task.");
                                    vscode.window.showWarningMessage("Component created, but couldn't automatically start analysis task. Please open the AutoGen chat manually.");
                                }                            }
                            break;                              case 'setupReactTailwind': // New case to handle React + Tailwind setup
                            console.log('Received setupReactTailwind command from webview');
                            try {
                                await reactWithTailwind();
                                this.panel.webview.postMessage({
                                    command: 'info',
                                    message: 'React + Tailwind CSS project setup initiated successfully!'
                                });
                            } catch (error) {
                                console.error('Error setting up React + Tailwind project from extension host:', error);
                                this.panel.webview.postMessage({
                                    command: 'error',
                                    message: 'Failed to create React + Tailwind CSS project: ' + (error as Error).message
                                });
                            }
                            break;
                            
                        case 'setupNextjsTailwind': // Case to handle Next.js + Tailwind setup
                            console.log('Received setupNextjsTailwind command from webview');
                            try {
                                await nextjsWithTailwind();
                                this.panel.webview.postMessage({
                                    command: 'info',
                                    message: 'Next.js + Tailwind CSS project setup initiated successfully!'
                                });
                            } catch (error) {
                                console.error('Error setting up Next.js + Tailwind project from extension host:', error);
                                this.panel.webview.postMessage({
                                    command: 'error',
                                    message: 'Failed to create Next.js + Tailwind CSS project: ' + (error as Error).message
                                });
                            }
                            break;
                            
                        case 'setupReactBootstrap': // Case to handle React + Bootstrap setup
                            console.log('Received setupReactBootstrap command from webview');
                            try {
                                await reactWithBootstrap();
                                this.panel.webview.postMessage({
                                    command: 'info',
                                    message: 'React + Bootstrap project setup initiated successfully!'
                                });
                            } catch (error) {
                                console.error('Error setting up React + Bootstrap project from extension host:', error);
                                this.panel.webview.postMessage({
                                    command: 'error',
                                    message: 'Failed to create React + Bootstrap project: ' + (error as Error).message
                                });
                            }
                            break;
                            
                        case 'setupNextjsBootstrap': // Case to handle Next.js + Bootstrap setup
                            console.log('Received setupNextjsBootstrap command from webview');
                            try {
                                await nextjsWithBootstrap();
                                this.panel.webview.postMessage({
                                    command: 'info',
                                    message: 'Next.js + Bootstrap project setup initiated successfully!'
                                });
                            } catch (error) {
                                console.error('Error setting up Next.js + Bootstrap project from extension host:', error);
                                this.panel.webview.postMessage({
                                    command: 'error',
                                    message: 'Failed to create Next.js + Bootstrap project: ' + (error as Error).message
                                });
                            }
                            break;

                        case "info":
                            vscode.window.showInformationMessage(message.message);
                            break;

                        case "error":
                            vscode.window.showErrorMessage(message.message);
                            break;

                        default:
                            console.log("Unknown command:", message.command);
                    }
                } catch (error: any) {
                    // General catch block for errors within onDidReceiveMessage
                    console.error("Error processing message in ExtensionView:", error);
                    vscode.window.showErrorMessage(`An unexpected error occurred: ${error.message}`);
                }
            },
            undefined,
            context.subscriptions
        );
    }


    private getWebviewContent(
        webview: vscode.Webview,
        extensionUri: vscode.Uri
    ): string {
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.file(
                path.join(extensionUri.fsPath, "src", "extentionView", "styles.css")
            )
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoGen Code Builder</title>
    <link href="${stylesUri}" rel="stylesheet" />
</head>
<body>
    <div class="container">
        ${getSidebarHtml()}
        ${getMainContentHtml()}
    </div>
    <script>
        ${getScriptContent()}
    </script>
</body>
</html>`;
    }
}

function getScriptContent(): string {
    return `
        const vscode = acquireVsCodeApi();

        // Helper function to find a directory and add a node to it
        function addNodeToStructure(structure, targetPathParts, nodeToAdd) {
            let currentLevel = structure;
            let found = true;
            for (let i = 0; i < targetPathParts.length; i++) {
                const part = targetPathParts[i];
                const nextLevel = currentLevel.find(item => item.name === part + '/' && item.children);
                if (nextLevel) {
                    currentLevel = nextLevel.children;
                } else {
                    // If path doesn't exist fully, add to the deepest found level or root
                    console.warn('[addNodeToStructure] Path part not found:', part, 'in', targetPathParts.join('/'));
                    if (i > 0) { // Add to the last successfully found directory
                        const parentDir = currentLevel.find(item => item.name === targetPathParts[i-1] + '/');
                        if(parentDir) parentDir.children.push(nodeToAdd);
                        else currentLevel.push(nodeToAdd); // Fallback add to current level
                    } else { // Add to root if first part fails
                        currentLevel.push(nodeToAdd);
                    }
                    found = false;
                    break;
                }
            }
            if (found) {
                currentLevel.push(nodeToAdd);
            }
        }

        function renderFolderStructure(option) {
            const previewGrid = document.getElementById('previewGrid');
            if (!previewGrid) return;
            previewGrid.innerHTML = '';

            let baseFramework = 'React';
            if (typeof option === 'string') {
                option = option.trim(); // Trim whitespace
                if (option.startsWith('Vue') || option.startsWith('Nuxt')) baseFramework = 'Vue';
                else if (option.startsWith('Angular')) baseFramework = 'Angular';   
                else if (option.startsWith('Svelte') || option.startsWith('SvelteKit')) baseFramework = 'Svelte';
                else if (option.startsWith('Next')) baseFramework = 'Next.js';
                else if (option.startsWith('Solid')) baseFramework = 'SolidJS';
                else if (option.startsWith('Qwik')) baseFramework = 'Qwik';
                else if (option.startsWith('Astro')) baseFramework = 'Astro';
                else if (option.startsWith('React Native') || option.startsWith('Expo')) baseFramework = 'ReactNative';
            }
            
            console.log('[renderFolderStructure] Rendering for option:', option, ' Base Framework:', baseFramework);

            let structure = [];
            let appName = 'my-app';

            // Define Base Structures
            switch(baseFramework) {
                case 'Next.js':
                    appName = 'my-next-app';
                    structure = [
                        { name: 'app/', children: [
                             { name: 'page.tsx' }, { name: 'layout.tsx' }, { name: 'globals.css' }
                        ]},
                        { name: 'components/', children: [
                             { name: 'Header.tsx' }, { name: 'Footer.tsx' }
                        ]},
                        { name: 'public/', children: [{ name: 'favicon.ico' }]},
                        { name: 'package.json' }, { name: 'tsconfig.json' }, { name: 'next.config.js' }
                    ];
                    break;
                case 'React': // Added case for React
                    appName = 'my-react-app';
                    structure = [
                        { name: 'public/', children: [
                            { name: 'index.html' }, { name: 'favicon.ico' }
                        ]},
                        { name: 'src/', children: [
                            { name: 'App.js' }, { name: 'index.js' }, { name: 'index.css' }
                        ]},
                        { name: 'package.json' }
                    ];
                    break;
                // Add other baseFramework cases here if needed
            }

            // Conditionally add files/folders based on keywords in the option
            if (typeof option === 'string') {
                if (option.includes('Tailwind') && baseFramework !== 'ReactNative') {
                     structure.push({ name: 'tailwind.config.js' });
                     // Add postcss if not already implied by framework base (e.g., Next.js, SvelteKit)
                     if (!['Next.js', 'Svelte', 'Astro'].includes(baseFramework)) {
                         structure.push({ name: 'postcss.config.js' });
                     }
                     // Add tailwind directives to main css file
                     let cssPath = [];
                     let cssFile = '';
                     if(baseFramework === 'Next.js') { cssPath = ['app']; cssFile = 'globals.css'; }
                     else if(baseFramework === 'Angular') { cssPath = ['src']; cssFile = 'styles.css'; }
                     else if(baseFramework === 'Svelte') { cssPath = ['src', 'routes']; cssFile = '+layout.svelte'; } // Or app.postcss
                     else if(baseFramework === 'Astro') { cssPath = ['src', 'styles']; cssFile = 'global.css'; }
                     else if(baseFramework === 'React') { cssPath = ['src']; cssFile = 'index.css'; }
                     // If we found a path, add a comment/placeholder node
                     if(cssPath.length > 0 || cssFile) {
                          // Use string concatenation for the node name
                          addNodeToStructure(structure, cssPath, { name: '(add Tailwind directives to ' + cssFile + ')' });
                     }
                }
                if (option.includes('Redux') && baseFramework === 'React') {
                    addNodeToStructure(structure, ['src'], { name: 'store/', children: [{ name: 'store.ts' }, { name: 'features/', children: [{ name: 'counterSlice.ts' }] }] });
                }
                 if (option.includes('Pinia') && baseFramework === 'Vue' && !(option && option.startsWith('Nuxt'))) { // Add to Vue/Vite, not Nuxt
                    addNodeToStructure(structure, ['src'], { name: 'stores/', children: [{ name: 'counter.ts' }] });
                 }
                 if (option.includes('Vuetify') && baseFramework === 'Vue' && !(option && option.startsWith('Nuxt'))) { // Add to Vue/Vite, not Nuxt
                     addNodeToStructure(structure, ['src'], { name: 'plugins/', children: [{ name: 'vuetify.ts' }] });
                 }
                 if (option.includes('Framer Motion') && baseFramework === 'React') {
                     // Maybe add a specific component example?
                     addNodeToStructure(structure, ['src', 'components'], { name: 'AnimatedComponent.tsx' });
                 }
                 if (option.includes('State Management') && baseFramework === 'Svelte') { // Assumes SvelteKit
                     addNodeToStructure(structure, ['src', 'lib'], { name: 'stores.js' });
                 }
                 // Add more conditions here for Material UI, etc.
             }

            // Add the root application folder using string concatenation
            const rootStructure = [{ name: appName + '/', children: structure }];

            function renderTree(nodes, level = 0) {
                // Use theme variables for consistency
                let html = '<ul style="padding-left: ' + (level * 15) + 'px;">';
                for (const node of nodes) {
                    // Get the file extension if this is a file (no children)
                    let fileType = '';
                    let fileTypeClass = '';
                    
                    if (!node.children) {
                        // Check for file extension
                        const nameParts = node.name.split('.');
                        if (nameParts.length > 1) {
                            const extension = nameParts[nameParts.length - 1]; // Get last part after dot
                            fileType = extension;
                            fileTypeClass = extension + '-type';
                            
                            // Handle special cases like .tsx, .jsx where we want to show the full extension
                            if (extension === 'tsx' || extension === 'jsx') {
                                fileType = '.' + extension;
                            }
                        }
                    }
                    
                    // Determine icon and name class based on presence of children (folder) or not (file)
                    const isFolder = !!node.children;
                    const iconClass = isFolder ? 'folder-icon' : 'file-icon';
                    const nameClass = isFolder ? 'folder-name' : 'file-name';
                    const icon = isFolder ? '📁' : getFileIcon(node.name);
                    
                    html += '<li>';
                    html += '<span class="' + iconClass + '">' + icon + '</span>';
                    html += '<span class="' + nameClass + '">' + node.name + '</span>';
                    
                    // Add file type badge if it's a file (no children) and has a valid extension
                    if (!isFolder && fileType) {
                        html += '<span class="file-type ' + fileTypeClass + '">' + fileType + '</span>';
                    }
                    
                    html += '</li>';
                    
                    if (node.children) {
                        html += renderTree(node.children, level + 1);
                    }
                }
                html += '</ul>';
                return html;
            }
            
            // Helper function to get appropriate file icon based on file extension
            function getFileIcon(filename) {
                const ext = filename.split('.').pop();
                switch(ext) {
                    case 'js': return '📄'; // JavaScript
                    case 'ts': return '📄'; // TypeScript
                    case 'tsx': 
                    case 'jsx': return '📄'; // React
                    case 'css': return '📄'; // CSS
                    case 'html': return '📄'; // HTML
                    case 'json': return '📄'; // JSON
                    case 'vue': return '📄'; // Vue
                    case 'svelte': return '📄'; // Svelte
                    default: return '📄'; // Default file icon
                }
            }

            // Wrap output in a card div with enhanced styling
            previewGrid.innerHTML =
                '<div class="folder-structure-card">' + 
                    '<h4>' + (option || 'Default') + ' Project Structure</h4>' + 
                    renderTree(rootStructure) +
                '</div>';
        }
        const BASE_URL = "http://localhost:5000";
        const API_ENDPOINT = "/api/extension/designs";

        // Define constants at the top
        const jsFrameworks = ['React', 'Next.js', 'Vue'];
        const cssFrameworks = ['Tailwind CSS', 'Bootstrap', 'Custom CSS'];
        const websiteTypes = ['E-commerce', 'Portfolio', 'Management Dashboard', 'Blog', 'Animated Showcase', 'Landing Page'];
        const layoutOptions = ["React + Tailwind CSS", "React + Bootstrap", "Next.js + Tailwind CSS", "Next.js + Bootstrap"];
        const templateCategories = ['Headers', 'Footers', 'Hero Sections', 'Cards', 'Forms'];
        const mcpDesignOptions = [ 'Check MCP Status']; // Added MCP/Design options        // Separate state for each sidebar icon functionality
        const state = {
            // Current active panel
            activePanel: 'framework',
            
            // Framework icon (icon 1) state
            framework: {
                selectedJS: '',
                selectedCSS: '',
                selectedCategory: '',
                availableCategories: []
            },
            
            // Layout icon (icon 2) state
            layout: {
                selectedJS: 'React',
                selectedCSS: '',
                selectedWebsiteType: '',
                selectedLayout: '' // Added state for selected layout
            },
            
            // Shared state for component selection
            selectedComponents: [],
            selectedComponentCode: null,
            filePath: '',
            selectedTemplateCategory: '', 
            selectedWebsiteTemplate: '', 
            selectedMcpDesignOption: '', // Added state for selected MCP/Design option
            selectedDocType: '' // Added state for selected documentation type
        };

        // Main initialization function
        function initializeUI() {
            // Initialize framework buttons immediately
            initializeFrameworkButtons();
            // Initialize filters
            initializeFilters();
            // Initialize other buttons
            initializeButtons();
            // Initialize layout options (but don't necessarily populate immediately)
            // We will populate when the layout panel is clicked
            // Initialize website type buttons (don't populate immediately)
            // Initialize template panel (don't populate immediately)
            // Initialize MCP/Design panel (don't populate immediately)
        }

        function initializeFrameworkButtons() {
            // JS Framework buttons
            const jsContainer = document.getElementById('jsFrameworkButtons');
            if (jsContainer) {
                jsContainer.innerHTML = '';
                jsFrameworks.forEach(framework => {
                    const button = document.createElement('button');
                    button.className = 'option-button';
                    button.textContent = framework;
                    button.addEventListener('click', () => handleSelection('js', framework));
                    jsContainer.appendChild(button);
                });
                // Apply selected state if returning
                if (state.framework.selectedJS) {
                    updateSelection('jsFrameworkButtons', state.framework.selectedJS);
                }
            }

            // CSS Framework buttons
            const cssContainer = document.getElementById('cssFrameworkButtons');
            if (cssContainer) {
                cssContainer.innerHTML = '';
                cssFrameworks.forEach(framework => {
                    const button = document.createElement('button');
                    button.className = 'option-button';
                    button.textContent = framework;
                    button.addEventListener('click', () => handleSelection('css', framework));
                    cssContainer.appendChild(button);
                });
                 // Apply selected state if returning
                 if (state.framework.selectedCSS) {
                    updateSelection('cssFrameworkButtons', state.framework.selectedCSS);
                }
            }
        }

        function initializeButtons() {
            // Debug button
            const debugButton = document.getElementById('debugButton');
            if (debugButton) {
                debugButton.addEventListener('click', handleGenerateCode);
            }

            // Chat button
            const chatButton = document.getElementById('openChatButton');
            if (chatButton) {
                chatButton.addEventListener('click', () => {
                    vscode.postMessage({ command: 'openChat' });
                });
            }

            // Sidebar icons
            document.querySelectorAll('.sidebar-icon').forEach(icon => {
                icon.addEventListener('click', (event) => { // event is the MouseEvent
                    const panelAttributeValue = icon.getAttribute('data-panel'); // icon is event.currentTarget
                    if (panelAttributeValue) {
                        handleSidebarClick(panelAttributeValue, icon); // Pass icon as the clickedElement
                    }
                });
            });
        }        function handleSelection(type, value) {
            console.log('Selection:', type, value);
            const previewGrid = document.getElementById('previewGrid'); // Get previewGrid once
            const docContentContainer = document.getElementById('docContentContainer'); // Get doc content container

            if (state.activePanel === 'framework') {
                if (type === 'js') {
                    state.framework.selectedJS = value;
                    const cssContainer = document.getElementById('cssFrameworkContainer');
                    if (cssContainer) {
                        cssContainer.classList.remove('hidden');
                        updateSelection('jsFrameworkButtons', value); 
                    }
                    // Show folder structure immediately as preview
                    renderFolderStructure(value); 
                    // showFrameworkCards(value); // Optionally keep or remove this if structure is enough initially
                } else if (type === 'css') {
                    state.framework.selectedCSS = value;
                    updateSelection('cssFrameworkButtons', value);
                    // Fetch and show component cards as preview
                    fetchAvailableCategories().then(() => {
                        showFrameworkCards(value, state.framework.selectedCategory || 'all'); // Use selected category if available
                    });
                }
            } else if (state.activePanel === 'layout') { 
                if (type === 'layoutOption') {
                    state.layout.selectedLayout = value;
                    updateSelection('layoutOptions', value);
                    console.log('Layout selected:', value);
                    // Render the folder structure based on the selected option
                    renderFolderStructure(value);
                } 
                else if (type === 'js') {
                    state.layout.selectedJS = value;
                    updateSelection('jsFrameworkButtons', value);
                    // Maybe update structure preview if relevant to layout?
                    // renderFolderStructure(value);
                } else if (type === 'css') {
                    state.layout.selectedCSS = value;
                    updateSelection('cssFrameworkButtons', value);
                }
            } else if (state.activePanel === 'content') { 
                if (type === 'websiteTypeOption') {
                    state.layout.selectedWebsiteType = value;
                    updateSelection('websiteTypeButtons', value);
                    console.log('Website Type selected:', value);
                     // Update previewGrid to show the selected website type
                    if (previewGrid) {
                        previewGrid.innerHTML = '<div class="preview-placeholder">Selected Website Type: <strong>' + value + '</strong></div>';
                    }
                 }
            } else if (type === 'mcpDesignOption') { 
                state.selectedMcpDesignOption = value;
                updateSelection('mcpDesignOptions', value);
                console.log('MCP/Design Option selected:', value);
                // Update previewGrid to show the selected option
                if (previewGrid) {
                    if (value === 'Check MCP Status') {
                         // Placeholder for actual status check
                         previewGrid.innerHTML = '<div class="preview-placeholder">Checking MCP Server Status... (Placeholder)</div>'; 
                         // TODO: Implement actual MCP status check if possible                    } else {
                         // Display a visual representation of the selected design style using our helper function
                         previewGrid.innerHTML = showDesignContent(value);
                         
                         // Add event listener to the Generate Components button
                         const generateBtn = document.getElementById('generateDesignComponents');
                         if (generateBtn) {
                             generateBtn.addEventListener('click', () => {
                                 const prompt = getDesignPrompt(value);
                                 vscode.postMessage({
                                     command: 'initializePrompt',
                                     prompt: prompt
                                 });
                             });
                         }
                    }
                }             } else if (type === 'docType') { 
                // Handle documentation type selection
                state.selectedDocType = value;
                console.log('Documentation type selected:', value);
                
                // First, try to update the docContentContainer specifically
                if (docContentContainer) {
                    // Show loading indicator before content loads
                    docContentContainer.innerHTML = '<div class="loading-indicator">Loading documentation...</div>';
                    
                    // Short delay to simulate loading for better UX
                    setTimeout(() => {
                        const content = showDocumentationContent(value);
                        docContentContainer.innerHTML = content;
                        
                        // Add event listeners to any buttons in the documentation cards
                        const docButtons = docContentContainer.querySelectorAll('.doc-button, .doc-button-small');
                        docButtons.forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                // Handle button clicks in documentation cards
                                console.log('Documentation button clicked:', e.target.textContent);
                                // You can add specific handling for each button if needed
                            });
                        });
                    }, 300);
                } 
                // Fallback to previewGrid if docContentContainer is not found
                else if (previewGrid) {
                    // Show loading indicator before content loads
                    previewGrid.innerHTML = '<div class="loading-indicator">Loading documentation...</div>';
                    
                    // Short delay to simulate loading for better UX
                    setTimeout(() => {
                        const content = showDocumentationContent(value);
                        previewGrid.innerHTML = content;
                        
                        // Add event listeners to any buttons in the documentation cards
                        const docButtons = previewGrid.querySelectorAll('.doc-button, .doc-button-small');
                        docButtons.forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                // Handle button clicks in documentation cards
                                console.log('Documentation button clicked:', e.target.textContent);
                                // You can add specific handling for each button if needed
                            });
                        });
                    }, 300);
                }
             }
        }

        // Ensure initialization happens after DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, initializing UI...');
            initializeUI();
        });

        async function fetchAvailableCategories() {
            try {
                const response = await fetch(BASE_URL + API_ENDPOINT);
                const result = await response.json();
                if (result.status === 'success' && Array.isArray(result.data)) {
                    // Extract unique categories
                    const categories = [...new Set(result.data.map(item => item.category))];
                    state.availableCategories = categories;
                    updateFilterButtons(categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        }

        function updateFilterButtons(categories) {
            const filterNav = document.querySelector('.filter-nav');
            if (!filterNav) return;

            // Clear existing buttons
            filterNav.innerHTML = '';

            // Add "All" button
            const allButton = document.createElement('button');
            allButton.className = 'filter-btn active';
            allButton.textContent = 'All';
            allButton.onclick = () => handleFilterClick(allButton, 'all');
            filterNav.appendChild(allButton);

            // Add category buttons
            categories.forEach(category => {
                if (!category) return;
                const button = document.createElement('button');
                button.className = 'filter-btn';
                button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                button.onclick = () => handleFilterClick(button, category);
                filterNav.appendChild(button);
            });
        }

        function handleFilterClick(button, category) {
            document.querySelectorAll('.filter-btn').forEach(btn =>
                btn.classList.remove('active')
            );
            button.classList.add('active');

            // Use the appropriate state based on active panel
            if (state.activePanel === 'framework') {
                state.framework.selectedCategory = category;
                showFrameworkCards(state.framework.selectedCSS, category);
            }
        }

        async function fetchComponents(category) {
            try {
                const response = await fetch(BASE_URL + API_ENDPOINT);
                const result = await response.json();

                if (result.status === 'success' && Array.isArray(result.data)) {
                    // Extract unique categories
                    const categories = [...new Set(result.data.map(item => item.category))];
                    updateFilterButtons(categories);

                    // Filter components if category is specified
                    const filteredComponents = category === 'all' ?
                        result.data :
                        result.data.filter(item => item.category.toLowerCase() === category.toLowerCase());

                    return filteredComponents;
                }
                return [];
            } catch (error) {
                console.error('Error fetching components:', error);
                return [];
            }
        }

        function createCard(component, framework) {
            const div = document.createElement('div');
            div.className = 'w-full border rounded-lg overflow-hidden bg-gray-800 border-gray-700';

            // Header section
            const header = document.createElement('div');
            header.className = 'border-b border-gray-700';

            const headerContent = document.createElement('div');
            headerContent.className = 'flex items-center px-4 py-3';

            const title = document.createElement('h2');
            title.className = 'text-sm font-medium text-gray-200';
            title.textContent = component.title;

            // Content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'p-8 bg-gray-900/50';
            const img = document.createElement('img');
            const timestamp = new Date().getTime();
            img.src = BASE_URL + component.image + '?t=' + timestamp;
            img.alt = component.title;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.objectFit = 'cover';
            img.crossOrigin = 'anonymous';

            // Assemble the card
            headerContent.appendChild(title);
            header.appendChild(headerContent);
            contentContainer.appendChild(img);

            div.appendChild(header);
            div.appendChild(contentContainer);

            div.onclick = () => {
                // Remove selection from other cards
                document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');

                // Call handleComponentSelection with both title and code
                handleComponentSelection(component.title, component.code, component.path);
            };

            return div;
        }

        function showFrameworkCards(framework, filter = null) {
            const previewGrid = document.getElementById('previewGrid');
            if (!previewGrid) return;

            previewGrid.innerHTML = '';

            // Only for framework panel (icon 1)
            if (state.activePanel === 'framework') {
                // Show project structure if JS framework is selected but no CSS framework yet
                const setupFrameworks = ['React', 'Next.js', 'Tailwind CSS', 'Bootstrap'];
                if (setupFrameworks.includes(state.framework.selectedJS) && !state.framework.selectedCSS) {
                    renderFolderStructure(state.framework.selectedJS);
                    return;
                }

                // If both JS and CSS frameworks are selected, fetch and show component cards
                if (state.framework.selectedJS && state.framework.selectedCSS) {
                    console.log('Fetching components for:', filter || 'navbar');

                    fetchComponents(filter || 'navbar')
                        .then(components => {
                            if (!Array.isArray(components) || components.length === 0) {
                                console.log('No components received or invalid data');
                                previewGrid.innerHTML = '<p>No components available for this category.</p>';
                                return;
                            }

                            console.log('Processing components:', components);

                            // Show all components vertically
                            components.forEach(component => {
                                if (component && component.title && component.image) {
                                    const card = createCard(component, framework);
                                    card.onclick = () => {
                                        handleComponentSelection(component.title, component.code, component.path);
                                        // Remove selection from other cards
                                        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                                        card.classList.add('selected');
                                    };
                                    previewGrid.appendChild(card);
                                }
                            });
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            previewGrid.innerHTML = '<p>Error loading components</p>';
                        });
                    return;
                }

                // Default: show nothing if neither is selected
                previewGrid.innerHTML = '<p>Please select a JavaScript and CSS framework.</p>';
            }
        }


        function handleComponentSelection(component, componentCode, filePath) {
            console.log('Component selected:', { component, componentCode, filePath });

            // Store the exact file path from API
            state.selectedComponents = [component];
            state.selectedComponentCode = componentCode;
            state.filePath = filePath;  // This is the full path from API

            const previewText = document.getElementById('previewText');
            previewText.textContent = 'Selected component: ' + component;

            console.log('Updated state:', state);
        }



        function handleElementSelection(category) {
            const buttons = document.querySelectorAll('.element-button');
            buttons.forEach(btn => btn.classList.remove('selected'));
            event.target.classList.add('selected');
            showFrameworkCards(state.selectedCSS, category);
        }

        function handleWebsiteTypeSelection(type) {
            state.selectedWebsiteType = type;
            updateSelection('websiteTypeButtons', type);
            document.getElementById('previewGrid').innerHTML = '';
        }


        function handleSidebarClick(panel, clickedIconElement) { // Added clickedIconElement parameter
            console.log('Sidebar clicked:', panel);

            // Update active icon
            document.querySelectorAll('.sidebar-icon').forEach(sidebarIcon => { // Renamed loop var to avoid confusion
                sidebarIcon.classList.remove('active');
            });
            if (clickedIconElement) { // Check if it was passed
                clickedIconElement.classList.add('active'); // Set active on the actually clicked icon
            }

            // Update active panel in state
            state.activePanel = panel;

            // Get references to preview elements
            const previewGrid = document.getElementById('previewGrid');
            const previewText = document.getElementById('previewText');
            const filterNav = document.querySelector('.filter-nav');

            // Clear preview grid and hide filter nav by default
            if (previewGrid) {
                previewGrid.innerHTML = ''; 
            }
            if (filterNav) {
                filterNav.style.display = 'none'; // Hide filters by default
                filterNav.innerHTML = ''; // Clear old filters
            }
            if(previewText) {
                previewText.textContent = ''; // Clear subtitle by default
            }

            // External commands (handle first)
            if (panel === 'agent') {
                vscode.postMessage({ command: 'openAgent' });
                return; // Exit early for external commands
            } else if (panel === 'search') {
                vscode.postMessage({ command: 'showComponentPicker' });
                return; // Exit early
            } else if (panel === 'chat') {
                vscode.postMessage({ command: 'openChat' });
                return; // Exit early
            }            // Define all relevant panel containers
             const panels = {
                jsFramework: document.getElementById('jsFrameworkContainer'),
                cssFramework: document.getElementById('cssFrameworkContainer'),
                layout: document.getElementById('layoutPanel'),
                websiteType: document.getElementById('websiteTypeContainer'),
                components: document.getElementById('elementsPanel'),
                figmadesign: document.getElementById('mcpDesignPanel'), // Map 'figmadesign' to the new panel ID
                documentation: document.getElementById('documentationPanel') // Add documentation panel
            };

            // Hide all panels first
             Object.values(panels).forEach(p => {
                if (p) {
                    p.classList.add('hidden');
                    p.classList.remove('visible'); // Ensure 'visible' class is removed too
                }
            });

            // Show the relevant panel based on the clicked icon's data-panel attribute
             if (panel === 'framework') {
                if (panels.jsFramework) {
                     panels.jsFramework.classList.remove('hidden');
                     panels.jsFramework.classList.add('visible');
                }
                // Show CSS panel if JS already selected
                if (state.framework.selectedJS && panels.cssFramework) {
                    panels.cssFramework.classList.remove('hidden');
                    panels.cssFramework.classList.add('visible');
                }
                initializeFrameworkButtons(); 

                // Show and populate filter nav for framework panel
                if(filterNav) {
                     filterNav.style.display = ''; // Show filter nav (reset to default display)
                }
                if(previewText) {
                     previewText.textContent = 'Select frameworks and a component category.';
                }
                // Fetch categories which updates filters, then show cards
                fetchAvailableCategories().then(() => {
                    if (state.framework.selectedJS && state.framework.selectedCSS) {
                        showFrameworkCards(state.framework.selectedCSS, state.framework.selectedCategory || 'all');
                    } else if (state.framework.selectedJS) {
                        renderFolderStructure(state.framework.selectedJS);
                    } else {
                        if(previewGrid) previewGrid.innerHTML = '<p>Select a JavaScript framework.</p>';
                    }
                });

            } else if (panel === 'layout') {
                 if (panels.layout) {
                     panels.layout.classList.remove('hidden');
                     panels.layout.classList.add('visible');
                 }
                 if(previewText) previewText.textContent = 'Configure layout options.';
                // Render structure on panel load
                 renderFolderStructure(state.layout.selectedLayout || layoutOptions[0]); // Show structure for current or default
                 initializeLayoutOptions(); 

            } else if (panel === 'content') { 
                if (panels.websiteType) {
                     panels.websiteType.classList.remove('hidden');
                     panels.websiteType.classList.add('visible');
                 }
                  if(previewText) previewText.textContent = 'Select a website type.';
                 if (previewGrid) previewGrid.innerHTML = '<p>Select a website type.</p>';
                 initializeWebsiteTypeButtons();            }  else if (panel === 'figmadesign') { // 4th icon -> MCP/Design Options
                if (panels.figmadesign) { 
                     panels.figmadesign.classList.remove('hidden');
                     panels.figmadesign.classList.add('visible');
                 }
                 if(previewText) previewText.textContent = 'Choose a figmadesign style or check status.';
                 if (previewGrid) previewGrid.innerHTML = '<p>Select an MCP / Design Option.</p>';
                 initializeMcpDesignPanel();            } else if (panel === 'documentation') { // Documentation panel
                if (panels.documentation) {
                    panels.documentation.classList.remove('hidden');
                    panels.documentation.classList.add('visible');
                }
                if(previewText) previewText.textContent = 'Browse documentation, tutorials, and examples.';
                
                // Initialize documentation panel and display default content
                initializeDocumentationPanel();
                
                // Show default documentation content or previously selected
                if (previewGrid) {
                    // Use previously selected doc type or default to API Reference
                    const docType = state.selectedDocType || 'API Reference';
                    // Update state to ensure consistency
                    state.selectedDocType = docType;
                    // Show documentation content
                    previewGrid.innerHTML = showDocumentationContent(docType);
                    
                    // Update the active button in the doc options
                    const docButtons = document.querySelectorAll('#documentationPanel .flat-button');
                    docButtons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.getAttribute('data-doc-type') === docType) {
                            btn.classList.add('active');
                        }
                    });
                }
            }else {
                // Default case or handle other panels
                if(previewText) previewText.textContent = 'Select an option from the sidebar.';
                if (previewGrid) previewGrid.innerHTML = '<p>Select an option from the sidebar.</p>';
            }
        }

        // Update updateSelection to handle selector strings and use querySelectorAll for buttons
        function updateSelection(containerIdOrSelector, selected) {
            // Use standard string concatenation for logs
            console.log('[updateSelection] Called with selector: "' + containerIdOrSelector + '", selected value: "' + selected + '"'); 
            let container = document.getElementById(containerIdOrSelector);
            if (!container) {
                 container = document.querySelector(containerIdOrSelector);
            }
            
            if (!container) {
                console.error("[updateSelection] Container not found for selector:", containerIdOrSelector); 
                return;
            }

            // Look for option-button class or element-button class
            const buttons = container.querySelectorAll('.option-button, .element-button'); 
            console.log('[updateSelection] Found ' + buttons.length + ' buttons to process'); 
            
            buttons.forEach(button => { 
                console.log('[updateSelection] Checking button: "' + button.textContent.trim() + '" against selected: "' + selected + '"'); 
                button.classList.remove('selected');
                // Trim whitespace for more reliable comparison
                if (button.textContent.trim() === selected.trim()) {
                    console.log('[updateSelection] Match found! Adding .selected class to: "' + button.textContent.trim() + '"'); 
                    button.classList.add('selected');
                }
            });
        }

        function initializeFilters() {
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!state.selectedCSS) return;
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.textContent.toLowerCase();
                    state.selectedCategory = filter;
                    showFrameworkCards(state.selectedCSS, filter);
                });
            });
        }        function handleGenerateCode() {
            console.log('Generate button clicked');
            console.log('Current state:', state);
            
            // First check which panel is active to determine the appropriate action
            if (state.activePanel === 'layout' && state.layout.selectedLayout) {
                const selectedLayout = state.layout.selectedLayout;
                console.log('Selected layout: ' + selectedLayout);
                
                // Handle different layout combinations
                if (selectedLayout === "React + Tailwind CSS") {
                    console.log('React + Tailwind CSS layout selected, posting message to extension host...');
                    vscode.postMessage({
                        command: 'setupReactTailwind'
                    });
                    return;
                } else if (selectedLayout === "React + Bootstrap") {
                    console.log('React + Bootstrap layout selected, posting message to extension host...');
                    vscode.postMessage({
                        command: 'setupReactBootstrap'
                    });
                    return;
                } else if (selectedLayout === "Next.js + Tailwind CSS") {
                    console.log('Next.js + Tailwind CSS layout selected, posting message to extension host...');
                    vscode.postMessage({
                        command: 'setupNextjsTailwind'
                    });
                    return;
                } else if (selectedLayout === "Next.js + Bootstrap") {
                    console.log('Next.js + Bootstrap layout selected, posting message to extension host...');
                    vscode.postMessage({
                        command: 'setupNextjsBootstrap'
                    });
                    return;
                }
            } else if (state.activePanel === 'framework') {
                // If in framework panel, check for component selection
                if (!state.selectedComponentCode || !state.filePath) {
                    vscode.postMessage({
                        command: 'error',
                        message: 'Please select a component first'
                    });
                    return;
                }
            } else {
                // If no layout is selected and not in framework panel, show generic message
                vscode.postMessage({
                    command: 'error',
                    message: 'Please select a component or layout option first'
                });
                return;
            }

            // Data for creating the component file
            const createFileMessage = {
                command: 'createComponentFile',
                filePath: state.filePath,
                componentCode: state.selectedComponentCode,
                title: state.selectedComponentTitle || "unknown",
                dependencies: state.selectedDependencies || [],
                language: state.selectedLanguage || "JavaScript",
                framework: state.selectedFramework || "React",
                cssFramework: state.selectedCssFramework || "unknown",
                category: state.selectedCategory || "unknown",
                type: state.selectedType || "unknown",
                difficulty: state.selectedDifficulty || "unknown",
                hasAnimation: state.selectedHasAnimation || false,
                apiData: state.selectedComponentData || {}
            };
            vscode.postMessage(createFileMessage);

            // Data for the AutoGen prompt, sourced from state
            const componentDataForPrompt = {
                title: state.selectedComponentTitle || "unknown",
                filePath: state.filePath, // Use state.filePath which is already validated
                dependencies: state.selectedDependencies || [],
                language: state.selectedLanguage || "JavaScript",
                framework: state.selectedFramework || "React",
                cssFramework: state.selectedCssFramework || "unknown",
                category: state.selectedCategory || "unknown",
                type: state.selectedType || "unknown",
                difficulty: state.selectedDifficulty || "unknown",
                hasAnimation: state.selectedHasAnimation || false
            };

            const prompt = "Analyze the newly generated component with the following details:\\n" +
                "- Title: " + componentDataForPrompt.title + "\\n" +
                "- File path: " + componentDataForPrompt.filePath + "\\n" +
                "- Dependencies: " + JSON.stringify(componentDataForPrompt.dependencies) + "\\n" +
                "- Language: " + componentDataForPrompt.language + "\\n" +
                "- Framework: " + componentDataForPrompt.framework + "\\n" +
                "- CSS Framework: " + componentDataForPrompt.cssFramework + "\\n" +
                "- Category: " + componentDataForPrompt.category + "\\n" +
                "- Type: " + componentDataForPrompt.type + "\\n" +
                "- Difficulty: " + componentDataForPrompt.difficulty + "\\n" +
                "- Has animation: " + componentDataForPrompt.hasAnimation + "\\n" +
                "Please check the file, install any dependencies if needed, fix imports and navigation, run the project, and make any necessary adjustments based on this component data.";

            vscode.postMessage({
                command: 'initializePrompt',
                prompt: prompt
            });
        }

        // New function to initialize layout option buttons
        function initializeLayoutOptions() {
            const layoutContainer = document.getElementById('layoutOptions');
            if (layoutContainer) {
                layoutContainer.innerHTML = ''; // Clear previous options
                layoutOptions.forEach(option => {
                    const button = document.createElement('button');
                    button.className = 'option-button'; // Reuse existing button style
                    button.textContent = option;
                    button.addEventListener('click', () => handleSelection('layoutOption', option)); // Use a unique type
                    layoutContainer.appendChild(button);
                });
                // Apply selected state if returning to this panel
                if (state.layout.selectedLayout) {
                    updateSelection('layoutOptions', state.layout.selectedLayout);
                }
            }
        }

        // Renamed back to initializeTemplatesPanel
        function initializeTemplatesPanel() {
            const templatesContainer = document.querySelector('#elementsPanel .elements-list');
            if (templatesContainer) {
                templatesContainer.innerHTML = ''; // Clear previous options
                templateCategories.forEach(category => { 
                    const button = document.createElement('button');
                    button.className = 'option-button'; // Start with base class
                    button.textContent = category;
                    // Remove the check for selected state during creation
                    // if (category === state.selectedTemplateCategory) {
                    //    button.classList.add('selected'); 
                    // }
                    button.addEventListener('click', () => handleSelection('templateCategory', category)); 
                    templatesContainer.appendChild(button);
                });
                // Restore the updateSelection call to handle returning to the panel
                if (state.selectedTemplateCategory) {
                    updateSelection('#elementsPanel .elements-list', state.selectedTemplateCategory);
                }
            }
        }

        // Function to initialize Website Type buttons (for 'content' panel)
        function initializeWebsiteTypeButtons() {
            const websiteTypeContainer = document.getElementById('websiteTypeButtons');
            if (websiteTypeContainer) {
                websiteTypeContainer.innerHTML = ''; // Clear previous options
                websiteTypes.forEach(type => {
                    const button = document.createElement('button');
                    button.className = 'option-button'; // Reuse existing button style
                    button.textContent = type;
                    button.addEventListener('click', () => handleSelection('websiteTypeOption', type)); // Use a unique type
                    websiteTypeContainer.appendChild(button);
                });
                // Apply selected state if returning to this panel
                if (state.layout.selectedWebsiteType) { // Assuming state is stored here
                    updateSelection('websiteTypeButtons', state.layout.selectedWebsiteType);
                }
            }
        }        // This function has been moved to DesignPanel.ts and is now being imported

        function initializeMcpDesignPanel() {
            const designContainer = document.getElementById('mcpDesignOptions');
            if (designContainer) {
                designContainer.innerHTML = ''; // Clear previous options
                mcpDesignOptions.forEach(option => {
                    const button = document.createElement('button');
                    button.className = 'option-button'; // Reuse existing button style
                    button.textContent = option;
                    button.addEventListener('click', () => handleSelection('mcpDesignOption', option)); // Use a unique type
                    designContainer.appendChild(button);
                });
                // Apply selected state if returning to this panel
                if (state.selectedMcpDesignOption) {
                    updateSelection('mcpDesignOptions', state.selectedMcpDesignOption);
                }
            }
        }        // Function to initialize Documentation panel options
        function initializeDocumentationPanel() {
            const docContainer = document.getElementById('documentationPanel');
            if (docContainer) {
                // Add event listeners to documentation option buttons
                const docButtons = docContainer.querySelectorAll('.flat-button');
                if (docButtons.length > 0) {
                    docButtons.forEach(button => {
                        const docType = button.getAttribute('data-doc-type');
                        if (docType) {
                            button.addEventListener('click', () => {
                                // Remove active class from all buttons
                                docButtons.forEach(btn => btn.classList.remove('active'));
                                // Add active class to clicked button
                                button.classList.add('active');
                                // Handle the selection
                                handleSelection('docType', docType);
                            });
                            
                            // Apply active state if returning to this panel with a previously selected doc type
                            if (docType === state.selectedDocType) {
                                button.classList.add('active');
                            }
                        }
                    });
                }
                
                // If no doc type has been selected yet, select the default "API Reference"
                if (!state.selectedDocType) {
                    const defaultButton = docContainer.querySelector('[data-doc-type="API Reference"]');
                    if (defaultButton) {
                        state.selectedDocType = "API Reference";
                        defaultButton.classList.add('active');
                        // Trigger content display for the default selection
                        handleSelection('docType', "API Reference");
                    }
                }
            }
        }
    `;
}

function getNonce(): string {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Single export statement at the end
export { ExtensionView };
