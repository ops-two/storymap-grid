// The definitive story-drag-drop.js, built from your proven working code.

window.StoryMapStoryDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupStoryDragging();
  },

  setupStoryDragging: function () {
    const storyCards = this.container.querySelectorAll(".story-card");
    storyCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        this.container.classList.add("story-drag-active");
      });
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        this.container.classList.remove("story-drag-active");
        document
          .querySelectorAll(".drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });
    });

    // --- THE CRITICAL UPGRADE ---
    // The drop targets now include our new empty story placeholder.
    const dropTargets = this.container.querySelectorAll(
      ".story-card, .empty-column-drop-zone, .empty-story-placeholder"
    );
    dropTargets.forEach((target) => {
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
        if (this.draggedCard) {
          // Allow dropping on itself to cancel drag
          this.handleDrop(target);
        }
      });
    });
  },

  handleDrop: function (target) {
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;

      // --- THE UPGRADED LOGIC ---
      const isPlaceholder = target.classList.contains(
        "empty-story-placeholder"
      );
      const isDropZone = target.classList.contains("empty-column-drop-zone");
      const targetId = isPlaceholder || isDropZone ? null : target.dataset.id;

      if (draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      let payload;

      // --- CASE 1: Dropping into an EMPTY feature column (+ Add Story box) ---
      if (isPlaceholder) {
        const targetFeatureId = target.dataset.featureId;
        const targetReleaseId = target.dataset.releaseId;
        const newOrderValue = 10; // First story in a column can be 10.

        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index_and_feature_and_release",
          newValue: newOrderValue,
          newParentId: targetFeatureId,
          newReleaseId: targetReleaseId === "unassigned" ? "" : targetReleaseId,
        };
      } else {
        // --- CASE 2: Dropping on another card or a normal drop zone (Your proven, working logic) ---
        const draggedColumn = this.draggedCard.closest(".feature-column");
        const targetColumn = target.closest(".feature-column");
        const draggedFeatureId = draggedColumn.dataset.featureId;
        const targetFeatureId = targetColumn.dataset.featureId;
        const draggedReleaseId = draggedColumn.dataset.releaseId;
        const targetReleaseId = targetColumn.dataset.releaseId;
        const featureChanged = draggedFeatureId !== targetFeatureId;
        const releaseChanged = draggedReleaseId !== targetReleaseId;

        let newOrderValue;
        payload = { entityType: "story", entityId: draggedId };

        if (featureChanged || releaseChanged) {
          const storiesInNewColumn = Array.from(
            targetColumn.querySelectorAll(".story-card")
          ).map((c) =>
            window.StoryMapDataStore.getEntity("story", c.dataset.id)
          );
          const lastStory = storiesInNewColumn[storiesInNewColumn.length - 1];
          newOrderValue = lastStory ? lastStory.order + 10 : 10;
          payload.newValue = newOrderValue;
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
          const allStoriesInColumn = Array.from(
            targetColumn.querySelectorAll(".story-card")
          ).map((c) =>
            window.StoryMapDataStore.getEntity("story", c.dataset.id)
          );
          const draggedItem = allStoriesInColumn.find(
            (item) => item.id === draggedId
          );
          const listWithoutDragged = allStoriesInColumn.filter(
            (item) => item.id !== draggedId
          );
          const targetIndex = listWithoutDragged.findIndex(
            (item) => item.id === targetId
          );
          if (targetIndex === -1 || !draggedItem) {
            this.isProcessing = false;
            return;
          }
          const targetItem = listWithoutDragged[targetIndex];
          if (targetIndex === 0) {
            newOrderValue = targetItem.order / 2;
          } else {
            const prevItem = listWithoutDragged[targetIndex - 1];
            newOrderValue = (prevItem.order + targetItem.order) / 2;
          }
          if (newOrderValue === draggedItem.order) {
            this.isProcessing = false;
            return;
          }
          payload.fieldName = "order_index";
          payload.newValue = newOrderValue;
        }
      }

      // --- (Your proven Optimistic UI Update and Event Dispatch logic is preserved here) ---
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
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
