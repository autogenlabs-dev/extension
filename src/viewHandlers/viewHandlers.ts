import * as vscode from "vscode";
import path from "path";
import fs from "fs";

// Update the FRAMEWORK_REPOS with type

type FrameworkConfig = {
  owner: string;
  repo: string;
  branch: string;
  pathTemplate: string;
};

type FrameworkRepos = {
  [key in "React" | "Next.js" | "Vue"]: FrameworkConfig;
};
const FRAMEWORK_REPOS: FrameworkRepos = {
  React: {
    owner: "TailGrids",
    repo: "tailgrids-react",
    branch: "main",
    pathTemplate: "src/components/{component}/index.jsx",
  },
  "Next.js": {
    owner: "TailGrids",
    repo: "tailgrids-nextjs",
    branch: "main",
    pathTemplate: "src/components/{component}/index.jsx",
  },
  Vue: {
    owner: "TailGrids",
    repo: "tailgrids-vue",
    branch: "main",
    pathTemplate: "src/components/{component}/index.vue",
  },
};

//
export async function handleSelectedOptions(options: {
  JavaScript_Framework: keyof FrameworkRepos;
  CSS_Framework: string;
  Website_Type: string;
  Selected_Category: string;
  Selected_Components: string[];
}): Promise<void> {
  console.log("Selected Options Data:", {
    Framework: options.JavaScript_Framework,
    CSS: options.CSS_Framework,
    Website: options.Website_Type,
    Category: options.Selected_Category,
    Components: options.Selected_Components,
  });

  try {
    if (!vscode.workspace.rootPath) {
      throw new Error("No workspace found!");
    }

    // Get repository config based on selected framework
    const framework = options.JavaScript_Framework;
    const repoConfig = FRAMEWORK_REPOS[framework];

    if (!repoConfig) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    // Create directory structure
    const srcDir = path.join(vscode.workspace.rootPath, "src");
    const componentsDir = path.join(srcDir, "components");

    [srcDir, componentsDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Process each selected component
    for (const component of options.Selected_Components) {
      const componentDir = path.join(componentsDir, component);
      if (!fs.existsSync(componentDir)) {
        fs.mkdirSync(componentDir, { recursive: true });
      }

      const filePath = repoConfig.pathTemplate.replace(
        "{component}",
        component
      );
      const url = `https://raw.githubusercontent.com/${repoConfig.owner}/${repoConfig.repo}/${repoConfig.branch}/${filePath}`;

      console.log(`Fetching component from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `API call failed for ${component} with status: ${response.status}`
        );
      }

      const componentContent = await response.text();
      const extension = framework === "Vue" ? ".vue" : ".jsx";
      const componentPath = path.join(componentDir, `index${extension}`);
      fs.writeFileSync(componentPath, componentContent, "utf-8");

      console.log(`${component} component written to: ${componentPath}`);
    }

    vscode.window.showInformationMessage(
      `Components created successfully for ${framework}!`
    );
  } catch (error: any) {
    console.error("Error in component creation:", error);
    throw new Error(`Component creation failed: ${error.message}`);
  }
}
