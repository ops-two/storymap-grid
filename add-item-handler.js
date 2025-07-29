// The definitive, complete, and final add-item-handler.js.

window.StoryMapAddItemHandler = {
  isInitialized: false,

  init(container) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    container.addEventListener("click", (e) => {
      if (!e.target.classList.contains("add-item-button")) return;
      const button = e.target;
      e.stopPropagation();
      this.handleAdd(button);
    });
  },

  handleAdd(button) {
    // 1. Read the recipe from the button's data attributes.
    const addType = button.dataset.addType;
    const journeyId = button.dataset.journeyId;
    const featureId = button.dataset.featureId;
    const releaseId = button.dataset.releaseId;

    // --- THIS IS THE CRITICAL FIX ---
    // We now ONLY read the original attributes, which are guaranteed to be numbers by the new renderer.
    const beforeOrder = parseFloat(button.dataset.beforeOrder);
    const afterOrder = parseFloat(button.dataset.afterOrder);

    // 2. This calculation will now NEVER produce NaN.
    const newOrderValue = (beforeOrder + afterOrder) / 2;

    // Failsafe. Should never run now, but is good practice.
    if (isNaN(newOrderValue)) {
      console.error("Calculation resulted in NaN. Aborting.", button.dataset);
      return;
    }

    // 3. Construct the precise payload for Bubble.
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
