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

  // In BOTH journey-drag-drop.js AND feature-drag-drop.js,
  // replace ONLY the handleDrop function with this version.

  // In BOTH journey-drag-drop.js AND feature-drag-drop.js,
  // replace ONLY the handleDrop function with this version.

  // In BOTH journey-drag-drop.js AND feature-drag-drop.js,
  // replace ONLY the handleDrop function with this version.

  // In feature-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // The perfected, direction-aware calculation logic
      const sortedList = window.StoryMapDataStore.getEntitiesArray("feature");
      const draggedItem = sortedList.find((item) => item.id === draggedId);
      const targetIndex = sortedList.findIndex((item) => item.id === targetId);
      if (targetIndex === -1 || !draggedItem) return;

      let newOrderValue;
      const targetItem = sortedList[targetIndex];
      const draggedIndex = sortedList.findIndex(
        (item) => item.id === draggedId
      );

      if (draggedIndex > targetIndex) {
        // Dragging RIGHT-TO-LEFT
        if (targetIndex === 0) {
          newOrderValue = targetItem.order / 2;
        } else {
          const prevItem = sortedList[targetIndex - 1];
          newOrderValue = (prevItem.order + targetItem.order) / 2;
        }
      } else {
        // Dragging LEFT-TO-RIGHT
        const nextItem = sortedList[targetIndex + 1];
        if (nextItem) {
          newOrderValue = (targetItem.order + nextItem.order) / 2;
        } else {
          newOrderValue = targetItem.order + 10;
        }
      }
      if (newOrderValue === draggedItem.order) return;

      // Optimistic UI Update is the same
      window.StoryMapDataStore.updateEntityOrder(
        "feature",
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // --- CRITICAL: DISPATCH THE 'reorder' EVENT WITH SIMPLE PAYLOAD ---
      document.dispatchEvent(
        new CustomEvent("storymap:reorder", {
          detail: {
            entityType: "feature",
            entityId: draggedId,
            newValue: newOrderValue,
          },
        })
      );
    } catch (err) {
      console.error("Error in Feature handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
