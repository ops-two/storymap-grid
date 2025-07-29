// The definitive and complete add-item-handler.js

window.StoryMapAddItemHandler = {
  isInitialized: false,

  init(container) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log("Add Item Handler Initializing...");

    container.addEventListener("click", (e) => {
      if (!e.target.classList.contains("add-item-button")) return;

      const button = e.target;
      e.stopPropagation();

      this.handleAdd(button);
    });
  },

  handleAdd(button) {
    const addType = button.dataset.addType;
    const journeyId = button.dataset.journeyId;
    const featureId = button.dataset.featureId;
    const releaseId = button.dataset.releaseId;
    const beforeOrder = parseFloat(button.dataset.beforeOrder);
    const afterOrder = parseFloat(button.dataset.afterOrder);

    const newOrderValue = (beforeOrder + afterOrder) / 2;

    const payload = {
      addType: addType,
      newOrderValue: newOrderValue,
      ...(journeyId && { parentJourneyId: journeyId }),
      ...(featureId && { parentFeatureId: featureId }),
      ...(releaseId && { parentReleaseId: releaseId }),
    };

    // --- THIS IS THE CRITICAL FIX ---
    // This is the line that was missing. It dispatches the event
    // that our event-bridge.js is waiting to hear.
    console.log("Dispatching 'storymap:add' event with payload:", payload);
    document.dispatchEvent(
      new CustomEvent("storymap:add", { detail: payload })
    );
  },
};
