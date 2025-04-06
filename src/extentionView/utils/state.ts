export interface ExtensionState {
    selectedJS: string;
    selectedCSS: string;
    selectedWebsiteType: string;
    selectedComponents: string[];
    selectedCategory: string;
}

export const initialState: ExtensionState = {
    selectedJS: '',
    selectedCSS: '',
    selectedWebsiteType: '',
    selectedComponents: [],
    selectedCategory: ''
};

export const frameworks = {
    js: ['React', 'Next.js', 'Vue'],
    css: ['Tailwind CSS', 'Bootstrap', 'Custom CSS'],
    websiteTypes: ['E-commerce', 'Portfolio', 'Blog']
};
