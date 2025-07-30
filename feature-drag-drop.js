// The definitive, complete, and final feature-drag-drop.js file.

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
      card.draggable = true;
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
      });
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        this.container
          .querySelectorAll(".drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });
    });
    const dropTargets = this.container.querySelectorAll(
      ".feature-card, .empty-feature-drop-zone .add-item-button-static"
    );
    dropTargets.forEach((target) => {
      target.addEventListener("dragover", (e) => {
        if (this.draggedCard && this.draggedCard !== target) {
          e.preventDefault();
          (
            target.closest(".empty-feature-placeholder") || target
          ).classList.add("drag-over");
        }
      });
      target.addEventListener("dragleave", (e) => {
        (
          target.closest(".empty-feature-placeholder") || target
        ).classList.remove("drag-over");
      });
      target.addEventListener("drop", (e) => {
        e.preventDefault();
        (
          target.closest(".empty-feature-placeholder") || target
        ).classList.remove("drag-over");
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
      const isStaticButton = target.classList.contains(
        "add-item-button-static"
      );
      const targetId = isStaticButton ? null : target.dataset.id;
      if (!draggedId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      const allFeatures = window.StoryMapDataStore.getEntitiesArray("feature");
      const draggedFeature = allFeatures.find((f) => f.id === draggedId);

      let targetJourneyId;
      if (isStaticButton) {
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
        // --- THIS IS YOUR PROVEN, WORKING RE-INDEXING LOGIC ---
        const targetFeature = allFeatures.find((f) => f.id === targetId);
        const sortedList = allFeatures.filter(
          (f) => f.journeyId === draggedFeature.journeyId
        );
        const draggedIndex = sortedList.findIndex(
          (item) => item.id === draggedId
        );
        const targetIndex = sortedList.findIndex(
          (item) => item.id === targetId
        );

        if (draggedIndex > targetIndex) {
          if (targetIndex === 0) {
            newOrderValue = targetFeature.order / 2;
          } else {
            const prevItem = sortedList[targetIndex - 1];
            newOrderValue = (prevItem.order + targetFeature.order) / 2;
          }
        } else {
          const nextItem = sortedList[targetIndex + 1];
          if (nextItem) {
            newOrderValue = (targetFeature.order + nextItem.order) / 2;
          } else {
            newOrderValue = targetFeature.order + 10;
          }
        }

        const fullFeatureData = window.StoryMapDataStore.getEntityForUpdate(
          "feature",
          draggedId
        );
        if (fullFeatureData) fullFeatureData.order_index = newOrderValue;
        payload = {
          entityType: "feature",
          entityId: draggedId,
          fieldName: "order_index",
          newValue: newOrderValue,
          oldValue: draggedFeature.order,
          allData: fullFeatureData,
        };
      } else {
        // This is your proven, working re-parenting logic.
        const featuresInNewJourney = allFeatures.filter(
          (f) => f.journeyId === targetJourneyId
        );
        const lastFeature =
          featuresInNewJourney[featuresInNewJourney.length - 1];
        newOrderValue = lastFeature ? lastFeature.order + 10 : 10;

        const fullFeatureData = window.StoryMapDataStore.getEntityForUpdate(
          "feature",
          draggedId
        );
        if (fullFeatureData) fullFeatureData.order_index = newOrderValue;
        payload = {
          entityType: "feature",
          entityId: draggedId,
          fieldName: "order_index_and_journey",
          newValue: newOrderValue,
          oldValue: draggedFeature.order,
          allData: fullFeatureData,
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
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
