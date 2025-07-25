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

  // In story-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    console.log("--- VERTICAL DEBUG: handleDrop initiated ---"); // Checkpoint 1

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

      const draggedColumn = this.draggedCard.closest(".feature-column");
      const targetColumn = targetCard.closest(".feature-column");

      const draggedColumnId = draggedColumn
        ? draggedColumn.dataset.featureId
        : "undefined";
      const targetColumnId = targetColumn
        ? targetColumn.dataset.featureId
        : "undefined";
      console.log(
        `Checkpoint 3: Dragged Column ID = ${draggedColumnId}, Target Column ID = ${targetColumnId}`
      );

      if (draggedColumnId !== targetColumnId) {
        console.log("Horizontal move detected. Ignoring for this test.");
        return; // We are ONLY testing vertical moves right now.
      }

      console.log(
        "Checkpoint 4: Verdict = VERTICAL move. Proceeding with calculation."
      );
      let newOrderValue;
      let payload = {};

      // --- Vertical Reordering Logic ---
      const allStoryIdsInColumn = Array.from(
        targetColumn.querySelectorAll(".story-card")
      ).map((c) => c.dataset.id);
      console.log(
        `Checkpoint 4a: Found ${allStoryIdsInColumn.length} stories in target column.`
      );

      const originalSortedList = window.StoryMapDataStore.getEntitiesArray(
        "story"
      ).filter((s) => allStoryIdsInColumn.includes(s.id));
      console.log(
        `Checkpoint 4b: Matched ${originalSortedList.length} stories from Data Store.`
      );

      const listWithoutDragged = originalSortedList.filter(
        (s) => s.id !== draggedId
      );
      const targetIndex = listWithoutDragged.findIndex(
        (s) => s.id === targetId
      );

      if (targetIndex === -1) {
        console.error(
          "CRITICAL FAILURE: Target story not found in clean list."
        );
        return;
      }
      console.log(
        `Checkpoint 4c: Target index in clean list is ${targetIndex}.`
      );

      if (targetIndex === 0) {
        newOrderValue = listWithoutDragged[0].order / 2;
      } else {
        const prevItem = listWithoutDragged[targetIndex - 1];
        newOrderValue =
          (prevItem.order + listWithoutDragged[targetIndex].order) / 2;
      }
      console.log(
        `Checkpoint 4d: Calculated newOrderValue = ${newOrderValue}.`
      );

      payload = {
        entityType: "story",
        entityId: draggedId,
        fieldName: "order_index",
        newValue: newOrderValue,
        // We are NOT including newParentId for this vertical move
      };

      // --- Optimistic UI Update ---
      console.log("Checkpoint 5: Performing optimistic UI update.");
      window.StoryMapDataStore.updateEntityOrder(
        "story",
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // --- Final Event Dispatch ---
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
