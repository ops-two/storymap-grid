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

      if (isPlaceholder) {
        const targetFeatureId = target.dataset.featureId;
        const targetReleaseId = target.dataset.releaseId;
        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index_and_feature_and_release",
          newValue: 10,
          newParentId: targetFeatureId,
          newReleaseId: targetReleaseId === "unassigned" ? "" : targetReleaseId,
        };
      } else {
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
          // --- THIS IS THE DEFINITIVE FIX FOR DIAGONAL DROPS ---
          const allStoriesInNewColumn = Array.from(
            targetColumn.querySelectorAll(".story-card")
          ).map((c) =>
            window.StoryMapDataStore.getEntity("story", c.dataset.id)
          );

          if (targetId) {
            // Case 1: Dropped ON a specific story in the new column
            const targetItem = allStoriesInNewColumn.find(
              (item) => item.id === targetId
            );
            const targetIndex = allStoriesInNewColumn.findIndex(
              (item) => item.id === targetId
            );
            if (targetIndex === -1) {
              this.isProcessing = false;
              return;
            }

            const prevItem =
              targetIndex > 0 ? allStoriesInNewColumn[targetIndex - 1] : null;
            newOrderValue = prevItem
              ? (prevItem.order + targetItem.order) / 2
              : targetItem.order / 2;
          } else {
            // Case 2: Dropped into an empty space (placeholder or drop zone) in the new column
            const lastStory =
              allStoriesInNewColumn[allStoriesInNewColumn.length - 1];
            newOrderValue = lastStory ? lastStory.order + 10 : 10;
          }

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
          // --- THIS IS THE DEFINITIVE FIX: YOUR PROVEN RE-INDEXING LOGIC ---
          const allStoriesInColumn = Array.from(
            targetColumn.querySelectorAll(".story-card")
          ).map((c) =>
            window.StoryMapDataStore.getEntity("story", c.dataset.id)
          );
          const targetItem = allStoriesInColumn.find(
            (item) => item.id === targetId
          );
          const draggedIndex = allStoriesInColumn.findIndex(
            (item) => item.id === draggedId
          );
          const targetIndex = allStoriesInColumn.findIndex(
            (item) => item.id === targetId
          );

          if (draggedIndex > targetIndex) {
            // Dragging DOWN-TO-UP
            if (targetIndex === 0) {
              newOrderValue = targetItem.order / 2;
            } else {
              const prevItem = allStoriesInColumn[targetIndex - 1];
              newOrderValue = (prevItem.order + targetItem.order) / 2;
            }
          } else {
            // Dragging UP-TO-DOWN
            const nextItem = allStoriesInColumn[targetIndex + 1];
            if (nextItem) {
              newOrderValue = (targetItem.order + nextItem.order) / 2;
            } else {
              newOrderValue = targetItem.order + 10;
            }
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
