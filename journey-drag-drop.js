// Journey Drag and Drop Module for Story Map
console.log('Loading journey-drag-drop.js module...');

window.StoryMapJourneyDragDrop = {
    draggedJourney: null,
    currentDropTarget: null,
    
    init: function(containerElement) {
        console.log('Initializing journey drag and drop...', containerElement);
        this.container = containerElement;
        this.setupJourneyDragging();
    },
    
    setupJourneyDragging: function() {
        // Find all journey cards
        const journeyCards = this.container.querySelectorAll('.journey-card');
        console.log('Found journey cards:', journeyCards.length);
        
        journeyCards.forEach(card => {
            // Make journey cards draggable
            card.draggable = true;
            
            // Drag start
            card.addEventListener('dragstart', (e) => {
                this.draggedJourney = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', card.innerHTML);
            });
            
            // Drag end
            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
                // Remove any remaining highlights
                this.container.querySelectorAll('.journey-card').forEach(c => {
                    c.classList.remove('drag-over');
                });
                this.draggedJourney = null;
                this.currentDropTarget = null;
            });
            
            // Drag over - prevent default to allow drop
            card.addEventListener('dragover', (e) => {
                if (this.draggedJourney && card !== this.draggedJourney) {
                    e.preventDefault();
                    card.classList.add('drag-over');
                }
            });
            
            // Drag enter
            card.addEventListener('dragenter', (e) => {
                if (this.draggedJourney && card !== this.draggedJourney) {
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
                
                if (this.draggedJourney && card !== this.draggedJourney) {
                    this.handleDrop(card);
                }
            });
        });
    },
    
    handleDrop: function(targetCard) {
        console.log('=== JOURNEY DROP EVENT START ===');
        
        if (!this.draggedJourney) {
            console.error('No dragged journey found');
            return;
        }
        
        const draggedId = this.draggedJourney.dataset.id;
        const targetId = targetCard.dataset.id;
        
        console.log('Dragged ID:', draggedId);
        console.log('Target ID:', targetId);
        console.log('Dropping journey', draggedId, 'onto', targetId);
        
        // Get all journey cards and their current order
        const journeyCards = Array.from(this.container.querySelectorAll('.journey-card'));
        const journeyOrders = [];
        
        // Extract journey data with current order
        journeyCards.forEach(card => {
            const id = card.dataset.id;
            const orderAttr = card.dataset.order || '0';
            journeyOrders.push({
                id: id,
                order: parseFloat(orderAttr)  // Use parseFloat to handle decimals
            });
        });
        
        // Sort by current order
        journeyOrders.sort((a, b) => a.order - b.order);
        
        // Find indices
        const draggedIndex = journeyOrders.findIndex(j => j.id === draggedId);
        const targetIndex = journeyOrders.findIndex(j => j.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('Journey not found in order list');
            return;
        }
        
        // Calculate new decimal order index
        let newOrderValue;
        
        // If dropping at the beginning (before first item)
        if (targetIndex === 0) {
            newOrderValue = journeyOrders[0].order - 1;
        }
        // If dropping between items
        else {
            // Get the order of the target and the item before it
            const targetOrder = journeyOrders[targetIndex].order;
            const prevOrder = journeyOrders[targetIndex - 1].order;
            
            // Calculate midpoint between previous and target
            newOrderValue = (prevOrder + targetOrder) / 2;
        }
        
        console.log('Target index:', targetIndex);
        console.log('Calculated new order value:', newOrderValue);
        
        // Get the journey name from the card
        const journeyName = this.draggedJourney.querySelector('.card-title').textContent || '';
        
        console.log('New order for journey:', draggedId, 'is:', newOrderValue);
        console.log('Journey name:', journeyName);
        
        // Trigger event for Bubble to handle the reordering
        if (window.StoryMapEventBridge && window.StoryMapEventBridge.instance) {
            console.log('Event bridge found, triggering journey_updated event');
            
            // Update format: entityId, name_text, and order_index
            const updateData = {
                entityId: draggedId,
                name_text: journeyName,
                order_index: newOrderValue
            };
            
            console.log('Publishing update data:', updateData);
            
            // Use journey_updated event
            window.StoryMapEventBridge.instance.triggerEvent('journey_updated');
            window.StoryMapEventBridge.instance.publishState('pending_update', JSON.stringify(updateData));
            console.log('Event triggered and state published');
        } else {
            console.error('Event bridge not found! Cannot trigger update.');
        }
    }
};
