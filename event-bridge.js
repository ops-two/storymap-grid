/**
 * Event Bridge - Handles communication between UI and Bubble
 * Converts DOM events into Bubble plugin events
 */
window.StoryMapEventBridge = {
    instance: null,
    properties: null,
    initialized: false,

    init(instance, properties) {
        if (this.initialized) return;
        
        this.instance = instance;
        this.properties = properties;
        this.initialized = true;
        
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
