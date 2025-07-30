// The definitive, complete, and final feature-drag-drop.js file.

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    // Clean up any old listeners to prevent bugs from previous flawed versions
    const oldTargets = this.container.querySelectorAll(
      ".feature-card, .empty-feature-placeholder, .empty-feature-drop-zone, .add-item-button-static"
    );
    oldTargets.forEach((target) => {
      const newTarget = target.cloneNode(true);
      target.parentNode.replaceChild(newTarget, target);
    });
    this.setupFeatureDragging();
  },

  setupFeatureDragging: function () {
    // This is your proven logic for making cards draggable. It is preserved.
    const featureCards = this.container.querySelectorAll(".feature-card");
    featureCards.forEach((card) => {
      card.draggable = true;
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        this.container
          .querySelectorAll(".drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });
    });

    // --- THIS IS THE CRITICAL UPGRADE ---
    // Drop targets are now existing cards AND the static add buttons inside empty placeholders.
    const dropTargets = this.container.querySelectorAll(
      ".feature-card, .empty-feature-placeholder .add-item-button-static"
    );
    dropTargets.forEach((target) => {
      target.addEventListener("dragover", (e) => {
        if (this.draggedCard && this.draggedCard !== target) {
          e.preventDefault();
          const dropZone =
            target.closest(".empty-feature-placeholder") || target;
          dropZone.classList.add("drag-over");
        }
      });
      target.addEventListener("dragleave", (e) => {
        const dropZone = target.closest(".empty-feature-placeholder") || target;
        dropZone.classList.remove("drag-over");
      });
      target.addEventListener("drop", (e) => {
        e.preventDefault();
        const dropZone = target.closest(".empty-feature-placeholder") || target;
        dropZone.classList.remove("drag-over");
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
        const targetFeature = allFeatures.find((f) => f.id === targetId);
        const sortedList = allFeatures.filter(
          (f) => f.journeyId === draggedFeature.journeyId
        );
        const targetIndex = sortedList.findIndex(
          (item) => item.id === targetId
        );
        if (targetIndex === -1) {
          this.isProcessing = false;
          return;
        }

        const prevItem = targetIndex > 0 ? sortedList[targetIndex - 1] : null;
        newOrderValue = prevItem
          ? (prevItem.order + targetFeature.order) / 2
          : targetFeature.order / 2;

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
