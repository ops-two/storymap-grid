/**
 * Event Bridge - Handles all communication from the plugin's UI back to Bubble.
 */
window.StoryMapEventBridge = {
  instance: null,
  isInitialized: false,

  init(instance) {
    // Guard clause to ensure this only runs once.
    if (this.isInitialized) return;

    this.instance = instance;
    this.isInitialized = true;
    console.log("Event Bridge Initializing...");

    // --- LISTENER FOR DATA UPDATES ---
    // Listens for a generic 'update' event dispatched by any interaction module.
    document.addEventListener("storymap:update", this.handleUpdate.bind(this));

    // --- LISTENER FOR CLICKS (to trigger popups) ---
    // A single, delegated listener on the canvas is efficient.
    instance.canvas.on("click", ".card", (e) => {
      const card = $(e.currentTarget);
      const entityId = card.data("id");
      const entityType = card.data("type");

      if (entityId && entityType) {
        console.log(`Card Clicked: Publishing ${entityType} - ${entityId}`);

        // Publish the ID and Type to exposed states for Bubble to use.
        this.instance.publishState("clicked_item_id", entityId);
        this.instance.publishState("clicked_item_type", entityType);

        // Trigger the event that Bubble workflows will listen for.
        this.instance.triggerEvent("card_clicked");
      }
    });
  },

  /**
   * Handles any data update request from an interaction module.
   * @param {CustomEvent} event The event dispatched, containing update details.
   */
  handleUpdate(event) {
    // This function now expects the rich detail object from the interaction modules
    const { entityType, entityId, fieldName, newValue, oldValue, allData } =
      event.detail;

    console.log(
      "Dispatching update to Bubble (original format):",
      event.detail
    );

    // Publish the entire rich object to the 'pending_update' state.
    // This is what your Bubble workflow was originally built to read.
    this.instance.publishState("pending_update", JSON.stringify(event.detail));

    // Trigger the specific event for the entity type (e.g., 'journey_updated').
    const eventName = `${entityType}_updated`;
    this.instance.triggerEvent(eventName);
  },
};
