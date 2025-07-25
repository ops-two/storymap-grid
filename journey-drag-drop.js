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

  // In BOTH journey-drag-drop.js AND feature-drag-drop.js,
  // replace ONLY the handleDrop function with this version.

  handleDrop: function (targetCard) {
    // Failsafes to prevent errors.
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      const entityType = this.draggedCard.dataset.type;

      if (!draggedId || draggedId === targetId) return;

      // --- THE DEFINITIVE, DIRECTION-AWARE CALCULATION LOGIC ---

      // 1. Get the original, reliably sorted list from our Data Store.
      // We will use this original list for ALL calculations to avoid errors.
      const sortedList = window.StoryMapDataStore.getEntitiesArray(entityType);

      const draggedItem = sortedList.find((item) => item.id === draggedId);
      const targetItem = sortedList.find((item) => item.id === targetId);

      const draggedIndex = sortedList.findIndex(
        (item) => item.id === draggedId
      );
      const targetIndex = sortedList.findIndex((item) => item.id === targetId);

      if (targetIndex === -1 || draggedIndex === -1) {
        console.error("Could not find dragged or target item.");
        return;
      }

      // 2. Calculate the new order value based on the drag direction.
      let newOrderValue;

      if (draggedIndex > targetIndex) {
        // --- CASE 1: DRAGGING RIGHT-TO-LEFT ---
        // The user wants to place the item BEFORE the target.
        // This logic is simple and correct.
        if (targetIndex === 0) {
          // This handles the "0 index" case you mentioned. We place it before the first item.
          newOrderValue = targetItem.order / 2;
        } else {
          const prevItem = sortedList[targetIndex - 1];
          newOrderValue = (prevItem.order + targetItem.order) / 2;
        }
      } else {
        // --- CASE 2: DRAGGING LEFT-TO-RIGHT ---
        // The user also wants to place the item BEFORE the target, but the UI feels different.
        // The correct logic is to place it between the target and the item AFTER the target.
        const nextItem = sortedList[targetIndex + 1];
        if (nextItem) {
          // Dropping between two items
          newOrderValue = (targetItem.order + nextItem.order) / 2;
        } else {
          // Dropping at the very end of the list
          newOrderValue = targetItem.order + 10;
        }
      }

      if (newOrderValue === draggedItem.order) return; // No change needed

      // --- OPTIMISTIC UI UPDATE & BUBBLE DISPATCH (This part is correct) ---
      window.StoryMapDataStore.updateEntityOrder(
        entityType,
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // This correctly dispatches to the 'reorder' event for your robust workflow.
      document.dispatchEvent(
        new CustomEvent("storymap:reorder", {
          detail: {
            entityType: entityType,
            entityId: draggedId,
            newValue: newOrderValue,
          },
        })
      );
    } catch (err) {
      console.error(`Error in ${entityType} handleDrop:`, err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
