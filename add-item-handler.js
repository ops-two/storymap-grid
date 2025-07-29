// The definitive and complete add-item-handler.js

window.StoryMapAddItemHandler = {
  isInitialized: false,

  // In add-item-handler.js, replace ONLY the init function

  init(container) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // This log PROVES that this function is being called.
    console.log(
      "%c--- AddItemHandler init() EXECUTED ---",
      "color: green; font-weight: bold;"
    );
    // This log PROVES we received the correct container.
    console.log("AddItemHandler received container element:", container);

    container.addEventListener("click", (e) => {
      // This log PROVES the listener is attached and hearing clicks.
      console.log("Container clicked. Checking if target is an add button...");

      if (!e.target.classList.contains("add-item-button")) return;

      console.log("%cAdd Item Button Clicked!", "color: green;");
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
