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

  handleDrop: function (targetCard) {
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // The calculation logic is correct.
      const sortedFeatures =
        window.StoryMapDataStore.getEntitiesArray("feature");
      const draggedFeature = sortedFeatures.find((f) => f.id === draggedId);
      const targetIndex = sortedFeatures.findIndex((f) => f.id === targetId);
      if (targetIndex === -1 || !draggedFeature) return;

      let newOrderValue;
      const targetFeature = sortedFeatures[targetIndex];
      if (targetIndex === 0) {
        newOrderValue = targetFeature.order / 2;
      } else {
        const prevFeature = sortedFeatures[targetIndex - 1];
        newOrderValue = (prevFeature.order + targetFeature.order) / 2;
      }
      if (newOrderValue === draggedFeature.order) return;

      // OPTIMISTIC UI UPDATE (This is correct)
      window.StoryMapDataStore.updateEntityOrder(
        "feature",
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // --- THE CRITICAL FIX: DISPATCH A DEDICATED REORDER EVENT ---
      console.log(
        `Dispatching reorder for feature ${draggedId}. New Order: ${newOrderValue}`
      );
      document.dispatchEvent(
        new CustomEvent("storymap:reorder", {
          detail: {
            entityType: "feature",
            entityId: draggedId,
            newValue: newOrderValue,
          },
        })
      );
    } catch (err) {
      console.error("Error in Feature handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
