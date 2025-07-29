// The definitive add-item-handler.js

window.StoryMapAddItemHandler = {
  isInitialized: false,

  init(container) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Use a single, delegated listener for all add buttons.
    container.addEventListener("click", (e) => {
      if (!e.target.classList.contains("add-item-button")) return;

      const button = e.target;
      e.stopPropagation(); // Prevent card clicks or other events from firing.

      this.handleAdd(button);
    });
  },

  handleAdd(button) {
    // 1. Read the "recipe" from the button's data attributes.
    const addType = button.dataset.addType;
    const journeyId = button.dataset.journeyId;
    const featureId = button.dataset.featureId;
    const releaseId = button.dataset.releaseId;
    const beforeOrder = parseFloat(button.dataset.beforeOrder);
    const afterOrder = parseFloat(button.dataset.afterOrder);

    // 2. Calculate the new order_index using the proven midpoint method.
    const newOrderValue = (beforeOrder + afterOrder) / 2;

    // 3. Construct the precise payload for Bubble.
    const payload = {
      addType: addType,
      newOrderValue: newOrderValue,
      // Only include parent IDs that are relevant for this type of item.
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
