// The definitive feature-drag-drop.js with the race condition fixed.

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupFeatureDragging();
  },

  setupFeatureDragging: function () {
    const featureCards = this.container.querySelectorAll(".feature-card");
    featureCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      // Drag Start: Set the dragged card and a visual class.
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
      });

      // CRITICAL FIX: The dragend listener must ONLY handle visual cleanup.
      // It MUST NOT change the this.draggedCard state.
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".feature-card.drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });

      // Drag Over: Provides the dotted line visual feedback.
      card.addEventListener("dragover", (e) => {
        if (this.draggedCard && card !== this.draggedCard) {
          e.preventDefault();
          card.classList.add("drag-over");
        }
      });

      // Drag Leave: Removes the dotted line.
      card.addEventListener("dragleave", (e) => {
        card.classList.remove("drag-over");
      });

      // Drop: Calls the handleDrop function to perform the logic.
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        if (this.draggedCard && card !== this.draggedCard) {
          this.handleDrop(card);
        }
      });
    });
  },

  // The handleDrop function now has sole responsibility for state and logic.
  // In BOTH journey-drag-drop.js AND feature-drag-drop.js,
  // replace ONLY the handleDrop function with this version.

  handleDrop: function (targetCard) {
    // Failsafes to prevent errors
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      const entityType = this.draggedCard.dataset.type;

      if (!draggedId || draggedId === targetId) return;

      // --- THE DEFINITIVE, CORRECTED CALCULATION LOGIC ---

      // 1. Get the original, reliably sorted list from our Data Store.
      const originalSortedList =
        window.StoryMapDataStore.getEntitiesArray(entityType);
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
      if (targetIndex === -1 || !draggedItem) return;

      // 4. Calculate the new order value based on the clean array.
      let newOrderValue;
      const targetItem = listWithoutDragged[targetIndex];

      if (targetIndex === 0) {
        newOrderValue = targetItem.order / 2;
      } else {
        const prevItem = listWithoutDragged[targetIndex - 1];
        // THIS IS THE CORRECTED CALCULATION
        newOrderValue = (prevItem.order + targetItem.order) / 2;
      }

      if (newOrderValue === draggedItem.order) return;

      // --- OPTIMISTIC UI UPDATE & BUBBLE DISPATCH ---
      window.StoryMapDataStore.updateEntityOrder(
        entityType,
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // --- THE CRITICAL FIX: DISPATCH THE CORRECT 'reorder' EVENT ---
      // This is the correct internal signal for your working Event Bridge.
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
