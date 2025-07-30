// The definitive feature-drag-drop.js, built from your proven working code.

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupFeatureDragging();
  },

  setupFeatureDragging: function () {
    // Make only the real feature cards draggable.
    const featureCards = this.container.querySelectorAll(".feature-card");
    featureCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
      });
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".drag-over")
          .forEach((c) => c.classList.remove("drag-over"));
      });
    });

    // Listen for drops on ALL potential targets: existing cards AND the new empty drop zones.
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
        if (this.draggedCard && this.draggedCard !== target) {
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
        // --- CASE 1: SIMPLE REORDERING (This is your proven, working logic) ---
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
        // --- CASE 2: RE-PARENTING (including to an empty journey) ---
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

      // --- Your proven Optimistic UI Update and Event Dispatch logic ---
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

      // THIS IS THE CRITICAL FIX: We are now dispatching the correct event.
      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
