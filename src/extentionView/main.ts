export function getMainContentHtml(): string {
    return `
    <div class="main-content">
        <div class="components-panel">
            <h2 class="section-title">AutoGen Code Builder</h2>
            <div id="jsFrameworkContainer" class="framework-section visible">
                <h3>JavaScript Frameworks</h3>
                <div id="jsFrameworkButtons" class="button-container"></div>
            </div>
            <div id="cssFrameworkContainer" class="framework-section">
                <h3>CSS Frameworks</h3>
                <div id="cssFrameworkButtons" class="button-container"></div>
            </div>
            <div id="layoutPanel" class="framework-section hidden">
                <h3>Layout Options</h3>
                <div id="layoutOptions"></div>
            </div>
            <div id="websiteTypeContainer" class="framework-section hidden">
                <h3>Website Types</h3>
                <div id="websiteTypeButtons"></div>
            </div>
            <div id="elementsPanel" class="elements-panel hidden">
                <h3 class="elements-title">Templates</h3>
                <div class="elements-list"></div>
            </div>
            <div id="mcpDesignPanel" class="framework-section hidden">
                <h3>MCP / Design Options</h3>
                <div id="mcpDesignOptions" class="button-container"></div>
            </div>
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

        <button id="debugButton" class="debug-button">
            Generate Code
        </button>

        <button id="openChatButton" class="chat-button-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Open Chat
        </button>
    </div>`;
}

function showPanel(panelId: string) {
    const panels = [
        'jsFrameworkContainer',
        'cssFrameworkContainer',
        'layoutPanel',
        'websiteTypeContainer',
        'elementsPanel'
    ];
    panels.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Show both JS and CSS frameworks for the "framework" icon
            if (panelId === 'jsFrameworkContainer') {
                if (id === 'jsFrameworkContainer' || id === 'cssFrameworkContainer') {
                    el.classList.remove('hidden');
                    el.classList.add('visible');
                } else {
                    el.classList.remove('visible');
                    el.classList.add('hidden');
                }
            } else if (id === panelId) {
                el.classList.remove('hidden');
                el.classList.add('visible');
            } else {
                el.classList.remove('visible');
                el.classList.add('hidden');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Map sidebar data-panel values to panel IDs
    const panelMap: Record<string, string> = {
        framework: 'jsFrameworkContainer',      // Only this shows JS Frameworks (and CSS if you want)
        // Remove or comment out the design mapping for cssFrameworkContainer
        layout: 'layoutPanel',
        content: 'websiteTypeContainer',
        components: 'elementsPanel',
        // design: 'cssFrameworkContainer', // <-- Remove or comment out this line
        // Add more mappings as needed
    };

    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const panel = icon.getAttribute('data-panel');
            if (panel && panelMap[panel]) {
                showPanel(panelMap[panel]);
            } else {
                showPanel('');
            }
        });
    });
});