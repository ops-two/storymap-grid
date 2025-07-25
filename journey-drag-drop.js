// The definitive journey-drag-drop.js with correct UX and Visual Feedback

window.StoryMapJourneyDragDrop = {
  draggedCard: null,
  isProcessing: false,

  // We are restoring the original, reliable init and setup functions.
  init: function (container) {
    this.container = container;
    this.cleanup();
    this.setupJourneyDragging();
  },

  cleanup: function () {
    if (!this.container) return;
    // This direct cleanup is more reliable than cloning.
    const journeyCards = this.container.querySelectorAll(".journey-card");
    journeyCards.forEach((card) => {
      card.draggable = false;
      // A clean way to remove specific listeners if needed, but for now we re-render.
    });
  },

  setupJourneyDragging: function () {
    const journeyCards = this.container.querySelectorAll(".journey-card");
    journeyCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      // --- ALL ORIGINAL EVENT LISTENERS ARE RESTORED FOR PERFECT UX ---

      // Drag Start: Set the dragged card and a visual class.
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        // Use a short timeout to prevent visual glitches as the drag starts.
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
      });

      // Drag End: Clean up all visual styles.
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        // Failsafe cleanup: remove the drag-over class from ALL cards.
        document
          .querySelectorAll(".journey-card.drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });

      // Drag Over: THIS IS THE KEY FIX for the dotted line.
      card.addEventListener("dragover", (e) => {
        if (this.draggedCard && card !== this.draggedCard) {
          e.preventDefault(); // This is essential to allow a drop.
          card.classList.add("drag-over"); // Apply the dotted border style.
        }
      });

      // Drag Leave: THIS IS THE KEY FIX for removing the dotted line.
      card.addEventListener("dragleave", (e) => {
        card.classList.remove("drag-over");
      });

      // Drop: Finalize the action.
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over"); // Clean up the target card's style.
        if (this.draggedCard && card !== this.draggedCard) {
          this.handleDrop(card);
        }
      });
    });
  },

  // The handleDrop function is the one we perfected in the last step. It is correct.
  // In journey-drag-drop.js, replace ONLY the handleDrop function

  // In journey-drag-drop.js, replace ONLY the handleDrop function

  // In journey-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    // Failsafes to prevent errors. This part is unchanged.
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // --- THE DEFINITIVE, UNIFIED CALCULATION LOGIC ---
      // This new logic replaces the flawed "direction-aware" block.

      // 1. Get the original, reliably sorted list from our Data Store.
      const originalSortedJourneys =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedJourney = originalSortedJourneys.find(
        (j) => j.id === draggedId
      );

      // 2. CRITICAL FIX: Create a "clean" array for calculation by removing the item being dragged.
      const journeysWithoutDragged = originalSortedJourneys.filter(
        (j) => j.id !== draggedId
      );

      // 3. Find the target's index in this NEW, clean array.
      const targetIndex = journeysWithoutDragged.findIndex(
        (j) => j.id === targetId
      );
      if (targetIndex === -1 || !draggedJourney) {
        console.error(
          "Could not find dragged or target journey in clean list."
        );
        return;
      }

      // 4. Calculate the new order value based on the clean array. The logic is now universal.
      let newOrderValue;
      const targetJourney = journeysWithoutDragged[targetIndex];

      if (targetIndex === 0) {
        // Case 1: Dropping at the very beginning of the list.
        newOrderValue = targetJourney.order / 2;
      } else {
        // Case 2: Dropping anywhere else. Place it between the item before the target and the target itself.
        const prevJourney = journeysWithoutDragged[targetIndex - 1];
        newOrderValue = (prevJourney.order + targetJourney.order) / 2;
      }

      if (newOrderValue === draggedJourney.order) return; // No change needed

      // --- OPTIMISTIC UI UPDATE & BUBBLE DISPATCH ---
      // This entire section is preserved from your working code to ensure
      // the correct event and payload are sent.

      window.StoryMapDataStore.updateEntityOrder(
        "journey",
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      const fullJourneyData = window.StoryMapDataStore.getEntityForUpdate(
        "journey",
        draggedId
      );
      if (fullJourneyData) fullJourneyData.order_index = newOrderValue;

      // This correctly dispatches to the "storymap:update" event.
      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType: "journey",
            entityId: draggedId,
            fieldName: "order_index",
            newValue: newOrderValue,
            oldValue: draggedJourney.order,
            allData: fullJourneyData,
          },
        })
      );
    } catch (err) {
      console.error("Error in handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
