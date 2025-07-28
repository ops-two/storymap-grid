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

  handleDrop: function (target) {
    console.log(
      "%c--- STORY DROP INITIATED ---",
      "color: #ff00ff; font-weight: bold;"
    );
    if (this.isProcessing || !this.draggedCard) {
      console.error("Drop cancelled: isProcessing or no draggedCard.");
      return;
    }

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const isDropZone = target.classList.contains("empty-column-drop-zone");
      const targetId = isDropZone ? null : target.dataset.id;
      console.log(
        `STEP 1: Dragged ID: ${draggedId}, Target ID: ${
          targetId || "EMPTY DROP ZONE"
        }`
      );
      if (!draggedId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      const draggedColumn = this.draggedCard.closest(".feature-column");
      const targetColumn = isDropZone
        ? target.parentElement
        : target.closest(".feature-column");
      const draggedFeatureId = draggedColumn.dataset.featureId;
      const targetFeatureId = targetColumn.dataset.featureId;
      const draggedReleaseId = draggedColumn.dataset.releaseId;
      const targetReleaseId = targetColumn.dataset.releaseId;
      console.log(
        `STEP 2: Dragged [F:${draggedFeatureId}, R:${draggedReleaseId}], Target [F:${targetFeatureId}, R:${targetReleaseId}]`
      );

      let newOrderValue;
      let payload;

      if (draggedFeatureId !== targetFeatureId) {
        console.log("VERDICT: HORIZONTAL (Feature) move.");
        const storiesInNewColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => window.StoryMapDataStore.getEntity("story", c.dataset.id));
        const lastStory = storiesInNewColumn[storiesInNewColumn.length - 1];
        newOrderValue = lastStory ? lastStory.order + 10 : 10;
        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index_and_feature",
          newValue: newOrderValue,
          newParentId: targetFeatureId,
        };
      } else if (draggedReleaseId !== targetReleaseId) {
        console.log("VERDICT: VERTICAL (Release) move.");
        const storiesInNewColumn = Array.from(
          targetColumn.querySelectorAll(".story-card")
        ).map((c) => window.StoryMapDataStore.getEntity("story", c.dataset.id));
        const lastStory = storiesInNewColumn[storiesInNewColumn.length - 1];
        newOrderValue = lastStory ? lastStory.order + 10 : 10;
        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index_and_release",
          newValue: newOrderValue,
          newReleaseId: targetReleaseId === "unassigned" ? "" : targetReleaseId,
        };
      } else {
        console.log("VERDICT: SIMPLE VERTICAL reorder.");
        // --- THIS IS THE COMPLETE, WORKING "CLEAN ARRAY" LOGIC ---
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

        if (targetIndex === -1 || !draggedItem) {
          console.error("ABORT: Target not found.");
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
        payload = {
          entityType: "story",
          entityId: draggedId,
          fieldName: "order_index",
          newValue: newOrderValue,
        };
      }

      console.log(
        `%cSTEP 3: FINAL PAYLOAD = `,
        "color: green; font-weight: bold;",
        payload
      );

      // --- Optimistic UI Update & Dispatch ---
      window.StoryMapDataStore.updateEntityOrder(
        "story",
        draggedId,
        newOrderValue
      );
      if (payload.newParentId) {
        const story = window.StoryMapDataStore.getEntity("story", draggedId);
        if (story) story.featureId = payload.newParentId;
      }
      if (payload.newReleaseId !== undefined) {
        const story = window.StoryMapDataStore.getEntity("story", draggedId);
        if (story) story.releaseId = payload.newReleaseId;
      }

      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: payload })
      );
    } catch (err) {
      console.error("CRITICAL ERROR in handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
