// The definitive, complete, and final add-item-handler.js.

window.StoryMapAddItemHandler = {
  isInitialized: false,

  init(container) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // This is your proven, working event listener. It is preserved perfectly.
    container.addEventListener("click", (e) => {
      if (!e.target.classList.contains("add-item-button")) return;
      const button = e.target;
      e.stopPropagation();
      this.handleAdd(button);
    });
  },

  // This is your proven function, now upgraded to handle stories.
  handleAdd(button) {
    // 1. Read ALL potential data attributes from the button.
    const addType = button.dataset.addType;
    const journeyId = button.dataset.journeyId;
    // --- THE CRITICAL FIX IS HERE ---
    const featureId = button.dataset.featureId;
    const releaseId = button.dataset.releaseId;

    const beforeOrder = parseFloat(button.dataset.beforeOrder);
    const afterOrder = parseFloat(button.dataset.afterOrder);

    // 2. The calculation is correct.
    const newOrderValue = (beforeOrder + afterOrder) / 2;

    // Failsafe is correct.
    if (isNaN(newOrderValue)) {
      console.error("Calculation resulted in NaN. Aborting.", button.dataset);
      return;
    }

    // 3. Construct the precise payload for Bubble.
    // THIS IS THE CRITICAL FIX: It now correctly includes ALL relevant parent IDs.
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
