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
    const { entityType, entityId, newValue } = event.detail;

    const reorderPayload = {
      entityId: entityId,
      newValue: newValue,
    };

    // 1. Publish to the dedicated 'pending_reorder' state. This is correct.
    this.instance.publishState(
      "pending_reorder",
      JSON.stringify(reorderPayload)
    );

    // 2. THE CRITICAL FIX: Trigger the EXISTING '_updated' event.
    const eventName = `${entityType}_updated`;
    console.log(
      `A reorder occurred. Triggering the existing Bubble event: '${eventName}'`
    );
    this.instance.triggerEvent(eventName);
  },
};
