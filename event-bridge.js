// The definitive event-bridge.js, upgraded for Miro-like interactions.

window.StoryMapEventBridge = {
  instance: null,
  isInitialized: false,

  init(instance) {
    if (this.isInitialized) return;
    this.instance = instance;
    this.isInitialized = true;

    console.log("Event Bridge Initializing with upgraded click triggers...");

    // Your working 'update' and 'reorder' listeners are preserved perfectly.
    document.addEventListener("storymap:update", this.handleUpdate.bind(this));
    document.addEventListener(
      "storymap:reorder",
      this.handleReorder.bind(this)
    );
    document.addEventListener("storymap:add", this.handleAdd.bind(this));

    // --- THIS IS THE UPGRADED CLICK HANDLER ---
    // The generic card click handler is now more specific.
    // It ONLY listens for clicks on the new icon button.
    instance.canvas.on("click", ".card-icon-button", (e) => {
      // We stop the event here to prevent the inline-edit listener from also firing.
      e.stopPropagation();

      // Find the parent card to get its data attributes.
      const card = $(e.currentTarget).closest(".card");
      const entityId = card.data("id");
      const entityType = card.data("type");

      if (entityId && entityType) {
        console.log(
          `ICON CLICKED: Triggering popup for ${entityType} ${entityId}`
        );
        this.instance.publishState("clicked_item_id", entityId);
        this.instance.publishState("clicked_item_type", entityType);
        this.instance.triggerEvent("card_clicked");
      }
    });
  },
  handleAdd(event) {
    const payload = event.detail; // The "recipe" for the new item
    console.log("Dispatching add request to Bubble:", payload);
    this.instance.publishState("pending_add", JSON.stringify(payload));
    this.instance.triggerEvent("item_to_be_added");
  },
  // This function is UNCHANGED. It is correct.
  handleUpdate(event) {
    this.instance.publishState("pending_update", JSON.stringify(event.detail));
    this.instance.triggerEvent(`${event.detail.entityType}_updated`);
  },

  // This function is UNCHANGED. It is correct.
  handleReorder(event) {
    const payload = event.detail;
    const { entityType } = payload;
    this.instance.publishState("pending_reorder", JSON.stringify(payload));
    const eventName = `${entityType}_reordered`;
    this.instance.triggerEvent(eventName);
  },
};
