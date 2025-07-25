// The definitive and corrected story-drag-drop.js

window.StoryMapStoryDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    // THE FIX IS HERE: The function call is now correct.
    this.setupStoryDragging();
  },

  // THE FIX IS HERE: The function is now correctly named.
  setupStoryDragging: function () {
    const storyCards = this.container.querySelectorAll(".story-card");
    storyCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      // --- Standard Event Listeners for Visual Feedback ---
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".story-card.drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });

      card.addEventListener("dragover", (e) => {
        if (this.draggedCard && card !== this.draggedCard) {
          e.preventDefault();
          card.classList.add("drag-over");
        }
      });

      card.addEventListener("dragleave", (e) => {
        card.classList.remove("drag-over");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        if (this.draggedCard && card !== this.draggedCard) {
          this.handleDrop(card);
        }
      });
    });
  },

  // The handleDrop function from the previous step is correct.
  handleDrop: function (targetCard) {
    if (this.isProcessing || !this.draggedCard) return;
    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      const draggedColumn = this.draggedCard.closest(".feature-column");
      const targetColumn = targetCard.closest(".feature-column");
      const targetColumnId = targetColumn.dataset.featureId;

      let newOrderValue;
      let payload = {};

      if (draggedColumn.dataset.featureId === targetColumnId) {
        // --- CASE 1: VERTICAL REORDERING ---
        const allStoryIdsInColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => c.dataset.id);
        const originalSortedList = window.StoryMapDataStore.getEntitiesArray(
          "story"
        ).filter((s) => allStoryIdsInColumn.includes(s.id));
        const listWithoutDragged = originalSortedList.filter(
          (s) => s.id !== draggedId
        );
        const targetIndex = listWithoutDragged.findIndex(
          (s) => s.id === targetId
        );

        if (targetIndex === -1) return;

        if (targetIndex === 0) {
          newOrderValue = listWithoutDragged[0].order / 2;
        } else {
          const prevItem = listWithoutDragged[targetIndex - 1];
          newOrderValue =
            (prevItem.order + listWithoutDragged[targetIndex].order) / 2;
        }

        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index",
          newValue: newOrderValue,
        };
      } else {
        // --- CASE 2: HORIZONTAL RE-PARENTING ---
        const allStoryIdsInNewColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => c.dataset.id);
        const storiesInNewColumn = window.StoryMapDataStore.getEntitiesArray(
          "story"
        ).filter((s) => allStoryIdsInNewColumn.includes(s.id));

        const lastStory = storiesInNewColumn[storiesInNewColumn.length - 1];
        newOrderValue = lastStory ? lastStory.order + 10 : 10;

        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index_and_feature",
          newValue: newOrderValue,
          newParentId: targetColumnId,
        };
      }

      // (Optimistic UI Update logic would go here)

      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
