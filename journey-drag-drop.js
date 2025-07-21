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
                order: parseInt(orderAttr)
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
        
        // Calculate new index - dropping on a card means inserting before it
        let newIndex = targetIndex;
        if (draggedIndex < newIndex) {
            newIndex--; // Adjust for removal of dragged item
        }
        
        // Remove dragged journey from array
        const [draggedJourney] = journeyOrders.splice(draggedIndex, 1);
        
        // Insert at new position
        journeyOrders.splice(newIndex, 0, draggedJourney);
        
        // Assign new order values (0, 1, 2, ...)
        journeyOrders.forEach((journey, index) => {
            journey.newOrder = index;
        });
        
        // Find the dragged journey's new order
        const newOrderValue = journeyOrders.find(j => j.id === draggedId).newOrder;
        
        console.log('New order for journey:', draggedId, 'is:', newOrderValue);
        console.log('All journey orders:', journeyOrders);
        
        // Trigger event for Bubble to handle the reordering
        if (window.StoryMapEventBridge && window.StoryMapEventBridge.instance) {
            console.log('Event bridge found, triggering journey_updated event');
            const updateData = {
                entityType: 'journey',
                entityId: draggedId,
                order_index: newOrderValue,
                allJourneyOrders: journeyOrders, // Send all journey orders for reference
                timestamp: Date.now()
            };
            console.log('Publishing update data:', updateData);
            
            // Use journey_updated event instead of journey_reordered
            window.StoryMapEventBridge.instance.triggerEvent('journey_updated');
            window.StoryMapEventBridge.instance.publishState('pending_update', JSON.stringify(updateData));
            console.log('Event triggered and state published');
        } else {
            console.error('Event bridge not found! Cannot trigger update.');
        }
    }
};
