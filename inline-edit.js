/**
 * Inline Edit Module - Handles double-click to edit functionality
 * Works with any card that has data-type and data-id attributes
 */
window.StoryMapInlineEdit = {
    container: null,
    activeEdit: null,

    init(container) {
        this.container = container;
        this.setupEditHandlers();
    },
    
    setupEditHandlers() {
        // Use event delegation for efficiency
        this.container.addEventListener('dblclick', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;
            
            // Don't edit if already editing
            if (card.querySelector('.inline-edit-input')) return;
            
            const entityType = card.dataset.type;
            const entityId = card.dataset.id;
            
            if (!entityType || !entityId) {
                console.warn('Card missing data attributes:', card);
                return;
            }
            
            this.startEdit(card, entityType, entityId);
        });
        
        // Global click handler to save on click outside
        document.addEventListener('click', (e) => {
            if (this.activeEdit && !e.target.closest('.inline-edit-input')) {
                this.saveEdit();
            }
        });
    },
    
    startEdit(card, entityType, entityId) {
        // Find the text element to edit
        const textElement = card.querySelector('.card-title') || card;
        const currentText = textElement.textContent.trim();
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'inline-edit-input';
        input.style.cssText = `
            width: 100%;
            padding: 4px 8px;
            border: 2px solid #007bff;
            border-radius: 4px;
            font-size: inherit;
            font-family: inherit;
            background: white;
            color: inherit;
            outline: none;
        `;
        
        // Store edit state
        this.activeEdit = {
            card,
            textElement,
            input,
            entityType,
            entityId,
            originalText: currentText,
            fieldName: this.getFieldName(entityType)
        };
        
        // Replace text with input
        textElement.style.display = 'none';
        card.appendChild(input);
        
        // Focus and select text
        input.focus();
        input.select();
        
        // Add keyboard handlers
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit();
            }
        });
        
        // Prevent card click from propagating
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    },
    
    getFieldName(entityType) {
        // Map entity types to their name fields
        const fieldMap = {
            'journey': 'name_text',
            'feature': 'name_text',
            'story': 'title_text',  // Stories use title_text
            'persona': 'name_text',
            'release': 'name_text'
        };
        
        return fieldMap[entityType] || 'name_text';
    },
    
    saveEdit() {
        if (!this.activeEdit) return;
        
        const { input, entityType, entityId, originalText, fieldName, card } = this.activeEdit;
        const newValue = input.value.trim();
        
        // Only save if value changed
        if (newValue !== originalText && newValue !== '') {
            // Show saving state
            input.disabled = true;
            input.style.opacity = '0.6';
            
            // Gather all entity data from the card
            const allData = this.gatherEntityData(card, entityType, newValue);
            
            // Critical log for debugging updates
            console.log(`Inline edit: ${entityType} ${entityId} - ${fieldName} changed`);
            
            // Emit update event for Bubble with all data
            document.dispatchEvent(new CustomEvent('storymap:update', {
                detail: {
                    entityType,
                    entityId,
                    fieldName,
                    newValue,
                    oldValue: originalText,
                    allData
                }
            }));
            
            // After a brief delay, update the UI to show success
            setTimeout(() => {
                if (this.activeEdit && this.activeEdit.entityId === entityId) {
                    // Update the text element with new value
                    const { textElement } = this.activeEdit;
                    textElement.textContent = newValue;
                    textElement.style.display = '';
                    input.remove();
                    this.activeEdit = null;
    
                }
            }, 500);
        } else {
            // No change or empty, just cancel
            this.cancelEdit();
        }
    },
    
    cancelEdit() {
        if (!this.activeEdit) return;
        
        const { textElement, input } = this.activeEdit;
        
        // Restore original text
        textElement.style.display = '';
        input.remove();
        
        this.activeEdit = null;
    },
    
    gatherEntityData(card, entityType, newValue) {
        // Format: entityId, name_text, and order_index
        const data = {
            entityId: card.dataset.id,
            name_text: newValue
        };
        
        // Get order from data-order attribute (or data-order-index for compatibility)
        const orderValue = card.getAttribute('data-order') || card.getAttribute('data-order-index') || '0';
        data.order_index = parseInt(orderValue);
        
        return data;
    }
};
