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
  // In story-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    console.log("--- Story handleDrop initiated ---"); // Checkpoint 1

    if (this.isProcessing || !this.draggedCard) {
      console.error("Drop cancelled: isProcessing or no draggedCard.");
      return;
    }

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) {
        console.error("Drop cancelled: No ID or same card.");
        return;
      }
      console.log(
        `Checkpoint 2: Dragged ID = ${draggedId}, Target ID = ${targetId}`
      );

      // --- THE MOST LIKELY POINT OF FAILURE IS HERE ---
      const draggedColumn = this.draggedCard.closest(".feature-column");
      const targetColumn = targetCard.closest(".feature-column");

      // These values MUST exist. If they are undefined, the next step will fail.
      const draggedColumnId = draggedColumn
        ? draggedColumn.dataset.featureId
        : "undefined";
      const targetColumnId = targetColumn
        ? targetColumn.dataset.featureId
        : "undefined";
      console.log(
        `Checkpoint 3: Dragged Column ID = ${draggedColumnId}, Target Column ID = ${targetColumnId}`
      );

      let newOrderValue;
      let payload = {};

      if (draggedColumnId === targetColumnId) {
        console.log("Checkpoint 4: Verdict = VERTICAL move.");
        // ... (vertical reordering logic) ...
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
        console.log("Checkpoint 4: Verdict = HORIZONTAL move.");
        // ... (horizontal re-parenting logic) ...
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

      // --- OPTIMISTIC UI UPDATE (Also fixes the "not refreshing" issue) ---
      console.log("Checkpoint 5: Performing optimistic UI update.");
      window.StoryMapDataStore.updateEntityOrder(
        "story",
        draggedId,
        newOrderValue
      );
      // If it's a horizontal move, we also need to update the parent feature locally
      if (payload.newParentId) {
        const story = window.StoryMapDataStore.getEntity("story", draggedId);
        if (story) story.featureId = payload.newParentId;
      }
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // --- FINAL STEP: DISPATCH THE EVENT ---
      console.log(
        "Checkpoint 6: Dispatching storymap:update with payload:",
        payload
      );
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
