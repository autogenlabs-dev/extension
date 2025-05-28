/**
 * Gets the HTML for the website templates panel
 * @returns HTML string for website templates panel
 */
export function getWebsiteTemplatesPanelHtml(): string {
    return `
    <div id="websiteTemplatesPanel" class="framework-section hidden">
        <h3>Website Templates</h3>
        <div class="doc-sidebar">
            <button class="doc-menu-item" data-template-type="E-commerce">E-commerce</button>
            <button class="doc-menu-item" data-template-type="Portfolio">Portfolio</button>
            <button class="doc-menu-item" data-template-type="Management Dashboard">Management Dashboard</button>
            <button class="doc-menu-item" data-template-type="Blog">Blog</button>
            <button class="doc-menu-item" data-template-type="Landing Page">Landing Page</button>
            <button class="doc-menu-item" data-template-type="Animated Showcase">Animated Showcase</button>
        </div>
    </div>
    `;
}

/**
 * Shows website template content based on the selected template type
 * @param templateType The type of template to show
 * @returns HTML string for the template content
 */
export function showWebsiteTemplateContent(templateType: string): string {
    let html = '<div class="doc-container">';
    
    switch(templateType) {
        case 'E-commerce':
            html += `
              <div class="doc-card-header">
                        <h3>E-commerce React Projects Showcase</h3>
                        <span class="api-version-tag">Live Previews</span>
                    </div>
                <div class="">
                  
                    <div class="">
                       
                        
                        <!-- Project 1: eCommerce Website -->
                        <div style="margin-bottom: 30px; background: #1f2937; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; transform: translateY(0);" 
                             onmouseover="this.style.boxShadow='0 25px 50px rgba(0, 0, 0, 0.25)'; this.style.transform='translateY(-4px)';" 
                             onmouseout="this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'; this.style.transform='translateY(0)';">
                            
                            <!-- Live Website Preview -->
                            <div style="position: relative;">
                                <div style="position: relative; overflow: hidden; background: #111827;">
                                    <iframe 
                                        src="https://ecommerce-frontend-website.vercel.app/" 
                                        title="eCommerce Website Live Preview"
                                        style="width: 100%; height: 600px; border: none;"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        loading="lazy">
                                    </iframe>
                                </div>
                            </div>

                            <!-- Content Info -->
                            <div style="padding: 24px;">
                                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
                                    <div style="flex: 1;">
                                        <h3 style="font-size: 24px; font-weight: 600; color: #f3f4f6; margin-bottom: 8px; margin-top: 0;">
                                            eCommerce Website
                                        </h3>
                                        <span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 12px;">
                                            ⭐ HIGHLY RECOMMENDED
                                        </span>
                                        <p style="color: #9ca3af; margin-bottom: 12px; margin-top: 0;">Complete e-commerce functionality with React.js + Tailwind CSS</p>
                                    </div>
                                </div>

                                <!-- Links Section -->
                                <div style="display: flex; gap: 16px; padding-top: 16px; border-top: 1px solid #374151;">
                                    <a href="https://ecommerce-frontend-website.vercel.app/" target="_blank" rel="noopener noreferrer" 
                                       style="flex: 1; background: #10b981; color: white; text-align: center; padding: 12px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; transition: background-color 0.2s;"
                                       onmouseover="this.style.background='#059669';" 
                                       onmouseout="this.style.background='#10b981';">
                                        🚀 Live Demo
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Project 2: Modern E-commerce Website -->
                        <div style="margin-bottom: 30px; background: #1f2937; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; transform: translateY(0);" 
                             onmouseover="this.style.boxShadow='0 25px 50px rgba(0, 0, 0, 0.25)'; this.style.transform='translateY(-4px)';" 
                             onmouseout="this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'; this.style.transform='translateY(0)';">
                            
                            <!-- Live Website Preview -->
                            <div style="position: relative;">
                                <div style="position: relative; overflow: hidden; background: #111827;">
                                    <iframe 
                                        src="https://culture-ecommerce.netlify.app/" 
                                        title="Modern E-commerce Website Live Preview"
                                        style="width: 100%; height: 600px; border: none;"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        loading="lazy">
                                    </iframe>
                                </div>
                            </div>

                            <!-- Content Info -->
                            <div style="padding: 24px;">
                                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
                                    <div style="flex: 1;">
                                        <h3 style="font-size: 24px; font-weight: 600; color: #f3f4f6; margin-bottom: 8px; margin-top: 0;">
                                            Modern E-commerce Website
                                        </h3>
                                        <span style="display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 12px;">
                                            🎯 MODERN & RECENT
                                        </span>
                                        <p style="color: #9ca3af; margin-bottom: 12px; margin-top: 0;">Fashion-focused e-commerce site with modern UI</p>
                                    </div>
                                </div>

                                <!-- Links Section -->
                                <div style="display: flex; gap: 16px; padding-top: 16px; border-top: 1px solid #374151;">
                                    <a href="https://culture-ecommerce.netlify.app/" target="_blank" rel="noopener noreferrer" 
                                       style="flex: 1; background: #10b981; color: white; text-align: center; padding: 12px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; transition: background-color 0.2s;"
                                       onmouseover="this.style.background='#059669';" 
                                       onmouseout="this.style.background='#10b981';">
                                        🚀 Live Demo
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Project 3: Fashion Ecommerce -->
                        <div style="margin-bottom: 30px; background: #1f2937; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; transform: translateY(0);" 
                             onmouseover="this.style.boxShadow='0 25px 50px rgba(0, 0, 0, 0.25)'; this.style.transform='translateY(-4px)';" 
                             onmouseout="this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'; this.style.transform='translateY(0)';">
                            
                            <!-- Live Website Preview -->
                            <div style="position: relative;">
                                <div style="position: relative; overflow: hidden; background: #111827;">
                                    <iframe 
                                        src="https://fashion-ecommerce-omega.vercel.app/" 
                                        title="Fashion Ecommerce Live Preview"
                                        style="width: 100%; height: 600px; border: none;"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        loading="lazy">
                                    </iframe>
                                </div>
                            </div>

                            <!-- Content Info -->
                            <div style="padding: 24px;">
                                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
                                    <div style="flex: 1;">
                                        <h3 style="font-size: 24px; font-weight: 600; color: #f3f4f6; margin-bottom: 8px; margin-top: 0;">
                                            Fashion Ecommerce
                                        </h3>
                                        <span style="display: inline-block; background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 12px;">
                                            🔥 TYPESCRIPT + 2024
                                        </span>
                                        <p style="color: #9ca3af; margin-bottom: 12px; margin-top: 0;">Single-page application with TypeScript</p>
                                    </div>
                                </div>

                                <!-- Links Section -->
                                <div style="display: flex; gap: 16px; padding-top: 16px; border-top: 1px solid #374151;">
                                    <a href="https://fashion-ecommerce-omega.vercel.app/" target="_blank" rel="noopener noreferrer" 
                                       style="flex: 1; background: #10b981; color: white; text-align: center; padding: 12px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; transition: background-color 0.2s;"
                                       onmouseover="this.style.background='#059669';" 
                                       onmouseout="this.style.background='#10b981';">
                                        🚀 Live Demo
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Project 4: E-commerce Shop React App -->
                        <div style="margin-bottom: 30px; background: #1f2937; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; transform: translateY(0);" 
                             onmouseover="this.style.boxShadow='0 25px 50px rgba(0, 0, 0, 0.25)'; this.style.transform='translateY(-4px)';" 
                             onmouseout="this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'; this.style.transform='translateY(0)';">
                            
                            <!-- Live Website Preview -->
                            <div style="position: relative;">
                                <div style="position: relative; overflow: hidden; background: #111827;">
                                    <iframe 
                                        src="https://ecommerce-shop-react-app.vercel.app/" 
                                        title="E-commerce Shop React App Live Preview"
                                        style="width: 100%; height: 600px; border: none;"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        loading="lazy">
                                    </iframe>
                                </div>
                            </div>

                            <!-- Content Info -->
                            <div style="padding: 24px;">
                                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
                                    <div style="flex: 1;">
                                        <h3 style="font-size: 24px; font-weight: 600; color: #f3f4f6; margin-bottom: 8px; margin-top: 0;">
                                            E-commerce Shop React App
                                        </h3>
                                        <span style="display: inline-block; background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 12px;">
                                            📱 FULLY RESPONSIVE
                                        </span>
                                        <p style="color: #9ca3af; margin-bottom: 12px; margin-top: 0;">Fully responsive shop with Fake Store API</p>
                                    </div>
                                </div>

                                <!-- Links Section -->
                                <div style="display: flex; gap: 16px; padding-top: 16px; border-top: 1px solid #374151;">
                                    <a href="https://ecommerce-shop-react-app.vercel.app/" target="_blank" rel="noopener noreferrer" 
                                       style="flex: 1; background: #10b981; color: white; text-align: center; padding: 12px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; transition: background-color 0.2s;"
                                       onmouseover="this.style.background='#059669';" 
                                       onmouseout="this.style.background='#10b981';">
                                        🚀 Live Demo
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Project 5: Canim Ecommerce - LIVE DATA -->
                        <div style="margin-bottom: 30px; background: #1f2937; border: 2px solid #10b981; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; transform: translateY(0);" 
                             onmouseover="this.style.boxShadow='0 25px 50px rgba(0, 0, 0, 0.25)'; this.style.transform='translateY(-4px)';" 
                             onmouseout="this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'; this.style.transform='translateY(0)';">
                            
                            <!-- Live Website Preview -->
                            <div style="position: relative;">
                                <div style="position: relative; overflow: hidden; background: #111827;">
                                    <iframe 
                                        src="https://canim-csr.vercel.app/" 
                                        title="Canim Ecommerce Live Preview"
                                        style="width: 100%; height: 600px; border: none;"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        loading="lazy">
                                    </iframe>
                                    
                                    <div style="position: absolute; top: 16px; right: 16px; background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; animation: pulse 2s infinite;">
                                        🔴 LIVE
                                    </div>
                                </div>
                            </div>

                            <!-- Content Info -->
                            <div style="padding: 24px;">
                                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
                                    <div style="flex: 1;">
                                        <h3 style="font-size: 24px; font-weight: 600; color: #f3f4f6; margin-bottom: 8px; margin-top: 0;">
                                            Canim Ecommerce - LIVE DATA
                                        </h3>
                                        <span style="display: inline-block; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 12px;">
                                            🌟 FULL-STACK ADVANCED
                                        </span>
                                        <p style="color: #9ca3af; margin-bottom: 12px; margin-top: 0;">Full-stack advanced e-commerce platform with live data</p>
                                    </div>
                                </div>

                                <!-- Links Section -->
                                <div style="display: flex; gap: 16px; padding-top: 16px; border-top: 1px solid #374151;">
                                    <a href="https://canim-csr.vercel.app/" target="_blank" rel="noopener noreferrer" 
                                       style="flex: 1; background: #10b981; color: white; text-align: center; padding: 12px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; transition: background-color 0.2s;"
                                       onmouseover="this.style.background='#059669';" 
                                       onmouseout="this.style.background='#10b981';">
                                        🚀 Live Demo
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button primary-button">Explore More E-commerce Projects</button>
                    </div>
                </div>`;
            break;
            
        case 'Portfolio':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Portfolio Templates</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-section">
                            <h4>Creative Portfolio Designs</h4>
                            <p>Showcase your work with stunning portfolio templates designed for professionals:</p>
                            <ul>
                                <li><strong>Photography</strong>: Gallery-focused layouts with lightbox features</li>
                                <li><strong>Design</strong>: Clean, minimal designs that highlight your work</li>
                                <li><strong>Development</strong>: Code-focused portfolios with project showcases</li>
                                <li><strong>Creative Arts</strong>: Artistic layouts with interactive elements</li>
                            </ul>
                        </div>
                        <div class="doc-section">
                            <h4>Template Features</h4>
                            <p>All portfolio templates include:</p>
                            <ul>
                                <li>Responsive design for all devices</li>
                                <li>Contact forms and social integration</li>
                                <li>SEO optimization</li>
                                <li>Fast loading performance</li>
                            </ul>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">View Portfolio Gallery</button>
                    </div>
                </div>`;
            break;

        case 'Management Dashboard':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Dashboard Templates</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-blog-post">
                            <h4>Admin Dashboard Pro</h4>
                            <span class="doc-date">Featured Template</span>
                            <p>Complete admin dashboard with charts, tables, user management, and real-time analytics.</p>
                            <button class="doc-button-small">Preview Dashboard</button>
                        </div>
                        <div class="doc-blog-post">
                            <h4>Analytics Dashboard</h4>
                            <span class="doc-date">Data-Focused</span>
                            <p>Specialized dashboard for data visualization with interactive charts and KPI widgets.</p>
                            <button class="doc-button-small">View Analytics</button>
                        </div>
                        <div class="doc-blog-post">
                            <h4>CRM Dashboard</h4>
                            <span class="doc-date">Business Tool</span>
                            <p>Customer relationship management interface with lead tracking and sales pipeline.</p>
                            <button class="doc-button-small">Explore CRM</button>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">Browse All Dashboards</button>
                    </div>
                </div>`;
            break;
            
        case 'Blog':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Blog Templates</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-community-section">
                            <h4>Blog Layouts</h4>
                            <div class="doc-community-resources">
                                <div class="doc-community-item">
                                    <h5>Personal Blog</h5>
                                    <p>Clean, minimal design perfect for personal blogging</p>
                                    <button class="doc-button-small">View Template</button>
                                </div>
                                <div class="doc-community-item">
                                    <h5>Tech Blog</h5>
                                    <p>Code-friendly layout with syntax highlighting</p>
                                    <button class="doc-button-small">Preview Blog</button>
                                </div>
                                <div class="doc-community-item">
                                    <h5>Magazine Style</h5>
                                    <p>Multi-column layout for content-rich publications</p>
                                    <button class="doc-button-small">See Magazine</button>
                                </div>
                            </div>
                        </div>
                        <div class="doc-community-events">
                            <h4>Blog Features</h4>
                            <ul>
                                <li><strong>SEO Optimized</strong>: Built-in SEO best practices</li>
                                <li><strong>Comment System</strong>: Integrated commenting functionality</li>
                                <li><strong>Social Sharing</strong>: Easy social media integration</li>
                            </ul>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">Explore Blog Templates</button>
                    </div>
                </div>`;
            break;
            
        case 'Landing Page':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Landing Page Templates</h3>
                        <span class="doc-date">High Converting</span>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-announcement-hero">
                            <h4>Conversion-Optimized Landing Pages</h4>
                            <p class="doc-announcement-tagline">Templates designed to maximize conversions</p>
                            <div class="doc-announcement-banner">
                                <span class="doc-badge">High Performance</span>
                            </div>
                        </div>
                        
                        <div class="doc-announcement-features">
                            <h4>Template Categories</h4>
                            <div class="doc-feature-grid">
                                <div class="doc-feature">
                                    <h5>SaaS Landing</h5>
                                    <p>Perfect for software as a service products</p>
                                </div>
                                <div class="doc-feature">
                                    <h5>App Download</h5>
                                    <p>Mobile app promotion and download pages</p>
                                </div>
                                <div class="doc-feature">
                                    <h5>Event Landing</h5>
                                    <p>Conference and event registration pages</p>
                                </div>
                                <div class="doc-feature">
                                    <h5>Product Launch</h5>
                                    <p>New product announcement and pre-order pages</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="doc-announcement-cta">
                            <p>All landing pages include A/B testing capabilities and analytics integration</p>
                            <button class="doc-button-small">View Examples</button>
                            <button class="doc-button-small">Download Kit</button>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">Browse Landing Pages</button>
                    </div>
                </div>`;
            break;

        case 'Animated Showcase':
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Animated Showcase Templates</h3>
                    </div>
                    <div class="doc-card-content">
                        <div class="doc-categories">
                            <div class="doc-category-item">
                                <h4>3D Portfolio</h4>
                                <p>Three-dimensional animations and transitions</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Interactive Gallery</h4>
                                <p>Mouse-responsive image galleries with parallax</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Motion Graphics</h4>
                                <p>CSS and JavaScript-powered animations</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Scroll Animations</h4>
                                <p>Reveal animations triggered by scroll position</p>
                            </div>
                        </div>
                        <div class="doc-section">
                            <h4>Animation Features</h4>
                            <ul>
                                <li>Smooth 60fps animations</li>
                                <li>Mobile-optimized performance</li>
                                <li>Customizable timing and easing</li>
                                <li>Accessibility-friendly options</li>
                            </ul>
                        </div>
                    </div>
                    <div class="doc-card-footer">
                        <button class="doc-button">View Animated Demos</button>
                    </div>
                </div>`;
            break;
            
        default:
            html += `
                <div class="doc-card">
                    <div class="doc-card-header">
                        <h3>Website Templates</h3>
                    </div>
                    <div class="doc-card-content">
                        <p>Select a template category from the options above.</p>
                        <div class="doc-categories">
                            <div class="doc-category-item">
                                <h4>E-commerce</h4>
                                <p>Online store templates with shopping functionality</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Portfolio</h4>
                                <p>Showcase your work with professional layouts</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Dashboard</h4>
                                <p>Admin and analytics dashboard templates</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Blog</h4>
                                <p>Content-focused blog and magazine layouts</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Landing Page</h4>
                                <p>High-converting marketing page templates</p>
                            </div>
                            <div class="doc-category-item">
                                <h4>Animated Showcase</h4>
                                <p>Interactive templates with stunning animations</p>
                            </div>
                        </div>
                    </div>
                </div>`;
    }
    
    html += '</div>';
    return html;
}