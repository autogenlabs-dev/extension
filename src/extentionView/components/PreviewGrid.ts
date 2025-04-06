export interface DesignCard {
    title: string;
    description: string;
    variants: number;
    framework: string;
    category?: string;
}

export interface FrameworkCards {
    [key: string]: {
        [category: string]: DesignCard[];
    };
}

export function createDesignCard(card: DesignCard, isSelected: boolean = false): string {
    return `
    <div class="design-card ${isSelected ? 'selected' : ''}">
        <div class="design-preview">
            <div style="width: 100%; height: 100%; background: #e5e7eb;"></div>
        </div>
        <div class="design-info">
            <h3 class="design-title">${card.title}</h3>
            <p class="design-description">${card.description}</p>
            <div class="design-meta">
                <span class="tag">${card.framework}</span>
                <span>${card.variants} variants</span>
                ${card.category ? `<span class="tag">${card.category}</span>` : ''}
            </div>
        </div>
    </div>`;
}

export function createPreviewGrid(cards: DesignCard[], selectedComponents: string[] = []): string {
    if (!cards || cards.length === 0) {
        return '<p>No components available for this category.</p>';
    }

    return `
    <div class="showcase-grid">
        ${cards.map(card => createDesignCard(card, selectedComponents.includes(card.title))).join('')}
    </div>`;
}

export const defaultFrameworkCards: FrameworkCards = {
    'Tailwind CSS': {
        'all': [
            { title: 'Simple Navbar', description: 'Basic navigation with logo', variants: 2, framework: 'Tailwind CSS' },
            { title: 'Hero Section', description: 'Full-width hero with CTA', variants: 4, framework: 'Tailwind CSS' },
            { title: 'Feature Grid', description: 'Grid layout for features', variants: 2, framework: 'Tailwind CSS' },
            { title: 'Contact Form', description: 'Styled contact form', variants: 2, framework: 'Tailwind CSS' }
        ],
        'navbar': [
            { title: 'Simple Navbar', description: 'Basic navigation with logo', variants: 2, framework: 'Tailwind CSS', category: 'navbar' },
            { title: 'Complex Navbar', description: 'Navigation with dropdowns', variants: 3, framework: 'Tailwind CSS', category: 'navbar' }
        ],
        'hero': [
            { title: 'Hero Section', description: 'Full-width hero with CTA', variants: 4, framework: 'Tailwind CSS', category: 'hero' },
            { title: 'Split Hero', description: 'Two-column hero layout', variants: 2, framework: 'Tailwind CSS', category: 'hero' }
        ]
    },
    'Bootstrap': {
        'all': [
            { title: 'Bootstrap Nav', description: 'Standard navigation', variants: 3, framework: 'Bootstrap' },
            { title: 'Jumbotron', description: 'Hero section with CTA', variants: 2, framework: 'Bootstrap' },
            { title: 'Card Grid', description: 'Responsive card layout', variants: 4, framework: 'Bootstrap' }
        ]
    }
};

export const websiteTypeCards = {
    'E-commerce': [
        { title: 'Product Listing', description: 'Clean product grid layout with filters', variants: 4, framework: 'E-commerce' },
        { title: 'Shopping Cart', description: 'Intuitive cart and checkout flow', variants: 2, framework: 'E-commerce' },
        { title: 'Product Details', description: 'Detailed product view with gallery', variants: 3, framework: 'E-commerce' }
    ],
    'Portfolio': [
        { title: 'Project Grid', description: 'Showcase your work in style', variants: 3, framework: 'Portfolio' },
        { title: 'About Me', description: 'Professional bio and skills section', variants: 2, framework: 'Portfolio' },
        { title: 'Contact Page', description: 'Get in touch with custom form', variants: 2, framework: 'Portfolio' }
    ],
    'Blog': [
        { title: 'Article List', description: 'Clean blog post listing layout', variants: 3, framework: 'Blog' },
        { title: 'Featured Posts', description: 'Highlight your best content', variants: 2, framework: 'Blog' },
        { title: 'Author Profile', description: 'Personal bio and article links', variants: 2, framework: 'Blog' }
    ]
};
