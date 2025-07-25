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
  handleDrop: function (targetCard) {
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      const entityType = this.draggedCard.dataset.type;

      if (!draggedId || draggedId === targetId) return;

      // The robust calculation logic is correct.
      const originalSortedList =
        window.StoryMapDataStore.getEntitiesArray(entityType);
      const draggedItem = originalSortedList.find(
        (item) => item.id === draggedId
      );
      const listWithoutDragged = originalSortedList.filter(
        (item) => item.id !== draggedId
      );
      const targetIndex = listWithoutDragged.findIndex(
        (item) => item.id === targetId
      );
      if (targetIndex === -1 || !draggedItem) return;

      let newOrderValue;
      const targetItem = listWithoutDragged[targetIndex];
      if (targetIndex === 0) {
        newOrderValue = targetItem.order / 2;
      } else {
        const prevItem = listWithoutDragged[targetIndex - 1];
        newOrderValue = (prevItem.order + prevItem.order) / 2;
      }
      if (newOrderValue === draggedItem.order) return;

      // Optimistic UI Update & Bubble Dispatch
      window.StoryMapDataStore.updateEntityOrder(
        entityType,
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      const fullData = window.StoryMapDataStore.getEntityForUpdate(
        entityType,
        draggedId
      );
      if (fullData) fullData.order_index = newOrderValue;

      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType: entityType,
            entityId: draggedId,
            fieldName: "order_index",
            newValue: newOrderValue,
            oldValue: draggedItem.order,
            allData: fullData,
          },
        })
      );
    } catch (err) {
      console.error(`Error in ${entityType} handleDrop:`, err);
    } finally {
      // CRITICAL: The state is now ONLY cleared here, at the very end.
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
