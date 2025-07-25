// In feature-drag-drop.js

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupFeatureDragging();
  },

  setupFeatureDragging: function () {
    // We are targeting '.feature-card' instead of '.journey-card'
    const featureCards = this.container.querySelectorAll(".feature-card");
    console.log(
      `Found ${featureCards.length} feature cards to make draggable.`
    );

    featureCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      // --- Event listeners for perfect UX, adapted for features ---
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".feature-card.drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });

      card.addEventListener("dragover", (e) => {
        console.log("Dragover event fired on card:", card.dataset.id);
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

  // In feature-drag-drop.js, replace ONLY the handleDrop function

  // In BOTH journey-drag-drop.js AND feature-drag-drop.js,
  // replace ONLY the handleDrop function with this version.

  handleDrop: function (targetCard) {
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // --- THE DEFINITIVE, CORRECTED CALCULATION LOGIC ---
      const entityType = this.draggedCard.dataset.type; // 'journey' or 'feature'

      // 1. Get the original, reliably sorted list from our Data Store.
      const originalSortedList =
        window.StoryMapDataStore.getEntitiesArray(entityType);
      const draggedItem = originalSortedList.find(
        (item) => item.id === draggedId
      );
      if (!draggedItem) return;

      // 2. CRITICAL FIX: Create a "clean" array for calculation by removing the item being dragged.
      const listWithoutDragged = originalSortedList.filter(
        (item) => item.id !== draggedId
      );

      // 3. Find the target's index in this NEW, clean array.
      const targetIndex = listWithoutDragged.findIndex(
        (item) => item.id === targetId
      );
      if (targetIndex === -1) return;

      // 4. Calculate the new order value based on the clean array. The logic is now universal.
      let newOrderValue;
      const targetItem = listWithoutDragged[targetIndex];

      if (targetIndex === 0) {
        // Case 1: Dropping at the very beginning of the list.
        newOrderValue = targetItem.order / 2;
      } else {
        // Case 2: Dropping anywhere else. Place it between the item before the target and the target itself.
        const prevItem = listWithoutDragged[targetIndex - 1];
        newOrderValue = (prevItem.order + targetItem.order) / 2;
      }

      if (newOrderValue === draggedItem.order) return; // No change needed

      // OPTIMISTIC UI UPDATE & BUBBLE DISPATCH (This part is correct)
      window.StoryMapDataStore.updateEntityOrder(
        entityType,
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      const fullData = window.StoryMapDataStore.getEntityForUpdate(
        entityType,
        draggedId
      );
      if (fullData) fullData.order_index = newOrderValue;

      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType: entityType,
            entityId: draggedId,
            fieldName: "order_index",
            newValue: newOrderValue,
            oldValue: draggedItem.order,
            allData: fullData,
          },
        })
      );
    } catch (err) {
      console.error(`Error in ${entityType} handleDrop:`, err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
