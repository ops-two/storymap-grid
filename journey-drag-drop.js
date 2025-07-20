// Journey Drag and Drop Module for Story Map
console.log('Loading journey-drag-drop.js module...');

window.StoryMapJourneyDragDrop = {
    draggedJourney: null,
    dropTargets: [],
    
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
            
            // Add drag event handlers
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
            card.addEventListener('dragover', this.handleDragOver.bind(this));
            card.addEventListener('drop', this.handleDrop.bind(this));
            card.addEventListener('dragenter', this.handleDragEnter.bind(this));
            card.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
    },
    
    handleDragStart: function(e) {
        if (e.target.classList.contains('journey-card')) {
            this.draggedJourney = e.target;
            e.target.style.opacity = '0.5';
            
            // Store journey data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', e.target.innerHTML);
            
            // Show drop zones on other journeys
            this.showDropZones();
        }
    },
    
    handleDragEnd: function(e) {
        if (e.target.classList.contains('journey-card')) {
            e.target.style.opacity = '';
            this.hideDropZones();
            this.draggedJourney = null;
        }
    },
    
    handleDragOver: function(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Allows us to drop
        }
        
        // Only allow drop on journey drop zones
        if (e.target.classList.contains('journey-drop-zone')) {
            e.dataTransfer.dropEffect = 'move';
            return false;
        }
    },
    
    handleDragEnter: function(e) {
        if (e.target.classList.contains('journey-drop-zone')) {
            e.target.classList.add('drag-over');
        }
    },
    
    handleDragLeave: function(e) {
        if (e.target.classList.contains('journey-drop-zone')) {
            e.target.classList.remove('drag-over');
        }
    },
    
    handleDrop: function(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); // Stops some browsers from redirecting
        }
        
        // Only handle drops on journey drop zones
        if (e.target.classList.contains('journey-drop-zone') && this.draggedJourney) {
            const targetJourneyId = e.target.dataset.targetJourneyId;
            const position = e.target.dataset.position; // 'before' or 'after'
            const draggedJourneyId = this.draggedJourney.dataset.id;
            
            // Don't drop on itself
            if (targetJourneyId !== draggedJourneyId) {
                this.reorderJourneys(draggedJourneyId, targetJourneyId, position);
            }
        }
        
        return false;
    },
    
    showDropZones: function() {
        // Get all journey cards
        const journeyCards = this.container.querySelectorAll('.journey-card');
        
        journeyCards.forEach(card => {
            if (card !== this.draggedJourney) {
                // Create drop zone before this journey
                const dropZoneBefore = document.createElement('div');
                dropZoneBefore.className = 'journey-drop-zone';
                dropZoneBefore.dataset.targetJourneyId = card.dataset.id;
                dropZoneBefore.dataset.position = 'before';
                dropZoneBefore.innerHTML = '<div class="drop-indicator">Drop here</div>';
                
                // Insert before the journey card
                card.parentNode.insertBefore(dropZoneBefore, card);
                this.dropTargets.push(dropZoneBefore);
                
                // Add event listeners to drop zone
                dropZoneBefore.addEventListener('dragover', this.handleDragOver.bind(this));
                dropZoneBefore.addEventListener('drop', this.handleDrop.bind(this));
                dropZoneBefore.addEventListener('dragenter', this.handleDragEnter.bind(this));
                dropZoneBefore.addEventListener('dragleave', this.handleDragLeave.bind(this));
            }
        });
        
        // Add a drop zone at the end
        const lastJourney = journeyCards[journeyCards.length - 1];
        if (lastJourney && lastJourney !== this.draggedJourney) {
            const dropZoneAfter = document.createElement('div');
            dropZoneAfter.className = 'journey-drop-zone';
            dropZoneAfter.dataset.targetJourneyId = lastJourney.dataset.id;
            dropZoneAfter.dataset.position = 'after';
            dropZoneAfter.innerHTML = '<div class="drop-indicator">Drop here</div>';
            
            lastJourney.parentNode.insertBefore(dropZoneAfter, lastJourney.nextSibling);
            this.dropTargets.push(dropZoneAfter);
            
            // Add event listeners
            dropZoneAfter.addEventListener('dragover', this.handleDragOver.bind(this));
            dropZoneAfter.addEventListener('drop', this.handleDrop.bind(this));
            dropZoneAfter.addEventListener('dragenter', this.handleDragEnter.bind(this));
            dropZoneAfter.addEventListener('dragleave', this.handleDragLeave.bind(this));
        }
    },
    
    hideDropZones: function() {
        // Remove all drop zones
        this.dropTargets.forEach(zone => {
            zone.remove();
        });
        this.dropTargets = [];
    },
    
    reorderJourneys: function(draggedJourneyId, targetJourneyId, position) {
        console.log('Reordering journey', draggedJourneyId, position, targetJourneyId);
        
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
        const draggedIndex = journeyOrders.findIndex(j => j.id === draggedJourneyId);
        const targetIndex = journeyOrders.findIndex(j => j.id === targetJourneyId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('Journey not found in order list');
            return;
        }
        
        // Calculate new index based on position
        let newIndex = position === 'before' ? targetIndex : targetIndex + 1;
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
        const newOrderValue = journeyOrders.find(j => j.id === draggedJourneyId).newOrder;
        
        // Trigger event for Bubble to handle the reordering
        if (window.StoryMapEventBridge && window.StoryMapEventBridge.instance) {
            window.StoryMapEventBridge.instance.triggerEvent('journey_reordered');
            window.StoryMapEventBridge.instance.publishState('pending_reorder', JSON.stringify({
                entityType: 'journey',
                draggedId: draggedJourneyId,
                targetId: targetJourneyId,
                position: position,
                newOrderIndex: newOrderValue,
                allJourneyOrders: journeyOrders, // Send all journey orders for batch update
                timestamp: Date.now()
            }));
        }
    }
};
