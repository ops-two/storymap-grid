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
    // The event.detail object is expected to be clean and simple, e.g.:
    // { entityType: 'journey', entityId: '...', fieldName: 'order', newValue: -20.5 }
    const { entityType, entityId, fieldName, newValue } = event.detail;

    // Create a simple, standardized JSON payload to send to Bubble.
    // This makes the Bubble workflow much easier to build and maintain.
    const updatePayload = {
      id_text: entityId,
      field_to_change_text: fieldName,
      new_value_text: String(newValue), // Always convert the new value to a string for safety
    };

    console.log("Dispatching update to Bubble:", updatePayload);

    // Publish this simple object to the 'pending_update' state as a JSON string.
    this.instance.publishState("pending_update", JSON.stringify(updatePayload));

    // Trigger the specific event for the entity type (e.g., 'journey_updated').
    const eventName = `${entityType}_updated`;
    this.instance.triggerEvent(eventName);
  },
};
