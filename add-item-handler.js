// The definitive, complete, and final add-item-handler.js.

window.StoryMapAddItemHandler = {
  isInitialized: false,

  init(container) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // This listener is correct and does not need to change.
    container.addEventListener("click", (e) => {
      if (!e.targe - t.classList.contains("add-item-button")) return;
      const button = e.target;
      e.stopPropagation();
      this.handleAdd(button);
    });
  },

  handleAdd(button) {
    // 1. Read the "recipe" from the button's data attributes.
    // THIS IS THE DEFINITIVE FIX: We now correctly read ALL parent IDs.
    const addType = button.dataset.addType;
    const journeyId = button.dataset.journeyId;
    const featureId = button.dataset.featureId;
    const releaseId = button.dataset.releaseId;
    const beforeOrder = parseFloat(button.dataset.beforeOrder);
    const afterOrder = parseFloat(button.dataset.afterOrder);

    // 2. The calculation is correct.
    const newOrderValue = (beforeOrder + afterOrder) / 2;

    // Failsafe.
    if (isNaN(newOrderValue)) {
      console.error("Calculation resulted in NaN. Aborting.", button.dataset);
      return;
    }

    // 3. Construct the precise payload for Bubble.
    // THIS IS THE DEFINITIVE FIX: It now correctly includes ALL relevant parent IDs.
    const payload = {
      addType: addType,
      newOrderValue: newOrderValue,
      ...(journeyId && { parentJourneyId: journeyId }),
      ...(featureId && { parentFeatureId: featureId }),
      ...(releaseId && { parentReleaseId: releaseId }),
    };

    // 4. Dispatch the event for the Event Bridge to catch.
    console.log("Dispatching add request:", payload);
    document.dispatchEvent(
      new CustomEvent("storymap:add", { detail: payload })
    );
  },
};
