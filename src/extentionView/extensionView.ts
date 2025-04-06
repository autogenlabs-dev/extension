import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getSidebarHtml } from "./components/Sidebar";
import { getMainContentHtml } from "./components/MainContent";
import { websiteTemplates } from "./websiteTemplates/websiteTemplates";
import {
    showTypeCards,
    handleWebsiteTypeSelection,
} from "./websiteTemplates/websiteTemplatesHelper";

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

                            try {
                                // Clean up the file path to remove leading slash and fix project name
                                const cleanPath = message.filePath.replace(/^\/vs-code-extension/, '');
                                const targetPath = path.join(vscode.workspace.rootPath, cleanPath);
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
                                }

                            } catch (error: any) {
                                console.error("File creation error:", error);
                                throw error;
                            }
                            break;

                        default:
                            console.log("Unknown command:", message.command);
                    }
                } catch (error: any) {
                    console.error("Error in ExtensionView:", error);
                    vscode.window.showErrorMessage(`Failed to create component: ${error.message}`);
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

function getScriptContent(): string {
    return `
        const vscode = acquireVsCodeApi();
        const BASE_URL = "http://localhost:5000";
        const API_ENDPOINT = "/api/extension/designs";

        // Define constants at the top
        const jsFrameworks = ['React', 'Next.js', 'Vue'];
        const cssFrameworks = ['Tailwind CSS', 'Bootstrap', 'Custom CSS'];
        const websiteTypes = ['E-commerce', 'Portfolio', 'Blog'];

        const state = {
            selectedJS: '',
            selectedCSS: '',
            selectedWebsiteType: '',
            selectedComponents: [],
            selectedCategory: '',
            selectedComponentCode: null,
            filePath: '',
            availableCategories: []
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
            if (type === 'js') {
                state.selectedJS = value;
                const cssContainer = document.getElementById('cssFrameworkContainer');
                if (cssContainer) {
                    cssContainer.classList.remove('hidden');
                    updateSelection('jsFrameworkButtons', value);
                }
            } else if (type === 'css') {
                state.selectedCSS = value;
                updateSelection('cssFrameworkButtons', value);
                fetchAvailableCategories().then(() => {
                    showFrameworkCards(value, 'all');
                });
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

            state.selectedCategory = category;
            showFrameworkCards(state.selectedCSS, category);
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

            document.querySelectorAll('.sidebar-icon').forEach(icon => {
                icon.classList.remove('active');
            });
            event.currentTarget.classList.add('active');

            if (panel === 'agent') {
                vscode.postMessage({ command: 'openAgent' });
                return;
            }

            const containers = {
                framework: document.getElementById('jsFrameworkContainer'),
                css: document.getElementById('cssFrameworkContainer'),
                websiteType: document.getElementById('websiteTypeContainer')
            };

            Object.values(containers).forEach(container => {
                if (container) container.classList.add('hidden');
            });

            if (panel === 'framework') {
                containers.framework.classList.remove('hidden');
                if (state.selectedJS) {
                    containers.css.classList.remove('hidden');
                    if (state.selectedCSS) {
                        showFrameworkCards(state.selectedCSS);
                    }
                }
            } else if (panel === 'layout') {
                containers.websiteType.classList.remove('hidden');
                document.getElementById('previewGrid').innerHTML = '';
            } else if (panel === 'search') {
                vscode.postMessage({ command: 'showComponentPicker' });
            } else if (panel === 'chat') {
                vscode.postMessage({ command: 'openChat' });
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
                componentCode: state.selectedComponentCode
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
