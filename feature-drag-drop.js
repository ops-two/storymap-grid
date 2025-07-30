// The definitive, complete, and final feature-drag-drop.js file.

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    // We must clean up old listeners to prevent bugs from previous versions.
    const oldTargets = this.container.querySelectorAll(
      ".feature-card, .empty-feature-placeholder, .empty-feature-drop-zone"
    );
    oldTargets.forEach((target) => {
      const newTarget = target.cloneNode(true);
      target.parentNode.replaceChild(newTarget, target);
    });
    this.setupFeatureDragging();
  },

  setupFeatureDragging: function () {
    // Draggable items are only the real feature cards.
    const featureCards = this.container.querySelectorAll(".feature-card");
    featureCards.forEach((card) => {
      card.draggable = true;
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
      });
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        // Use a more specific selector for cleanup
        this.container
          .querySelectorAll(".drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });
    });

    // --- THIS IS THE CRITICAL UPGRADE ---
    // Drop targets are now BOTH existing cards AND the new empty drop zones.
    const dropTargets = this.container.querySelectorAll(
      ".feature-card, .empty-feature-drop-zone"
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
      const isDropZone = target.classList.contains("empty-feature-drop-zone");
      const targetId = isDropZone ? null : target.dataset.id;
      if (!draggedId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      const allFeatures = window.StoryMapDataStore.getEntitiesArray("feature");
      const draggedFeature = allFeatures.find((f) => f.id === draggedId);

      let targetJourneyId;
      if (isDropZone) {
        targetJourneyId = target.dataset.journeyId;
      } else {
        const targetFeature = allFeatures.find((f) => f.id === targetId);
        targetJourneyId = targetFeature ? targetFeature.journeyId : null;
      }
      if (!targetJourneyId) {
        this.isProcessing = false;
        return;
      }

      let newOrderValue;
      let payload;

      if (draggedFeature.journeyId === targetJourneyId) {
        const targetFeature = allFeatures.find((f) => f.id === targetId);
        const sortedList = allFeatures.filter(
          (f) => f.journeyId === draggedFeature.journeyId
        );
        const targetIndex = sortedList.findIndex(
          (item) => item.id === targetId
        );
        const prevItem = sortedList[targetIndex - 1];
        newOrderValue =
          ((prevItem ? prevItem.order : 0) + targetFeature.order) / 2;
        payload = {
          entityType: "feature",
          entityId: draggedId,
          fieldName: "order_index",
          newValue: newOrderValue,
          allData: {
            entityId: draggedId,
            order_index: newOrderValue,
            name_text: draggedFeature.name,
          },
        };
      } else {
        const featuresInNewJourney = allFeatures.filter(
          (f) => f.journeyId === targetJourneyId
        );
        const lastFeature =
          featuresInNewJourney[featuresInNewJourney.length - 1];
        newOrderValue = lastFeature ? lastFeature.order + 10 : 10;
        payload = {
          entityType: "feature",
          entityId: draggedId,
          fieldName: "order_index_and_journey",
          newValue: newOrderValue,
          newParentId: targetJourneyId,
          allData: {
            entityId: draggedId,
            order_index: newOrderValue,
            name_text: draggedFeature.name,
          },
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
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
