// A simple fix for the documentation panel
// This script shows how to properly close template literals 
// to avoid the "Unterminated template literal" error

function getScriptContent() {
    return `
        // ...JavaScript code here...
        
        // Function to initialize Documentation panel options
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
                                
                                // Update state with selected doc type
                                state.selectedDocType = docType;
                                
                                // Display content in the docContentContainer
                                const docContentContainer = document.getElementById('docContentContainer');
                                if (docContentContainer) {
                                    // Show loading indicator
                                    docContentContainer.innerHTML = '<div class="loading-indicator">Loading documentation...</div>';
                                    docContentContainer.classList.add('loading');
                                    
                                    // Short delay for better UX
                                    setTimeout(() => {
                                        // Get content and update container
                                        const content = showDocumentationContent(docType);
                                        docContentContainer.innerHTML = content;
                                        docContentContainer.classList.remove('loading');
                                        
                                        // Add event listeners to buttons in the documentation content
                                        const docContentButtons = docContentContainer.querySelectorAll('.doc-button, .doc-button-small');
                                        docContentButtons.forEach(btn => {
                                            btn.addEventListener('click', () => {
                                                console.log('Documentation button clicked:', btn.textContent);
                                                // Additional button handling can be added here
                                            });
                                        });
                                    }, 300);
                                }
                            });
                        }
                    });
                }
            }
        }
        // Make sure the backtick below closes the template literal that started at the top of the function
    `;
}