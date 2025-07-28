// The definitive event-bridge.js that aligns with your existing plugin events.

window.StoryMapEventBridge = {
  instance: null,
  isInitialized: false,

  init(instance) {
    if (this.isInitialized) return;
    this.instance = instance;
    this.isInitialized = true;

    console.log("Event Bridge Initializing with correct event triggers...");

    // Listen for the different types of events from our internal modules.
    document.addEventListener("storymap:update", this.handleUpdate.bind(this));
    document.addEventListener(
      "storymap:reorder",
      this.handleReorder.bind(this)
    );

    // The generic card click handler for popups is correct.
    instance.canvas.on("click", ".card", (e) => {
      e.stopPropagation();
      const card = $(e.currentTarget);
      const entityId = card.data("id");
      const entityType = card.data("type");

      if (entityId && entityType) {
        this.instance.publishState("clicked_item_id", entityId);
        this.instance.publishState("clicked_item_type", entityType);
        this.instance.triggerEvent("card_clicked");
      }
    });
  },

  // This function handles actions like inline name edits.
  handleUpdate(event) {
    // This function passes the rich payload for Regex parsing.
    this.instance.publishState("pending_update", JSON.stringify(event.detail));
    this.instance.triggerEvent(`${event.detail.entityType}_updated`);
  },

  handleReorder(event) {
    // This now correctly handles a payload that might include newParentId.
    const payload = event.detail; // Get the entire detail object
    const { entityType } = payload;

    console.log("Dispatching reorder to Bubble:", payload);

    // Publish the entire rich object to the 'pending_reorder' state.
    this.instance.publishState("pending_reorder", JSON.stringify(payload));

    // Trigger the specific event for the entity type (e.g., 'feature_reordered').
    const eventName = `${entityType}_reordered`;
    this.instance.triggerEvent(eventName);
  },
};
