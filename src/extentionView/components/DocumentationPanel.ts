
/**
 * Shows documentation content based on the selected documentation type
 * @param docType The type of documentation to show
 * @returns HTML string for the documentation content
 */
export function showDocumentationContent(docType: string): string {
    // If no docType is selected, default to "API Reference"
    const selectedDocType = docType || "API Reference";
    
    console.log("Showing documentation for:", selectedDocType);
    
    // Default content for documentation
    let html = '<div class="doc-container">';
    
    switch (docType) {
        case 'API Reference':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>API Reference</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-section">
                            <h4>Getting Started</h4>
                            <p>This API reference provides the details of all available endpoints and methods.</p>
                            <code>import { AutoGen } from '@autogen/sdk';</code>
                        </div>
                        <div class="doc-section">
                            <h4>AutoGen Components</h4>
                            <ul>
                                <li><strong>AutoGenProvider</strong>: Core provider for AI functionality</li>
                                <li><strong>ExtensionView</strong>: UI component for VS Code extension</li>
                                <li><strong>ChatContent</strong>: Chat interface component</li>
                            </ul>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">View Full API Reference</button>
                    </div>
                </div>`;
            break;
            
        case 'Tutorials':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Getting Started Tutorial</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-section">
                            <h4>1. Installation</h4>
                            <p>To get started with AutoGen, install the package:</p>
                            <code>npm install @autogen/sdk</code>
                        </div>
                        <div class="doc-section">
                            <h4>2. Create your first component</h4>
                            <p>Follow these steps to create your first component:</p>
                            <ol>
                                <li>Select a JS framework from the sidebar</li>
                                <li>Choose a CSS framework</li>
                                <li>Browse available components</li>
                                <li>Click "Generate Code" to create your component</li>
                            </ol>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">Next Tutorial</button>
                    </div>
                </div>`;
            break;
            
        case 'Examples':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Example Projects</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-example-card">
                            <h4>React Dashboard</h4>
                            <p>Complete dashboard example with charts, tables and navigation.</p>
                            <button class="doc-button-small">View Example</button>
                        </div>
                        <div class="doc-example-card">
                            <h4>Next.js Landing Page</h4>
                            <p>Modern landing page template with animations and responsive design.</p>
                            <button class="doc-button-small">View Example</button>
                        </div>
                        <div class="doc-example-card">
                            <h4>Vue E-commerce</h4>
                            <p>Full e-commerce template with product listings and cart functionality.</p>
                            <button class="doc-button-small">View Example</button>
                        </div>
                    </div>
                </div>`;
            break;
            
        case 'Updates':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Latest Updates</h3>
                        <span class="doc-date">May 10, 2025</span>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-update-item">
                            <h4>Version 2.3.0 Released</h4>
                            <p>New features include improved component generation, better AI integration, and more framework support.</p>
                            <ul>
                                <li>Added support for Qwik framework</li>
                                <li>Improved code generation accuracy</li>
                                <li>Enhanced documentation and examples</li>
                            </ul>
                        </div>
                        <div class="doc-update-item">
                            <h4>Coming Soon: Integration with Design Tools</h4>
                            <p>In the next release, we'll be adding support for importing designs directly from Figma and Adobe XD.</p>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">View All Updates</button>
                    </div>
                </div>`;
            break;
            
        default:
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Documentation</h3>
                    </div>
                    <div class="doc-card-content">
                        <p>Select a documentation category from the options above.</p>
                        <div class="doc-categories">
                            <div class="doc-category-item">
                                <h4>API Reference</h4>
                                <p>Complete API documentation for developers</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Tutorials</h4>
                                <p>Step-by-step guides to get started</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Examples</h4>
                                <p>Browse example projects and templates</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Updates</h4>
                                <p>Latest changes and upcoming features</p>
                            </div>
                        </div>
                    </div>
                </div>`;
    }
    
    html += '</div>';
    return html;
}

/**
 * Gets the html for the documentation panel
 * @returns HTML string for documentation panel
 */
export function getDocumentationPanelHtml(): string {
    return `
    <div id="documentationPanel" class="framework-section hidden">
        <h3>Documentation</h3>
        <div class="doc-options-wrapper">
            <button class="flat-button active" data-doc-type="API Reference">API Reference</button>
            <button class="flat-button" data-doc-type="Tutorials">Tutorials</button>
            <button class="flat-button" data-doc-type="Examples">Examples</button>
            <button class="flat-button" data-doc-type="Updates">Updates</button>
        </div>
        <div id="docContentContainer" class="doc-content-container">
            <!-- Documentation content will be loaded here -->
        </div>
    </div>`;
}
