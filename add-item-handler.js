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

  // In add-item-handler.js, replace ONLY the handleAdd function

  handleAdd(button) {
    console.log(
      "%c--- ADD ITEM HANDLER INITIATED ---",
      "color: #ff00ff; font-weight: bold;"
    );
    console.log("STEP 1: The button element that was clicked is:", button);
    console.log(
      "STEP 2: Inspecting the full dataset of the clicked button:",
      button.dataset
    );

    const addType = button.dataset.addType;
    const journeyId = button.dataset.journeyId;

    // --- WE WILL LOG THE RAW VALUES BEFORE PARSING ---
    const rawBeforeOrder = button.dataset.beforeOrder;
    const rawAfterOrder = button.dataset.afterOrder;
    console.log(
      `STEP 3: Raw attribute values. beforeOrder: "${rawBeforeOrder}", afterOrder: "${rawAfterOrder}"`
    );

    const beforeOrder = parseFloat(rawBeforeOrder);
    const afterOrder = parseFloat(rawAfterOrder);
    console.log(
      `STEP 4: Values after parseFloat. beforeOrder: ${beforeOrder}, afterOrder: ${afterOrder}`
    );

    const newOrderValue = (beforeOrder + afterOrder) / 2;
    console.log(
      `%cSTEP 5: FINAL CALCULATED newOrderValue = ${newOrderValue}`,
      "color: green; font-weight: bold;"
    );

    // Failsafe from your working code.
    if (isNaN(newOrderValue)) {
      console.error("Calculation resulted in NaN. Aborting.", button.dataset);
      return;
    }

    const payload = {
      addType: addType,
      newOrderValue: newOrderValue,
      ...(journeyId && { parentJourneyId: journeyId }),
    };

    console.log("--- DEBUGGING COMPLETE. FIRING EVENT TO BUBBLE. ---");
    document.dispatchEvent(
      new CustomEvent("storymap:add", { detail: payload })
    );
  },
};
