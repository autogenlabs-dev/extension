interface WebsiteTemplate {
    title: string;
    description: string;
    variants: number;
}

interface WebsiteTemplates {
    [key: string]: WebsiteTemplate[];
}

export const websiteTemplates: WebsiteTemplates = {
    'E-commerce': [
        { title: 'Product Listing', description: 'Clean product grid layout with filters', variants: 4 },
        { title: 'Shopping Cart', description: 'Intuitive cart and checkout flow', variants: 2 },
        { title: 'Product Details', description: 'Detailed product view with gallery', variants: 3 }
    ],
    'Portfolio': [
        { title: 'Project Grid', description: 'Showcase your work in style', variants: 3 },
        { title: 'About Me', description: 'Professional bio and skills section', variants: 2 },
        { title: 'Contact Page', description: 'Get in touch with custom form', variants: 2 }
    ],
    'Blog': [
        { title: 'Article List', description: 'Clean blog post listing layout', variants: 3 },
        { title: 'Featured Posts', description: 'Highlight your best content', variants: 2 },
        { title: 'Author Profile', description: 'Personal bio and article links', variants: 2 }
    ]
};
