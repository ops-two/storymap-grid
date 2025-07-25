// The definitive event-bridge.js that handles multiple event types

window.StoryMapEventBridge = {
  instance: null,
  isInitialized: false,

  init(instance) {
    if (this.isInitialized) return;
    this.instance = instance;
    this.isInitialized = true;

    // Listen for the different types of events from our modules
    document.addEventListener("storymap:update", this.handleUpdate.bind(this));
    document.addEventListener(
      "storymap:reorder",
      this.handleReorder.bind(this)
    );

    // The generic card click handler for popups is unchanged
    instance.canvas.on("click", ".card", (e) => {
      /* ... */
    });
  },

  // This function is for things like inline name editing.
  handleUpdate(event) {
    const { entityType, entityId, allData } = event.detail;
    this.instance.publishState("pending_update", JSON.stringify(event.detail));
    this.instance.triggerEvent(`${entityType}_updated`);
  },

  // --- NEW: DEDICATED HANDLER FOR REORDERING ---
  handleReorder(event) {
    const { entityType, entityId, newValue } = event.detail;

    const reorderPayload = {
      entityId: entityId,
      newValue: newValue,
    };

    // Publish to the correct 'pending_reorder' state
    this.instance.publishState(
      "pending_reorder",
      JSON.stringify(reorderPayload)
    );

    // Trigger a dedicated reorder event (e.g., 'feature_reordered')
    // NOTE: You will need to add a 'feature_reordered' event in your plugin editor.
    this.instance.triggerEvent(`${entityType}_reordered`);
  },
};
