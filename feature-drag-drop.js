// The definitive feature-drag-drop.js with the race condition fixed.

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupFeatureDragging();
  },

  setupFeatureDragging: function () {
    const featureCards = this.container.querySelectorAll(".feature-card");
    featureCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      // Drag Start: Set the dragged card and a visual class.
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
      });

      // CRITICAL FIX: The dragend listener must ONLY handle visual cleanup.
      // It MUST NOT change the this.draggedCard state.
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".feature-card.drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });

      // Drag Over: Provides the dotted line visual feedback.
      card.addEventListener("dragover", (e) => {
        if (this.draggedCard && card !== this.draggedCard) {
          e.preventDefault();
          card.classList.add("drag-over");
        }
      });

      // Drag Leave: Removes the dotted line.
      card.addEventListener("dragleave", (e) => {
        card.classList.remove("drag-over");
      });

      // Drop: Calls the handleDrop function to perform the logic.
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

      // 1. Get the full feature objects from the Data Store to check their parents.
      const features = window.StoryMapDataStore.getEntitiesArray("feature");
      const draggedFeature = features.find((f) => f.id === draggedId);
      const targetFeature = features.find((f) => f.id === targetId);
      if (!draggedFeature || !targetFeature) return;

      const draggedJourneyId = draggedFeature.journeyId;
      const targetJourneyId = targetFeature.journeyId;

      let newOrderValue;
      let payload;

      if (draggedJourneyId === targetJourneyId) {
        // --- CASE 1: SIMPLE REORDERING (within the same journey) ---
        // This is your existing, proven direction-aware logic. It is preserved perfectly.
        const sortedList = features.filter(
          (f) => f.journeyId === draggedJourneyId
        );
        const draggedIndex = sortedList.findIndex(
          (item) => item.id === draggedId
        );
        const targetIndex = sortedList.findIndex(
          (item) => item.id === targetId
        );

        if (draggedIndex > targetIndex) {
          if (targetIndex === 0) {
            newOrderValue = sortedList[targetIndex].order / 2;
          } else {
            const prevItem = sortedList[targetIndex - 1];
            newOrderValue =
              (prevItem.order + sortedList[targetIndex].order) / 2;
          }
        } else {
          const nextItem = sortedList[targetIndex + 1];
          if (nextItem) {
            newOrderValue =
              (sortedList[targetIndex].order + nextItem.order) / 2;
          } else {
            newOrderValue = sortedList[targetIndex].order + 10;
          }
        }
        if (newOrderValue === draggedFeature.order) return;

        payload = {
          entityType: "feature",
          entityId: draggedId,
          newValue: newOrderValue,
        };
      } else {
        // --- CASE 2: RE-PARENTING (to a new journey) ---
        const featuresInNewJourney = features.filter(
          (f) => f.journeyId === targetJourneyId
        );
        const lastFeature =
          featuresInNewJourney[featuresInNewJourney.length - 1];
        newOrderValue = lastFeature ? lastFeature.order + 10 : 10; // Place at the end of the new journey

        payload = {
          entityType: "feature",
          entityId: draggedId,
          newValue: newOrderValue,
          newParentId: targetJourneyId,
        };
      }

      window.StoryMapDataStore.updateEntityOrder(
        "feature",
        draggedId,
        newOrderValue
      );
      if (payload.newParentId) {
        const feature = window.StoryMapDataStore.getEntity(
          "feature",
          draggedId
        );
        if (feature) feature.journeyId = payload.newParentId;
      }
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      document.dispatchEvent(
        new CustomEvent("storymap:reorder", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
