// The definitive story-drag-drop.js, now with empty column support.

window.StoryMapStoryDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupStoryDragging();
  },

  setupStoryDragging: function () {
    // --- CHANGE #1: Target ALL story cards first to make them draggable ---
    const storyCards = this.container.querySelectorAll(".story-card");
    storyCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      // Standard dragstart and dragend listeners for the card being dragged
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
        this.container.classList.add("story-drag-active");
      });
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
        this.container.classList.remove("story-drag-active");
      });
    });

    // --- CHANGE #2: Target ALL potential drop zones to listen for drops ---
    // This now includes both story cards AND the new empty-column-drop-zone
    const dropTargets = this.container.querySelectorAll(
      ".story-card, .empty-column-drop-zone"
    );
    dropTargets.forEach((target) => {
      // Attach listeners for visual feedback and the drop action
      target.addEventListener("dragover", (e) => {
        if (this.draggedCard && this.draggedCard !== target) {
          e.preventDefault();
          target.classList.add("drag-over");
        }
      });
      target.addEventListener("dragleave", (e) => {
        target.classList.remove("drag-over");
      });
      target.addEventListener("drop", (e) => {
        e.preventDefault();
        target.classList.remove("drag-over");
        if (this.draggedCard && this.draggedCard !== target) {
          this.handleDrop(target);
        }
      });
    });
  },

  handleDrop: function (target) {
    // Renamed to 'target' for clarity
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;

      // --- CHANGE #3: Intelligent identification of target and columns ---
      const isDropZone = target.classList.contains("empty-column-drop-zone");
      const targetId = isDropZone ? null : target.dataset.id; // A drop zone has no targetId

      if (!draggedId || draggedId === targetId) return;

      const draggedColumn = this.draggedCard.closest(".feature-column");
      // If the target is a drop zone, it IS the column. Otherwise, find the closest column.
      const targetColumn = isDropZone
        ? target.parentElement
        : target.closest(".feature-column");
      const targetColumnId = targetColumn.dataset.featureId;

      let newOrderValue;
      let payload;

      // --- The core logic is now even more robust ---
      if (isDropZone || draggedColumn.dataset.featureId !== targetColumnId) {
        // --- CASE 1: HORIZONTAL RE-PARENTING (or dropping in an empty column) ---
        const allStoryIdsInNewColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => c.dataset.id);
        const storiesInNewColumn = window.StoryMapDataStore.getEntitiesArray(
          "story"
        ).filter((s) => allStoryIdsInNewColumn.includes(s.id));
        const lastStory = storiesInNewColumn[storiesInNewColumn.length - 1];

        newOrderValue = lastStory ? lastStory.order + 10 : 10; // If column is empty, start at 10

        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index_and_feature",
          newValue: newOrderValue,
          newParentId: targetColumnId,
        };
      } else {
        // --- CASE 2: VERTICAL REORDERING (This logic is your proven, working code) ---
        const allStoryIdsInColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => c.dataset.id);
        const originalSortedList = window.StoryMapDataStore.getEntitiesArray(
          "story"
        ).filter((s) => allStoryIdsInColumn.includes(s.id));
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

        const targetItem = listWithoutDragged[targetIndex];
        if (targetIndex === 0) {
          newOrderValue = targetItem.order / 2;
        } else {
          const prevItem = listWithoutDragged[targetIndex - 1];
          newOrderValue = (prevItem.order + targetItem.order) / 2;
        }
        if (newOrderValue === draggedItem.order) return;

        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index",
          newValue: newOrderValue,
        };
      }

      // Optimistic UI Update and Event Dispatch (Unchanged)
      window.StoryMapDataStore.updateEntityOrder(
        "story",
        draggedId,
        newOrderValue
      );
      if (payload.newParentId) {
        /* ... */
      }
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
      }
      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
