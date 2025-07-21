// Journey Drag and Drop Module for Story Map

window.StoryMapJourneyDragDrop = {
    draggedCard: null,
    draggedData: null,
    currentDropTarget: null,
    isProcessing: false,
    hasInitialized: false,
    lastDropTime: 0,
    
    init: function(container) {
        this.container = container;
        
        // Clean up any existing listeners before setting up new ones
        this.cleanup();
        this.setupJourneyDragging();
        this.hasInitialized = true;
    },
    
    cleanup: function() {
        if (!this.container) return;
        
        // Remove all drag event listeners from journey cards
        const journeyCards = this.container.querySelectorAll('.journey-card');
        journeyCards.forEach(card => {
            // Clone node to remove all event listeners
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });
    },
    
    setupJourneyDragging: function() {
        // Find all journey cards
        const journeyCards = this.container.querySelectorAll('.journey-card');
        
        journeyCards.forEach(card => {
            // Skip if already set up to prevent duplicate listeners
            if (card.dataset.dragSetup === 'true') {
                return;
            }
            card.dataset.dragSetup = 'true';
            
            // Make card draggable
            card.draggable = true;
            
            // Drag start
            card.addEventListener('dragstart', (e) => {
                this.draggedCard = card;
                // Store journey data at drag start
                this.draggedData = {
                    id: card.dataset.id,
                    name: card.querySelector('.journey-title')?.textContent || '',
                    order: parseFloat(card.dataset.order) || 0
                };
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', card.innerHTML);
            });
            
            // Drag end
            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
                // Remove any remaining drag-over classes
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
                // Don't clear draggedCard here - let drop handler do it
            });
            
            // Drag over - prevent default to allow drop
            card.addEventListener('dragover', (e) => {
                if (this.draggedCard && card !== this.draggedCard) {
                    e.preventDefault();
                    card.classList.add('drag-over');
                }
            });
            
            // Drag enter
            card.addEventListener('dragenter', (e) => {
                if (this.draggedCard && card !== this.draggedCard) {
                    this.currentDropTarget = card;
                }
            });
            
            // Drag leave
            card.addEventListener('dragleave', (e) => {
                card.classList.remove('drag-over');
            });
            
            // Drop
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                
                if (this.draggedCard && card !== this.draggedCard) {
                    this.handleDrop(card);
                }
            });
        });
    },
    
    handleDrop: function(targetCard) {
        // Debounce rapid drops (minimum 300ms between drops)
        const now = Date.now();
        if (now - this.lastDropTime < 300) {
            return;
        }
        this.lastDropTime = now;
        
        // Prevent concurrent processing
        if (this.isProcessing) {
            return;
        }
        
        if (!this.draggedCard) {
            console.error('No dragged journey found');
            return;
        }
        
        this.isProcessing = true;
        
        const draggedId = this.draggedData?.id || this.draggedCard?.dataset.id;
        const targetId = targetCard.dataset.id;
        
        if (!draggedId) {
            console.error('No dragged journey ID found');
            this.isProcessing = false;
            return;
        }
        
        // Quick exit if same card
        if (draggedId === targetId) {
            this.isProcessing = false;
            return;
        }
        
        // Get only the necessary journey orders (dragged and target)
        const draggedOrder = parseFloat(this.draggedCard.dataset.order || '0');
        const targetOrder = parseFloat(targetCard.dataset.order || '0');
        
        // Find position of target in sorted list for calculation
        const allCards = Array.from(this.container.querySelectorAll('.journey-card'));
        const sortedCards = allCards
            .map(card => ({
                id: card.dataset.id,
                order: parseFloat(card.dataset.order || '0')
            }))
            .sort((a, b) => a.order - b.order);
        
        // Find target position
        const targetIndex = sortedCards.findIndex(j => j.id === targetId);
        
        if (targetIndex === -1) {
            console.error('Target journey not found');
            this.isProcessing = false;
            return;
        }
        
        // Calculate new decimal order index
        let newOrderValue;
        
        // If dropping at the beginning (before first item)
        if (targetIndex === 0) {
            newOrderValue = sortedCards[0].order - 1;
        }
        // If dropping between items
        else {
            // Get the order of the target and the item before it
            const targetCardOrder = sortedCards[targetIndex].order;
            const prevCardOrder = sortedCards[targetIndex - 1].order;
            
            // Calculate midpoint between previous and target
            newOrderValue = (prevCardOrder + targetCardOrder) / 2;
        }
        
        // Get the journey name from stored data
        const journeyName = this.draggedData?.name || '';
        
        // Trigger event for Bubble to handle the reordering
        if (window.StoryMapEventBridge && window.StoryMapEventBridge.instance) {
            // Update format: entityId, name_text, and order_index
            const updateData = {
                entityId: draggedId,
                name_text: journeyName,
                order_index: newOrderValue
            };
            
            console.log('Publishing journey update:', JSON.stringify(updateData));
            
            // Use journey_updated event
            window.StoryMapEventBridge.instance.triggerEvent('journey_updated');
            window.StoryMapEventBridge.instance.publishState('pending_update', JSON.stringify(updateData));
            console.log('Event triggered and state published');
            
            // Allow next drop after a small delay
            setTimeout(() => {
                this.isProcessing = false;
                // Clear drag state after processing
                this.draggedCard = null;
                this.draggedData = null;
                this.currentDropTarget = null;
            }, 100);
        } else {
            console.error('Event bridge not found! Cannot trigger update.');
            this.isProcessing = false;
            // Clear drag state after error
            this.draggedCard = null;
            this.draggedData = null;
            this.currentDropTarget = null;
        }
    }
};
