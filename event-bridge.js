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
        
        console.log('StoryMapEventBridge initialized');
    },
    
    handleUpdate(event) {
        const { entityType, entityId, fieldName, newValue, oldValue } = event.detail;
        
        console.log('Event Bridge: Handling update', {
            entityType,
            entityId,
            fieldName,
            newValue,
            oldValue
        });
        
        // Publish state for Bubble to react (as JSON string)
        this.instance.publishState('pending_update', JSON.stringify({
            entityType,
            entityId,
            fieldName,
            newValue,
            oldValue,
            timestamp: Date.now()
        }));
        
        // Trigger Bubble event (data is in pending_update state)
        this.instance.triggerEvent('entity_updated');
    },
    
    handleReorder(event) {
        const { entityType, entityId, oldIndex, newIndex, newOrderValue } = event.detail;
        
        console.log('Event Bridge: Handling reorder', {
            entityType,
            entityId,
            oldIndex,
            newIndex,
            newOrderValue
        });
        
        // Publish state for Bubble to react (as JSON string)
        this.instance.publishState('pending_reorder', JSON.stringify({
            entityType,
            entityId,
            oldIndex,
            newIndex,
            newOrderValue,
            timestamp: Date.now()
        }));
        
        // Trigger Bubble event (data is in pending_reorder state)
        this.instance.triggerEvent('entity_reordered');
    },
};
