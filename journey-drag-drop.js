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
  handleDrop: function (targetCard) {
    if (this.isProcessing) return;
    if (!this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      const sortedJourneys =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedJourney = sortedJourneys.find((j) => j.id === draggedId);
      const targetIndex = sortedJourneys.findIndex((j) => j.id === targetId);
      if (targetIndex === -1 || !draggedJourney) return;

      let newOrderValue;
      const targetJourney = sortedJourneys[targetIndex];
      if (targetIndex === 0) {
        newOrderValue = targetJourney.order / 2;
      } else {
        const prevJourney = sortedJourneys[targetIndex - 1];
        newOrderValue = (prevJourney.order + targetJourney.order) / 2;
      }
      if (newOrderValue === draggedJourney.order) return;

      // OPTIMISTIC UI UPDATE
      window.StoryMapDataStore.updateEntityOrder(
        "journey",
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // DISPATCH UPDATE TO BUBBLE
      const fullJourneyData = window.StoryMapDataStore.getEntityForUpdate(
        "journey",
        draggedId
      );
      fullJourneyData.order_index = newOrderValue;

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
