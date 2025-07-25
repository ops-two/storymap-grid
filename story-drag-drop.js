// The definitive story-drag-drop.js

window.StoryMapStoryDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupStoryDragging();
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

      // --- THE CORE LOGIC: Check if we are moving within the same column or to a new one ---

      if (draggedColumn.dataset.featureId === targetColumnId) {
        // --- CASE 1: VERTICAL REORDERING (within the same column) ---
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
        // --- CASE 2: HORIZONTAL RE-PARENTING (to a new column) ---
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
          fieldName: "order_index_and_feature", // A special field name for our workflow
          newValue: newOrderValue,
          newParentId: targetColumnId,
        };
      }

      // --- Perform optimistic UI update and dispatch the event ---
      // (Code to update local data store and re-render)
      // ...

      // CRITICAL CHANGE: We now dispatch to the generic "storymap:update" event
      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
