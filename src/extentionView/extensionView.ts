import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getSidebarHtml } from "./components/Sidebar";
import { getMainContentHtml } from "./components/MainContent";
// Import AutoGenProvider to access its static methods and potentially types
import { AutoGenProvider } from "../core/webview/AutogenProvider"; // Added import

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
                                }
                            }
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

    private async createComponentFile(
        category: string,
        componentName: string,
        componentCode: string
    ) {
        if (!vscode.workspace.rootPath) {
            throw new Error("No workspace found!");
        }

        // Clean category and component name
        const cleanCategory = category.toLowerCase();
        const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '');

        console.log("Creating component:", {
            category: cleanCategory,
            name: cleanName,
            codeLength: componentCode.length
        });

        // Create directory structure
        const componentsDir = path.join(
            vscode.workspace.rootPath,
            "src",
            "components",
            cleanCategory
        );

        // Ensure directory exists
        fs.mkdirSync(componentsDir, { recursive: true });

        // Add imports for navbar-specific components if needed
        let finalCode = componentCode;
        if (cleanCategory === 'navbar') {
            finalCode = `import React, { useState } from 'react';
import { Link } from 'react-router-dom';

${componentCode}`;
        }

        // Create component file
        const componentFilePath = path.join(componentsDir, `${cleanName}.tsx`);
        fs.writeFileSync(componentFilePath, finalCode, "utf-8");

        // Show success message
        vscode.window.showInformationMessage(
            `Component ${cleanName} created successfully in ${cleanCategory} category!`
        );

        return componentFilePath;
    }

    private async createFile(filePath: string, code: string): Promise<void> {
        if (!vscode.workspace.rootPath) {
            throw new Error("No workspace found!");
        }

        // Create full path
        const fullPath = path.join(vscode.workspace.rootPath, filePath);
        const targetDir = path.dirname(fullPath);

        // Create directories if they don't exist
        if (!fs.existsSync(targetDir)) {
            console.log(`Creating directory: ${targetDir}`);
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Write file
        console.log(`Writing file: ${fullPath}`);
        fs.writeFileSync(fullPath, code, 'utf-8');

        // Verify file was created
        if (fs.existsSync(fullPath)) {
            console.log(`File created successfully: ${fullPath}`);
            return;
        }
        throw new Error("Failed to create file");
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

// Function to generate documentation HTML
function getDocumentationHtml(): string {
    // Use string concatenation to avoid issues with template literals within template literals
    let html = '<div style="padding: 20px; color: #e5e7eb;">';
    html += '<h2 style="font-size: 1.5rem; margin-bottom: 16px; color: #60a5fa;">Documentation</h2>';
    
    html += '<div style="margin-bottom: 24px;">';
    html += '<h3 style="font-size: 1.2rem; margin-bottom: 8px; color: #f9fafb;">Getting Started</h3>';
    html += '<p style="line-height: 1.6; margin-bottom: 12px;">';
    html += 'This extension helps you build components and applications quickly using pre-built templates and components.';
    html += '</p>';
    html += '<p style="line-height: 1.6; margin-bottom: 12px;">';
    html += 'Use the sidebar icons to navigate between different features:';
    html += '</p>';
    html += '<ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 16px;">';
    html += '<li style="margin-bottom: 8px;">Framework - Select frameworks and components</li>';
    html += '<li style="margin-bottom: 8px;">Layout - View and customize project structure</li>';
    html += '<li style="margin-bottom: 8px;">Components - Browse GitHub repositories</li>';
    html += '<li style="margin-bottom: 8px;">Documentation - You are here!</li>';
    html += '<li style="margin-bottom: 8px;">Content - Manage content for your project</li>';
    html += '</ul>';
    html += '</div>';
    
    html += '<div style="margin-bottom: 24px;">';
    html += '<h3 style="font-size: 1.2rem; margin-bottom: 8px; color: #f9fafb;">Using Components</h3>';
    html += '<p style="line-height: 1.6; margin-bottom: 12px;">';
    html += '1. Select a JavaScript and CSS framework in the Framework tab';
    html += '</p>';
    html += '<p style="line-height: 1.6; margin-bottom: 12px;">';
    html += '2. Browse available components by category';
    html += '</p>';
    html += '<p style="line-height: 1.6; margin-bottom: 12px;">';
    html += '3. Click on a component to select it';
    html += '</p>';
    html += '<p style="line-height: 1.6; margin-bottom: 12px;">';
    html += '4. Click "Generate Code" to add the component to your project'; // Escaped quotes
    html += '</p>';
    html += '</div>';
    
    html += '<div style="margin-bottom: 24px;">';
    html += '<h3 style="font-size: 1.2rem; margin-bottom: 8px; color: #f9fafb;">Additional Resources</h3>';
    html += '<p style="line-height: 1.6; margin-bottom: 12px;">';
    html += 'For more information, visit the following resources:';
    html += '</p>';
    html += '<ul style="list-style-type: disc; padding-left: 20px;">';
    html += '<li style="margin-bottom: 8px;"><a href="#" style="color: #60a5fa; text-decoration: underline;">Extension Documentation</a></li>';
    html += '<li style="margin-bottom: 8px;"><a href="#" style="color: #60a5fa; text-decoration: underline;">GitHub Repository</a></li>';
    html += '<li style="margin-bottom: 8px;"><a href="#" style="color: #60a5fa; text-decoration: underline;">Report Issues</a></li>';
    html += '</ul>';
    html += '</div>';
    html += '</div>';
    return html;
}


function getScriptContent(): string {
    // Get the documentation HTML as a string
    const documentationHtmlString = getDocumentationHtml();

    return `
        const vscode = acquireVsCodeApi();
        // Store the documentation HTML in a JS variable, escaping backticks
        const documentationHtml = \`${documentationHtmlString.replace(/`/g, '\\`')}\`; 

        function renderFolderStructure(framework) {
            const previewGrid = document.getElementById('previewGrid');
            if (!previewGrid) return;
            // Only show in layout tab
            if (state.activePanel !== 'layout') return;
            previewGrid.innerHTML = '';

            // Example folder structure for React and Next.js
            let structure = [];
            if (framework === 'Next.js') {
                structure = [
                    { name: 'my-next-app/', children: [
                        { name: 'pages/', children: [
                            { name: 'index.tsx' },
                            { name: 'about.tsx' }
                        ]},
                        { name: 'components/', children: [
                            { name: 'Header.tsx' },
                            { name: 'Footer.tsx' }
                        ]},
                        { name: 'public/', children: [
                            { name: 'favicon.ico' }
                        ]},
                        { name: 'styles/', children: [
                            { name: 'globals.css' }
                        ]},
                        { name: 'package.json' },
                        { name: 'tsconfig.json' }
                    ]}
                ];
            } else {
                // Default to React
                structure = [
                    { name: 'my-react-app/', children: [
                        { name: 'src/', children: [
                            { name: 'components/', children: [
                                { name: 'Header.tsx' },
                                { name: 'Footer.tsx' }
                            ]},
                            { name: 'App.tsx' },
                            { name: 'index.tsx' }
                        ]},
                        { name: 'public/', children: [
                            { name: 'index.html' }
                        ]},
                        { name: 'package.json' },
                        { name: 'tsconfig.json' }
                    ]}
                ];
            }

            function renderTree(nodes, level = 0) {
                let html = '<ul style="list-style:none;padding-left:' + (level * 20) + 'px">';
                for (const node of nodes) {
                    html += '<li style="margin:4px 0;">';
                    html += '<span style="font-family:monospace;">' + node.name + '</span>';
                    if (node.children) {
                        html += renderTree(node.children, level + 1);
                    }
                    html += '</li>';
                }
                html += '</ul>';
                return html;
            }

            // No heading for layout tab
            previewGrid.innerHTML =
                '<div style="padding:16px;">' +
                renderTree(structure) +
                '</div>';
        }
        const BASE_URL = "http://localhost:5000";
        const API_ENDPOINT = "/api/extension/designs";

        // Define constants at the top
        const jsFrameworks = ['React', 'Next.js', 'Vue'];
        const cssFrameworks = ['Tailwind CSS', 'Bootstrap', 'Custom CSS'];
        const websiteTypes = ['E-commerce', 'Portfolio', 'Blog'];

        // Separate state for each sidebar icon functionality
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
                selectedWebsiteType: ''
            },
            
            // Shared state for component selection
            selectedComponents: [],
            selectedComponentCode: null,
            filePath: ''
        };

        // Main initialization function
        function initializeUI() {
            // Initialize framework buttons immediately
            initializeFrameworkButtons();
            // Initialize filters
            initializeFilters();
            // Initialize other buttons
            initializeButtons();
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
                icon.addEventListener('click', (event) => {
                    const panel = icon.getAttribute('data-panel');
                    if (panel) handleSidebarClick(panel);
                });
            });
        }

        function handleSelection(type, value) {
            console.log('Selection:', type, value);
            
            // Store selection in the appropriate panel's state
            if (state.activePanel === 'framework') {
                if (type === 'js') {
                    state.framework.selectedJS = value;
                    const cssContainer = document.getElementById('cssFrameworkContainer');
                    if (cssContainer) {
                        cssContainer.style.display = ''; // Show CSS container
                        updateSelection('jsFrameworkButtons', value);
                    }
                    // Immediately show the structure for the selected JS framework
                    showFrameworkCards(value);
                } else if (type === 'css') {
                    state.framework.selectedCSS = value;
                    updateSelection('cssFrameworkButtons', value);
                    fetchAvailableCategories().then(() => {
                        showFrameworkCards(value, 'all');
                    });
                }
            } else if (state.activePanel === 'layout') {
                if (type === 'js') {
                    state.layout.selectedJS = value;
                    updateSelection('jsFrameworkButtons', value);
                    const cssContainer = document.getElementById('cssFrameworkContainer');
                     if (cssContainer) {
                        cssContainer.style.display = ''; // Show CSS container
                    }
                    // Always show folder structure in layout panel
                    renderFolderStructure(value);
                } else if (type === 'css') {
                    state.layout.selectedCSS = value;
                    updateSelection('cssFrameworkButtons', value);
                    // Still show folder structure, don't fetch components
                    renderFolderStructure(state.layout.selectedJS);
                } else if (type === 'websiteType') {
                    state.layout.selectedWebsiteType = value;
                    updateSelection('websiteTypeButtons', value);
                }
            }
        }

        // Ensure initialization happens after DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, initializing UI...');
            initializeUI();

            // On load, show/hide elements based on the initial active panel
            const isFrameworkPanel = state.activePanel === 'framework';
            const isLayoutPanel = state.activePanel === 'layout';
            
            const previewHeader = document.querySelector('.preview-header');
            if (previewHeader) {
                previewHeader.style.display = isFrameworkPanel ? '' : 'none';
            }
            const filterNav = document.querySelector('.filter-nav');
            if (filterNav) {
                filterNav.style.display = isFrameworkPanel ? '' : 'none';
            }
            const debugButton = document.getElementById('debugButton');
            if (debugButton) {
                debugButton.style.display = isFrameworkPanel ? '' : 'none';
            }
            const chatButton = document.getElementById('openChatButton');
            if (chatButton) {
                chatButton.style.display = isFrameworkPanel ? '' : 'none';
            }
            const jsContainer = document.getElementById('jsFrameworkContainer');
             if (jsContainer) {
                jsContainer.style.display = (isFrameworkPanel || isLayoutPanel) ? '' : 'none';
            }
            const cssContainer = document.getElementById('cssFrameworkContainer');
            if (cssContainer) {
                 // Show CSS only if a JS framework is selected in the respective active panel
                 const showCss = (isFrameworkPanel && state.framework.selectedJS) || (isLayoutPanel && state.layout.selectedJS);
                 cssContainer.style.display = showCss ? '' : 'none';
            }
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

        function showElementsPanel() {
            const elementsPanel = document.getElementById('elementsPanel');
            const elementsList = elementsPanel.querySelector('.elements-list');

            elementsList.innerHTML = '';
            elementCategories.forEach(category => {
                const button = document.createElement('button');
                button.className = 'element-button';
                button.textContent = category;
                button.onclick = () => handleElementSelection(category);
                elementsList.appendChild(button);
            });

            elementsPanel.classList.remove('hidden');
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

        function handleSidebarClick(panel) {
            console.log('Sidebar clicked:', panel);

            // Update active icon
            document.querySelectorAll('.sidebar-icon').forEach(icon => {
                icon.classList.remove('active');
            });
            event.currentTarget.classList.add('active');

            // Update active panel in state
            state.activePanel = panel;

            // Toggle visibility based on the active panel
            const isFrameworkPanel = panel === 'framework';
            const isLayoutPanel = panel === 'layout';

            const previewHeader = document.querySelector('.preview-header');
            if (previewHeader) {
                previewHeader.style.display = isFrameworkPanel ? '' : 'none';
            }
            const filterNav = document.querySelector('.filter-nav');
            if (filterNav) {
                filterNav.style.display = isFrameworkPanel ? '' : 'none';
            }
            const debugButton = document.getElementById('debugButton');
            if (debugButton) {
                debugButton.style.display = isFrameworkPanel ? '' : 'none';
            }
            const chatButton = document.getElementById('openChatButton');
            if (chatButton) {
                chatButton.style.display = isFrameworkPanel ? '' : 'none';
            }
             const jsContainer = document.getElementById('jsFrameworkContainer');
             if (jsContainer) {
                jsContainer.style.display = (isFrameworkPanel || isLayoutPanel) ? '' : 'none';
            }
            const cssContainer = document.getElementById('cssFrameworkContainer');
            if (cssContainer) {
                 // Show CSS only if a JS framework is selected in the respective active panel
                 const showCss = (isFrameworkPanel && state.framework.selectedJS) || (isLayoutPanel && state.layout.selectedJS);
                 cssContainer.style.display = showCss ? '' : 'none';
            }


            // Clear preview area for all panels
            const previewGrid = document.getElementById('previewGrid');
            if (previewGrid) {
                previewGrid.innerHTML = '';
            }

            // External commands
            if (panel === 'agent') {
                vscode.postMessage({ command: 'openAgent' });
                return;
            } else if (panel === 'search') {
                vscode.postMessage({ command: 'showComponentPicker' });
                return;
            } else if (panel === 'chat') {
                vscode.postMessage({ command: 'openChat' });
                return;
            }

            // Handle each panel's content rendering
            if (panel === 'framework') {
                // Framework panel (icon 1)
                // Containers are already handled by visibility toggle above
                if (state.framework.selectedJS && state.framework.selectedCSS) {
                    showFrameworkCards(state.framework.selectedCSS);
                } else if (state.framework.selectedJS) {
                     // Show JS framework structure if no CSS framework selected yet
                     renderFolderStructure(state.framework.selectedJS);
                } else {
                     previewGrid.innerHTML = '<p>Please select a JavaScript framework.</p>'; // Initial state
                }
            } else if (panel === 'layout') {
                // Layout panel (icon 2)
                // Containers are already handled by visibility toggle above
                renderFolderStructure(state.layout.selectedJS || 'React');
            } else if (panel === 'components') {
                // Components panel (icon 3) - show GitHub repos with images
                // Inlined logic:
                const repos = [
                    { name: "VSCode Extension Example", description: "A sample VSCode extension repository.", url: "https://github.com/microsoft/vscode-extension-samples", image: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" },
                    { name: "React", description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.", url: "https://github.com/facebook/react", image: "https://raw.githubusercontent.com/facebook/react/main/fixtures/dom/public/react-logo.svg" },
                    { name: "TypeScript", description: "TypeScript is a superset of JavaScript that compiles to clean JavaScript output.", url: "https://github.com/microsoft/TypeScript", image: "https://raw.githubusercontent.com/remojansen/logo.ts/master/ts.png" }
                ];
                const grid = document.createElement('div');
                grid.style.display = 'flex';
                grid.style.flexWrap = 'wrap';
                grid.style.gap = '16px';
                repos.forEach(repo => {
                    const card = document.createElement('div');
                    card.style.width = '260px'; card.style.background = '#1f2937'; card.style.border = '1px solid #374151'; card.style.borderRadius = '10px'; card.style.overflow = 'hidden'; card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; card.style.display = 'flex'; card.style.flexDirection = 'column'; card.style.cursor = 'pointer';
                    card.onclick = () => window.open(repo.url, '_blank');
                    const img = document.createElement('img');
                    img.src = repo.image; img.alt = repo.name; img.style.width = '100%'; img.style.height = '120px'; img.style.objectFit = 'contain'; img.style.background = '#fff'; img.style.padding = '12px';
                    const info = document.createElement('div'); info.style.padding = '16px';
                    const title = document.createElement('h4'); title.textContent = repo.name; title.style.color = '#e5e7eb'; title.style.marginBottom = '8px'; title.style.fontSize = '1.1rem';
                    const desc = document.createElement('p'); desc.textContent = repo.description; desc.style.color = '#9ca3af'; desc.style.fontSize = '0.95rem';
                    info.appendChild(title); info.appendChild(desc);
                    card.appendChild(img); card.appendChild(info);
                    grid.appendChild(card);
                });
                if (previewGrid) previewGrid.appendChild(grid);

            } else if (panel === 'design') {
                // Design panel (icon 4) - show documentation in a card
                previewGrid.innerHTML = '<div class="w-full border rounded-lg overflow-hidden bg-gray-800 border-gray-700" style="margin: 1rem auto; max-width: 90%;">' + documentationHtml + '</div>';
            } else if (panel === 'content') {
                // Content panel (icon 5) - show documentation in a card
                 previewGrid.innerHTML = '<div class="w-full border rounded-lg overflow-hidden bg-gray-800 border-gray-700" style="margin: 1rem auto; max-width: 90%;">' + documentationHtml + '</div>';
            }
        }

        function updateSelection(containerId, selected) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const buttons = container.getElementsByClassName('option-button');
            Array.from(buttons).forEach(button => {
                button.classList.remove('selected');
                if (button.textContent === selected) {
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
        }

        function handleGenerateCode() {
            console.log('Generate button clicked');
            console.log('Current state:', state);

            if (!state.selectedComponentCode || !state.filePath) {
                vscode.postMessage({
                    command: 'error',
                    message: 'Please select a component first'
                });
                return;
            }

            // Use the exact path from API response
            vscode.postMessage({
                command: 'createComponentFile',
                filePath: state.filePath,
                componentCode: state.selectedComponentCode,
                title: state.selectedComponentTitle || "unknown", // Assuming these exist in state now
                dependencies: state.selectedDependencies || [], // Assuming these exist in state now
                language: state.selectedLanguage || "JavaScript", // Assuming these exist in state now
                framework: state.selectedFramework || "React", // Assuming these exist in state now
                cssFramework: state.selectedCssFramework || "unknown", // Assuming these exist in state now
                category: state.selectedCategory || "unknown", // Assuming these exist in state now
                type: state.selectedType || "unknown", // Assuming these exist in state now
                difficulty: state.selectedDifficulty || "unknown", // Assuming these exist in state now
                hasAnimation: state.selectedHasAnimation || false, // Assuming these exist in state now
                // Additional metadata from API response if available
                apiData: state.selectedComponentData || {} // Assuming these exist in state now
            });

            // Construct prompt using state data instead
             const prompt = "Analyze the newly generated component with the following details:\\n" +
                "- Title: " + (state.selectedComponents.length > 0 ? state.selectedComponents[0] : 'unknown') + "\\n" + // Assuming title is stored in selectedComponents
                "- File path: " + state.filePath + "\\n" +
                // Add other relevant state properties if available, otherwise use defaults
                "- Dependencies: []\\n" + 
                "- Language: JavaScript\\n" + 
                "- Framework: " + state.framework.selectedJS + "\\n" +
                "- CSS Framework: " + state.framework.selectedCSS + "\\n" +
                "- Category: " + state.framework.selectedCategory + "\\n" +
                "- Type: unknown\\n" + 
                "- Difficulty: unknown\\n" + 
                "- Has animation: false\\n" + 
                "Please check the file, install any dependencies if needed, fix imports and navigation, run the project, and make any necessary adjustments based on this component data.";


            vscode.postMessage({
                command: 'initializePrompt',
                prompt: prompt
            });
            
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
