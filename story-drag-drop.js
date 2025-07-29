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

  // In story-drag-drop.js, replace ONLY the handleDrop function

  // In story-drag-drop.js, replace ONLY the handleDrop function

  // In story-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (target) {
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const isDropZone = target.classList.contains("empty-column-drop-zone");
      const targetId = isDropZone ? null : target.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // 1. Identify all properties of the drag source and drop target.
      const draggedColumn = this.draggedCard.closest(".feature-column");
      const targetColumn = isDropZone
        ? target.parentElement
        : target.closest(".feature-column");
      const draggedFeatureId = draggedColumn.dataset.featureId;
      const targetFeatureId = targetColumn.dataset.featureId;
      const draggedReleaseId = draggedColumn.dataset.releaseId;
      const targetReleaseId = targetColumn.dataset.releaseId;

      // 2. Detect what has changed.
      const featureChanged = draggedFeatureId !== targetFeatureId;
      const releaseChanged = draggedReleaseId !== targetReleaseId;

      let newOrderValue;
      let payload = { entityType: "story", entityId: draggedId };

      // 3. The new, more robust logic tree.
      if (featureChanged || releaseChanged) {
        // --- CASE 1: ANY RE-PARENTING MOVE (Horizontal, Vertical, or Diagonal) ---
        const storiesInNewColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => window.StoryMapDataStore.getEntity("story", c.dataset.id));
        const lastStory = storiesInNewColumn[storiesInNewColumn.length - 1];
        newOrderValue = lastStory ? lastStory.order + 10 : 10;

        payload.newValue = newOrderValue;

        // Build a dynamic fieldName and add the necessary parent IDs.
        let fieldNameParts = ["order_index"];
        if (featureChanged) {
          fieldNameParts.push("feature");
          payload.newParentId = targetFeatureId;
        }
        if (releaseChanged) {
          fieldNameParts.push("release");
          payload.newReleaseId =
            targetReleaseId === "unassigned" ? "" : targetReleaseId;
        }
        payload.fieldName = fieldNameParts.join("_and_");
      } else {
        // --- CASE 2: SIMPLE VERTICAL REORDER (No parent changes) ---
        // This is our proven "clean array" logic.
        const allStoriesInColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => window.StoryMapDataStore.getEntity("story", c.dataset.id));
        const draggedItem = allStoriesInColumn.find(
          (item) => item.id === draggedId
        );
        const listWithoutDragged = allStoriesInColumn.filter(
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

        payload.fieldName = "order_index";
        payload.newValue = newOrderValue;
      }

      // ... (Optimistic UI Update and Event Dispatch) ...
      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
