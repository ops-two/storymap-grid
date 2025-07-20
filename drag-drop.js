// Drag and Drop functionality for Story Map
window.StoryMapDragDrop = {
    instance: null,
    eventBridge: null,
    draggedElement: null,
    dragData: null,
    
    init: function(instance, eventBridge) {
        this.instance = instance;
        this.eventBridge = eventBridge;
        this.setupDragDrop();
    },
    
    setupDragDrop: function() {
        const container = document.querySelector('.story-map-container');
        if (!container) return;
        
        // Add event listeners for drag and drop
        container.addEventListener('dragstart', this.handleDragStart.bind(this));
        container.addEventListener('dragover', this.handleDragOver.bind(this));
        container.addEventListener('drop', this.handleDrop.bind(this));
        container.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Make journeys draggable
        this.makeJourneysDraggable();
    },
    
    makeJourneysDraggable: function() {
        const journeyCards = document.querySelectorAll('.journey-card');
        journeyCards.forEach(card => {
            card.draggable = true;
            card.style.cursor = 'move';
        });
    },
    
    handleDragStart: function(e) {
        if (!e.target.classList.contains('journey-card')) return;
        
        this.draggedElement = e.target;
        this.dragData = {
            type: 'journey',
            id: e.target.dataset.id,
            originalIndex: this.getJourneyIndex(e.target)
        };
        
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    },
    
    handleDragOver: function(e) {
        if (!this.dragData || this.dragData.type !== 'journey') return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(e.clientX);
        const container = document.querySelector('.story-map-grid-container');
        
        if (afterElement == null) {
            // Insert at the end
            const lastJourney = [...container.querySelectorAll('.journey-card')]
                .filter(el => !el.classList.contains('dragging'))
                .pop();
            if (lastJourney) {
                this.showDropIndicator(lastJourney, 'after');
            }
        } else {
            this.showDropIndicator(afterElement, 'before');
        }
    },
    
    handleDrop: function(e) {
        e.preventDefault();
        if (!this.dragData || this.dragData.type !== 'journey') return;
        
        const afterElement = this.getDragAfterElement(e.clientX);
        const allJourneys = [...document.querySelectorAll('.journey-card')]
            .filter(el => !el.classList.contains('dragging'));
        
        let newIndex;
        if (afterElement == null) {
            // Dropped at the end
            newIndex = allJourneys.length;
        } else {
            // Find the index of the element we're dropping before
            newIndex = allJourneys.findIndex(el => el === afterElement);
        }
        
        // Adjust index if dragging from before to after
        if (this.dragData.originalIndex < newIndex) {
            newIndex--;
        }
        
        // Only update if position actually changed
        if (newIndex !== this.dragData.originalIndex) {
            this.updateJourneyOrder(this.dragData.id, newIndex);
        }
        
        this.clearDropIndicators();
    },
    
    handleDragEnd: function(e) {
        if (e.target.classList.contains('journey-card')) {
            e.target.classList.remove('dragging');
        }
        this.clearDropIndicators();
        this.draggedElement = null;
        this.dragData = null;
    },
    
    getDragAfterElement: function(x) {
        const draggableElements = [...document.querySelectorAll('.journey-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },
    
    getJourneyIndex: function(journeyElement) {
        const allJourneys = [...document.querySelectorAll('.journey-card')];
        return allJourneys.indexOf(journeyElement);
    },
    
    showDropIndicator: function(element, position) {
        this.clearDropIndicators();
        element.classList.add('drop-indicator-' + position);
    },
    
    clearDropIndicators: function() {
        document.querySelectorAll('.drop-indicator-before, .drop-indicator-after')
            .forEach(el => {
                el.classList.remove('drop-indicator-before', 'drop-indicator-after');
            });
    },
    
    updateJourneyOrder: function(journeyId, newIndex) {
        console.log('Updating journey order:', { journeyId, newIndex });
        
        // Get all journey data to calculate new order indices
        const allJourneys = this.instance.data.journeys || [];
        const sortedJourneys = [...allJourneys].sort((a, b) => a.order_index - b.order_index);
        
        // Find the journey being moved
        const movedJourneyIndex = sortedJourneys.findIndex(j => j._id === journeyId);
        if (movedJourneyIndex === -1) return;
        
        const movedJourney = sortedJourneys[movedJourneyIndex];
        
        // Remove from current position
        sortedJourneys.splice(movedJourneyIndex, 1);
        
        // Insert at new position
        sortedJourneys.splice(newIndex, 0, movedJourney);
        
        // Calculate new order indices
        const updates = [];
        sortedJourneys.forEach((journey, index) => {
            const newOrderIndex = index * 10; // Use multiples of 10 for easier reordering
            if (journey.order_index !== newOrderIndex) {
                updates.push({
                    id: journey._id,
                    order_index: newOrderIndex,
                    name: journey.name_text || journey.name
                });
            }
        });
        
        // Send updates via event bridge
        updates.forEach(update => {
            if (this.eventBridge) {
                this.eventBridge.sendUpdate({
                    entityType: 'journey',
                    entityId: update.id,
                    fieldName: 'order_index',
                    newValue: update.order_index,
                    oldValue: movedJourney.order_index,
                    allData: {
                        order_index: update.order_index,
                        name_text: update.name
                    }
                });
            }
        });
    }
};
