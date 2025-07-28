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

  // In journey-drag-drop.js, replace ONLY the handleDrop function

  // In journey-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    // Failsafes to prevent errors.
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // --- THE PROVEN "CLEAN ARRAY" CALCULATION LOGIC ---
      // This is the exact algorithm that is working perfectly for your features.

      // 1. Get the original, reliably sorted list from our Data Store.
      const originalSortedList =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedItem = originalSortedList.find(
        (item) => item.id === draggedId
      );

      // 2. Create a "clean" array for calculation by removing the item being dragged.
      const listWithoutDragged = originalSortedList.filter(
        (item) => item.id !== draggedId
      );

      // 3. Find the target's index in this NEW, clean array.
      const targetIndex = listWithoutDragged.findIndex(
        (item) => item.id === targetId
      );
      if (targetIndex === -1 || !draggedItem) {
        console.error(
          "Could not find dragged or target journey in clean list."
        );
        // Reset state and exit cleanly
        this.isProcessing = false;
        this.draggedCard = null;
        return;
      }

      // 4. Calculate the new order value based on the clean array. This logic is universal.
      let newOrderValue;
      const targetItem = listWithoutDragged[targetIndex];

      if (targetIndex === 0) {
        // This correctly handles the "first index" case.
        newOrderValue = targetItem.order / 2;
      } else {
        // This correctly handles all other cases in both directions.
        const prevItem = listWithoutDragged[targetIndex - 1];
        newOrderValue = (prevItem.order + targetItem.order) / 2;
      }

      if (newOrderValue === draggedItem.order) {
        // No change needed, so we can exit early.
        this.isProcessing = false;
        this.draggedCard = null;
        return;
      }

      // --- OPTIMISTIC UI UPDATE & BUBBLE DISPATCH (Tailored for Journeys) ---
      window.StoryMapDataStore.updateEntityOrder(
        "journey",
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // This correctly gets the rich payload for the 'update' event.
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
            oldValue: draggedItem.order,
            allData: fullJourneyData,
          },
        })
      );
    } catch (err) {
      console.error("Error in Journey handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
