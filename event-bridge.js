// in event-bridge.js
window.StoryMapEventBridge = {
  instance: null,
  isInitialized: false,

  init(instance) {
    if (this.isInitialized) return;
    this.instance = instance;
    this.isInitialized = true;

    // Listen for the generic update event from our modules
    document.addEventListener("storymap:update", this.handleUpdate.bind(this));

    // Add the generic card click handler for popups
    instance.canvas.on("click", ".card", (e) => {
      const card = $(e.currentTarget);
      instance.publishState("clicked_item_id", card.data("id"));
      instance.publishState("clicked_item_type", card.data("type"));
      instance.triggerEvent("card_clicked");
    });
  },

  handleUpdate(event) {
    const { entityType, entityId, fieldName, newValue } = event.detail;

    const updatePayload = {
      id_text: entityId,
      field_to_change_text: fieldName,
      new_value_text: String(newValue),
    };

    this.instance.publishState("pending_update", JSON.stringify(updatePayload));
    this.instance.triggerEvent(`${entityType}_updated`);
  },
};
