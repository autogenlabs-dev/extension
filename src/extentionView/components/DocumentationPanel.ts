/**
 * Gets the HTML for the documentation panel
 * @returns HTML string for documentation panel
 */
export function getDocumentationPanelHtml(): string {
    return `
    <div id="documentationPanel" class="framework-section hidden">
        <h3>Documentation</h3>
        <div class="doc-sidebar">
            <button class="doc-menu-item" data-doc-type="Documentation">Documentation</button>
            <button class="doc-menu-item" data-doc-type="Deployment">Deployment Doc</button>
            <button class="doc-menu-item" data-doc-type="News/Blogs">Blogs</button>
            <button class="doc-menu-item" data-doc-type="Community">Community</button>
            <button class="doc-menu-item" data-doc-type="Product Announcement">Release Notes</button>
        </div>
        <!-- Removing the doc content container from sidebar. It will be in the main preview area instead -->
    </div>
    `;
}

/**
 * Shows documentation content based on the selected documentation type
 * @param docType The type of documentation to show
 * @returns HTML string for the documentation content
 */
export function showDocumentationContent(docType: string): string {
    let html = '<div class="doc-container">';
    
    switch(docType) {
        case 'Documentation':
            html += `
                <div class="doc-card enhanced-api-doc">
                    <div class="doc-card-header">
                        <h3>API Documentation</h3>
                        <span class="api-version-tag">v2.5.0</span>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-section getting-started-section">
                            <h4>Getting Started</h4>
                            <p>This guide will help you get started with our API and understand its capabilities.</p>
                            <div class="quick-links">
                                <a href="#" class="quick-link-badge">Quick Start</a>
                                <a href="#" class="quick-link-badge">Installation</a>
                                <a href="#" class="quick-link-badge">API Reference</a>
                            </div>
                        </div>
                        <div class="doc-section core-components-section">
                            <h4>Core Components</h4>
                            <div class="component-grid">
                                <div class="component-card">
                                    <div class="component-icon">🧠</div>
                                    <div class="component-info">
                                        <h5>AutoGenProvider</h5>
                                        <p>Core provider for AI functionality</p>
                                    </div>
                                </div>
                                <div class="component-card">
                                    <div class="component-icon">🖥️</div>
                                    <div class="component-info">
                                        <h5>ExtensionView</h5>
                                        <p>UI component for VS Code extension</p>
                                    </div>
                                </div>
                                <div class="component-card">
                                    <div class="component-icon">💬</div>
                                    <div class="component-info">
                                        <h5>ChatContent</h5>
                                        <p>Chat interface component</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="doc-section example-section">
                            <h4>Sample Implementation</h4>
                            <div class="code-sample">
                                <pre><code>// Initialize the AutoGen provider
import { AutoGenProvider } from './core/AutogenProvider';

// Create a new instance
const provider = new AutoGenProvider();

// Connect to your extension
await provider.connect(context);</code></pre>
                            </div>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button primary-button">View Full Documentation</button>
                    </div>
                </div>`;
            break;
            
        case 'Deployment':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Deployment Guide</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-section">
                            <h4>Deployment Options</h4>
                            <p>Choose the deployment method that best suits your needs:</p>
                            <ul>
                                <li><strong>Vercel</strong>: One-click deployment for Next.js applications</li>
                                <li><strong>Netlify</strong>: Great for static sites and JAMstack applications</li>
                                <li><strong>AWS Amplify</strong>: Full-stack deployment with backend services</li>
                                <li><strong>Docker</strong>: Containerized deployment for any environment</li>
                            </ul>
                        </div>
                        <div class="doc-section">
                            <h4>CI/CD Integration</h4>
                            <p>Automate your deployment pipeline with GitHub Actions or GitLab CI.</p>
                            <code>name: Deploy\non:\n  push:\n    branches: [ main ]</code>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">View Deployment Options</button>
                    </div>
                </div>`;
            break;
            
        case 'News/Blogs':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Latest News & Articles</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-blog-post">
                            <h4>Building AI-Driven Components with AutoGen</h4>
                            <span class="doc-date">May 18, 2025</span>
                            <p>Learn how to create intelligent UI components that adapt to user behavior using AutoGen's machine learning capabilities.</p>
                            <button class="doc-button-small">Read Article</button>
                        </div>
                        <div class="doc-blog-post">
                            <h4>The Future of Low-Code Development</h4>
                            <span class="doc-date">May 5, 2025</span>
                            <p>Explore how AI is transforming the way developers build applications with minimal code.</p>
                            <button class="doc-button-small">Read Article</button>
                        </div>
                        <div class="doc-blog-post">
                            <h4>Case Study: E-commerce Migration to AutoGen</h4>
                            <span class="doc-date">April 28, 2025</span>
                            <p>How a major retailer reduced development time by 60% using AutoGen's component system.</p>
                            <button class="doc-button-small">Read Article</button>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">View All Articles</button>
                    </div>
                </div>`;
            break;
            
        case 'Community':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Join Our Community</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-community-section">
                            <h4>Community Resources</h4>
                            <div class="doc-community-resources">
                                <div class="doc-community-item">
                                    <h5>Discord</h5>
                                    <p>Join 12,000+ developers in our Discord community</p>
                                    <button class="doc-button-small">Join Discord</button>
                                </div>
                                <div class="doc-community-item">
                                    <h5>GitHub</h5>
                                    <p>Contribute to our open source projects</p>
                                    <button class="doc-button-small">View GitHub</button>
                                </div>
                                <div class="doc-community-item">
                                    <h5>Forums</h5>
                                    <p>Ask questions and share your knowledge</p>
                                    <button class="doc-button-small">Browse Forums</button>
                                </div>
                            </div>
                        </div>
                        <div class="doc-community-events">
                            <h4>Upcoming Events</h4>
                            <ul>
                                <li><strong>June 15, 2025</strong>: AutoGen Virtual Conference</li>
                                <li><strong>July 8, 2025</strong>: Community Hackathon</li>
                                <li><strong>August 22, 2025</strong>: Workshop: Advanced Component Design</li>
                            </ul>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">Community Hub</button>
                    </div>
                </div>`;
            break;
            
        case 'Product Announcement':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>New Release Notes</h3>
                        <span class="doc-date">May 22, 2025</span>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-announcement-hero">
                            <h4>AutoGen Studio v2.5.0</h4>
                            <p class="doc-announcement-tagline">Enhanced AI capabilities and new templates</p>
                            <div class="doc-announcement-banner">
                                <span class="doc-badge">Latest Release</span>
                            </div>
                        </div>
                        
                        <div class="doc-announcement-features">
                            <h4>What's New</h4>
                            <div class="doc-feature-grid">
                                <div class="doc-feature">
                                    <h5>Enhanced Code Generation</h5>
                                    <p>Improved AI model for more accurate and efficient code generation</p>
                                </div>
                                <div class="doc-feature">
                                    <h5>New Templates</h5>
                                    <p>Added 20+ new website and component templates</p>
                                </div>
                                <div class="doc-feature">
                                    <h5>Design System Integration</h5>
                                    <p>Direct import from Figma, Sketch, and Adobe XD</p>
                                </div>
                                <div class="doc-feature">
                                    <h5>Performance Improvements</h5>
                                    <p>50% faster loading times and reduced memory usage</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="doc-announcement-cta">
                            <p>Update to v2.5.0 today to access all the new features</p>
                            <button class="doc-button-small">See Changelog</button>
                            <button class="doc-button-small">Update Guide</button>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">Learn More</button>
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
                                <h4>Documentation</h4>
                                <p>Complete API documentation for developers</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Deployment</h4>
                                <p>Learn how to deploy your applications</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>News/Blogs</h4>
                                <p>Latest articles and updates</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Community</h4>
                                <p>Join our developer community</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Release Notes</h4>
                                <p>Check out our latest releases</p>
                            </div>
                        </div>
                    </div>
                </div>`;
    }
    
    html += '</div>';
    return html;
}