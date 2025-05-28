import { getSettingsPanelHtml } from "./SettingsPanel";
import { getDocumentationPanelHtml } from "./DocumentationPanel";
import { getWebsiteTemplatesPanelHtml } from "./WebsiteTemplatesPanel";

export function getMainContentHtml(): string {
    return `
    <div class="main-content">
        <div class="components-panel">
            <h2 class="section-title">AutoGen Code Builder</h2>
            
            <!-- Framework Selection Panels -->
            <div id="jsFrameworkContainer" class="framework-section visible">
                <h3>JavaScript Frameworks</h3>
                <div id="jsFrameworkButtons" class="button-container"></div>
            </div>
            
            <div id="cssFrameworkContainer" class="framework-section hidden">
                <h3>CSS Frameworks</h3>
                <div id="cssFrameworkButtons" class="button-container"></div>
            </div>
            
            <!-- Layout Options Panel -->
            <div id="layoutPanel" class="framework-section hidden">
                <h3>Layout Options</h3>
                <div id="layoutOptions"></div>
            </div>
            
            <!-- Website Type Container (for simple website type selection) -->
            <div id="websiteTypeContainer" class="framework-section hidden">
                <h3>Website Types</h3>
                <div id="websiteTypeButtons" class="button-container"></div>
            </div>
            
            <!-- Website Templates Panel (separate from website types) -->
            ${getWebsiteTemplatesPanelHtml()}
            
            <!-- Design Options Panel -->
            <div id="mcpDesignPanel" class="framework-section hidden">
                <h3>Design Options</h3>
                <div id="mcpDesignOptions" class="button-container"></div>
            </div>
            
            <!-- Documentation Panel -->
            ${getDocumentationPanelHtml()}
            
            <!-- Settings Panel -->
            ${getSettingsPanelHtml()}

            <!-- Generate Button -->
            <button id="debugButton" class="debug-button">
                Generate Code
            </button>
        </div>

        <div class="preview-area">
            <div class="preview-container">
                <div class="preview-header">
                    <h3 class="preview-title">Preview</h3>
                    <p id="previewText" class="preview-subtitle"></p>
                    <nav class="filter-nav">
                        <!-- Filter buttons will be added dynamically -->
                    </nav>
                </div>
                
                <!-- Main content display areas -->
                <div id="previewGrid" class="showcase-grid"></div>
                <div id="docContentContainer" class="doc-content-container hidden"></div>
                <div id="websiteTemplatesContentContainer" class="doc-content-container hidden"></div>
                <div id="consoleOutput" class="console-output"></div>
            </div>
        </div>

        <!-- Chat Button -->
        <button id="openChatButton" class="chat-button-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
        </button>
    </div>`;
}
