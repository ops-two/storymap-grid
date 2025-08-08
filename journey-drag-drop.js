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

  handleDrop: function (targetCard) {
    // Failsafes to prevent errors.
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // --- THE PROVEN "DIRECTION-AWARE" LOGIC FROM YOUR WORKING FEATURE MODULE ---
      const sortedList = window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedItem = sortedList.find((item) => item.id === draggedId);
      const targetIndex = sortedList.findIndex((item) => item.id === targetId);

      if (targetIndex === -1 || !draggedItem) {
        this.isProcessing = false;
        return;
      }

      let newOrderValue;
      const targetItem = sortedList[targetIndex];
      const draggedIndex = sortedList.findIndex(
        (item) => item.id === draggedId
      );

      if (draggedIndex > targetIndex) {
        if (targetIndex === 0) {
          newOrderValue = targetItem.order / 2;
        } else {
          const prevItem = sortedList[targetIndex - 1];
          newOrderValue = (prevItem.order + targetItem.order) / 2;
        }
      } else {
        const nextItem = sortedList[targetIndex + 1];
        if (nextItem) {
          newOrderValue = (targetItem.order + nextItem.order) / 2;
        } else {
          newOrderValue = targetItem.order + 10;
        }
      }

      if (newOrderValue === draggedItem.order) {
        this.isProcessing = false;
        this.draggedCard = null;
        return; // No change needed
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
