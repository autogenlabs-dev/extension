import { websiteTemplates } from './websiteTemplates';

export function showTypeCards(type: string, previewGrid: HTMLElement | null): void {
    if (!previewGrid) {
        return;
    }
    
    previewGrid.innerHTML = '';
    previewGrid.style.display = 'grid';

    const selectedCards = websiteTemplates[type] || [];
    selectedCards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'design-card';
        div.innerHTML = createCardHtml(card, type);
        previewGrid.appendChild(div);
    });
}

export function handleWebsiteTypeSelection(
    type: string, 
    state: { selectedWebsiteType: string }, 
    updateSelection: (containerId: string, selected: string) => void
): void {
    state.selectedWebsiteType = type;
    updateSelection('websiteTypeButtons', type);
}

function createCardHtml(card: { title: string; description: string; variants: number }, type: string): string {
    return `
        <div class="design-preview">
            <div style="width: 100%; height: 100%; background: #e5e7eb;"></div>
        </div>
        <div class="design-info">
            <h3 class="design-title">${card.title}</h3>
            <p class="design-description">${card.description}</p>
            <div class="design-meta">
                <span class="tag">${type}</span>
                <span>${card.variants} variants</span>
            </div>
        </div>`;
}
