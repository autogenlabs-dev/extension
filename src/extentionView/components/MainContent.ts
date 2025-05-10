export function getMainContentHtml(): string {
    return `
    <div class="main-content">
        <div class="components-panel">
            <h2 class="section-title">AutoGen Code Builder</h2>
            <div id="jsFrameworkContainer" class="framework-section visible">
                <h3>JavaScript Frameworks</h3>
                <div id="jsFrameworkButtons" class="button-container"></div>
            </div>
            <div id="cssFrameworkContainer" class="framework-section hidden">
                <h3>CSS Frameworks</h3>
                <div id="cssFrameworkButtons" class="button-container"></div>
            </div>
            <div id="layoutPanel" class="framework-section hidden">
                <h3>Layout Options</h3>
                <div id="layoutOptions"></div>
            </div>
            <div id="websiteTypeContainer" class="framework-section hidden">
                <h3></h3>
                <div id="websiteTypeButtons"></div>
            </div>


               <button id="debugButton" class="debug-button">
            Generate Code
        </button>
        </div>

        <div class="preview-area">
            <div class="preview-container">
                <div class="preview-header">
                    <h3 class="preview-title">Preview Area</h3>
                    <p id="previewText" class="preview-subtitle">Select options to configure your components.</p>
                    <nav class="filter-nav">
                        <!-- Filter buttons will be added dynamically -->
                    </nav>
                </div>
                <div id="previewGrid" class="showcase-grid"></div>
                <div id="consoleOutput" class="console-output"></div>
            </div>
        </div>

     

        <button id="openChatButton" class="chat-button-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Open Chat
        </button>
    </div>`;
}
