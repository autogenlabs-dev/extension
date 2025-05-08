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
        
        // Add click handler to select the card
        div.addEventListener('click', () => {
            // Remove selected class from all other cards
            const allCards = previewGrid.querySelectorAll('.design-card');
            allCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to this card
            div.classList.add('selected');
        });
        
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
    
    // Make sure the correct button is visually selected
    const buttons = document.querySelectorAll('#websiteTypeButtons .option-button');
    buttons.forEach(button => {
        if (button instanceof HTMLElement) {
            button.classList.remove('selected');
            if (button.textContent && button.textContent.trim() === type.trim()) {
                button.classList.add('selected');
            }
        }
    });
    
    // Log for debugging
    console.log('[handleWebsiteTypeSelection] Selected type:', type);
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
