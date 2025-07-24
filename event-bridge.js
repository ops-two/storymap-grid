/**
 * Event Bridge - Handles communication between UI and Bubble
 * Converts DOM events into Bubble plugin events
 */
window.StoryMapEventBridge = {
    instance: null,
    // Renamed 'initialized' to 'isInitialized' for clarity
    isInitialized: false, 

    // The 'properties' object is no longer needed here
    init(instance) {
        if (this.isInitialized) return;
        
        this.instance = instance;
        this.isInitialized = true;
        
        console.log("Event Bridge Initializing...");

        // --- NEW: Attach delegated listener for card clicks ONCE ---
        this.instance.canvas.on('click', '.card', (e) => {
            const card = $(e.currentTarget);
            const entityId = card.data('id');
            const entityType = card.data('type');
            
            // This is the logic we moved from update.txt
            if (entityId && entityType) {
                this.instance.publishState('clicked_item_id', entityId);
                this.instance.publishState('clicked_item_type', entityType);
                this.instance.triggerEvent('card_clicked');
            }
        });
        
        // Subscribe to UI events
        document.addEventListener('storymap:update', this.handleUpdate.bind(this));
        document.addEventListener('storymap:reorder', this.handleReorder.bind(this));
        document.addEventListener('storymap:add', this.handleAdd.bind(this));
        

    },
    
    handleUpdate(event) {
        const { entityType, entityId, fieldName, newValue, oldValue, allData } = event.detail;
        

        
        // Publish state for Bubble to react (as JSON string)
        this.instance.publishState('pending_update', JSON.stringify({
            entityType,
            entityId,
            fieldName,
            newValue,
            oldValue,
            allData,  // Include all entity data for comprehensive updates
            timestamp: Date.now()
        }));
        
        // Trigger specific event based on entity type
        const eventName = `${entityType}_updated`;
        this.instance.triggerEvent(eventName);
    },
    
    handleAdd(event) {
        const { entityType, parentId, parentType, data } = event.detail;
        

        
        // Publish state for new entity (as JSON string)
        this.instance.publishState('pending_add', JSON.stringify({
            entityType,
            parentId,
            parentType,
            data,  // All data for the new entity
            timestamp: Date.now()
        }));
        
        // Trigger specific event based on entity type
        const eventName = `${entityType}_added`;
        this.instance.triggerEvent(eventName);
    },
    
    handleReorder(event) {
        const { entityType, entityId, oldIndex, newIndex, newOrderValue } = event.detail;
        

        
        // Publish state for Bubble to react (as JSON string)
        this.instance.publishState('pending_reorder', JSON.stringify({
            entityType,
            entityId,
            oldIndex,
            newIndex,
            newOrderValue,
            timestamp: Date.now()
        }));
        
        // Trigger specific event based on entity type (if needed)
        const eventName = `${entityType}_reordered`;
        this.instance.triggerEvent(eventName);
    },
};
