// The definitive and complete add-item-handler.js, now bilingual.

window.StoryMapAddItemHandler = {
  isInitialized: false,

  init(container) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // This listener is correct and does not need to change.
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

    let newOrderValue;

    // --- THIS IS THE CRITICAL FIX: The Bilingual Logic ---
    if (
      button.dataset.orderLeft !== undefined &&
      button.dataset.orderRight !== undefined
    ) {
      // CASE 1: This is a FEATURE button using the new, robust attributes.
      const orderLeft = parseFloat(button.dataset.orderLeft);
      const orderRight = parseFloat(button.dataset.orderRight);
      newOrderValue = (orderLeft + orderRight) / 2;
    } else {
      // CASE 2: This is a STORY button using the original attributes.
      const beforeOrder = parseFloat(button.dataset.beforeOrder);
      const afterOrder = parseFloat(button.dataset.afterOrder);
      newOrderValue = (beforeOrder + afterOrder) / 2;
    }

    // Failsafe against any remaining NaN issues.
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
