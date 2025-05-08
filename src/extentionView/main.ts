// Add interface declarations for window object extensions
declare global {
    interface Window {
        state?: {
            activePanel: string;
            layout?: {
                selectedLayout?: string;
            };
        };
        initializeFrameworkButtons?: () => void;
        initializeLayoutOptions?: () => void;
        renderFolderStructure?: (layout: string) => void;
        initializeTemplatesPanel?: () => void;
        initializeWebsiteTypeButtons?: () => void;
        initializeMcpDesignPanel?: () => void;
        handleSidebarClick?: (panel: string) => void;
    }
}

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
                    <p id="previewText" class="preview-subtitle">Select frameworks and a component category.</p>
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
    // Map of panel IDs to their visibility state
    const panels: Record<string, boolean> = {
        'jsFrameworkContainer': false,
        'cssFrameworkContainer': false,
        'layoutPanel': false,
        'websiteTypeContainer': false, 
        'elementsPanel': false,
        'mcpDesignPanel': false
    };

    // Special case for framework panel showing both JS and CSS
    if (panelId === 'jsFrameworkContainer' || panelId === 'framework') {
        panels['jsFrameworkContainer'] = true;
        panels['cssFrameworkContainer'] = true;
    } else if (panelId) {
        // Set the selected panel to visible
        panels[panelId] = true;
    }
    
    // Apply visibility classes to all panels
    Object.entries(panels).forEach(([id, isVisible]) => {
        const el = document.getElementById(id);
        if (el) {
            if (isVisible) {
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
        'framework': 'jsFrameworkContainer',
        'layout': 'layoutPanel',
        'components': 'elementsPanel',
        'content': 'websiteTypeContainer',
        'design': 'mcpDesignPanel',
        'search': '',
        'chat': '',
        'settings': ''
    };

    // Set up click handlers for sidebar icons
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            // Update active state for sidebar icons
            document.querySelectorAll('.sidebar-icon').forEach(i => {
                i.classList.remove('active');
            });
            icon.classList.add('active');
            
            // Get panel ID from data attribute
            const panel = icon.getAttribute('data-panel');
            if (!panel) { 
                return; // Early return if no panel attribute
            }

            if (panelMap[panel]) {
                showPanel(panelMap[panel]);
                
                // Update global state if needed
                if (window.state) {
                    window.state.activePanel = panel;
                }
                
                // Initialize panel contents based on selected panel
                switch (panel) {
                    case 'framework':
                        if (window.initializeFrameworkButtons) {
                            window.initializeFrameworkButtons();
                        }
                        break;
                    case 'layout':
                        if (window.initializeLayoutOptions) {
                            window.initializeLayoutOptions();
                            if (window.renderFolderStructure && 
                                window.state?.layout?.selectedLayout) {
                                window.renderFolderStructure(window.state.layout.selectedLayout);
                            }
                        }
                        break;
                    case 'components':
                        if (window.initializeTemplatesPanel) {
                            window.initializeTemplatesPanel();
                        }
                        break;
                    case 'content':
                        if (window.initializeWebsiteTypeButtons) {
                            window.initializeWebsiteTypeButtons();
                        }
                        break;
                    case 'design':
                        if (window.initializeMcpDesignPanel) {
                            window.initializeMcpDesignPanel();
                        }
                        break;
                }
            } else if (['chat', 'search', 'settings'].includes(panel)) {
                // These will be handled by the event listeners in the main script
                if (window.handleSidebarClick) {
                    window.handleSidebarClick(panel);
                }
            }
        });
    });
});