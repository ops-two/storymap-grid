// Enhanced Feature Drag & Drop with better drop zone detection

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,
  dropIndicator: null,

  init: function (container) {
    this.container = container;
    this.createDropIndicator();
    this.setupFeatureDragging();
  },

  createDropIndicator: function() {
    // Create a visual indicator for drop position
    if (!this.dropIndicator) {
      this.dropIndicator = document.createElement('div');
      this.dropIndicator.className = 'drop-indicator';
      this.dropIndicator.style.cssText = `
        position: absolute;
        width: 3px;
        height: 60px;
        background: #007bff;
        border-radius: 2px;
        pointer-events: none;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 8px rgba(0,123,255,0.5);
      `;
      document.body.appendChild(this.dropIndicator);
    }
  },

  setupFeatureDragging: function () {
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
        this.hideDropIndicator();
        this.container
          .querySelectorAll(".drag-over-left, .drag-over-right, .drag-over-move")
          .forEach((c) => c.classList.remove("drag-over-left", "drag-over-right", "drag-over-move"));
      });

      // Enhanced dragover with position detection
      card.addEventListener("dragover", (e) => {
        if (!this.draggedCard || this.draggedCard === card) return;
        
        e.preventDefault();
        
        // Check if same journey or different
        const draggedJourneyId = this.draggedCard.closest('[data-journey-id]')?.dataset.journeyId;
        const targetJourneyId = card.closest('[data-journey-id]')?.dataset.journeyId;
        const isSameJourney = draggedJourneyId === targetJourneyId;
        
        // Clear previous feedback
        card.classList.remove("drag-over-left", "drag-over-right", "drag-over-move");
        
        if (isSameJourney) {
          // Same journey - show left/right positioning
          const rect = card.getBoundingClientRect();
          const mouseX = e.clientX;
          const cardCenterX = rect.left + rect.width / 2;
          const isLeftSide = mouseX < cardCenterX;
          
          card.classList.add(isLeftSide ? "drag-over-left" : "drag-over-right");
          this.showDropIndicator(rect, isLeftSide);
          card.dataset.dropSide = isLeftSide ? "left" : "right";
        } else {
          // Different journey - just show general hover, will move to end of target journey
          card.classList.add("drag-over-move");
          this.hideDropIndicator();
          card.dataset.dropSide = "move-journey";
        }
      });

      card.addEventListener("dragleave", (e) => {
        // Only clear if actually leaving the card
        const rect = card.getBoundingClientRect();
        if (
          e.clientX < rect.left || 
          e.clientX > rect.right ||
          e.clientY < rect.top || 
          e.clientY > rect.bottom
        ) {
          card.classList.remove("drag-over-left", "drag-over-right", "drag-over-move");
          this.hideDropIndicator();
        }
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over-left", "drag-over-right", "drag-over-move");
        this.hideDropIndicator();
        
        if (this.draggedCard) {
          const dropSide = card.dataset.dropSide || "right";
          this.handleDrop(card, dropSide);
        }
      });
    });

    // Handle empty zone drops
    const emptyDropZones = this.container.querySelectorAll(".empty-feature-drop-zone .add-item-button-static");
    emptyDropZones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        if (this.draggedCard) {
          e.preventDefault();
          zone.closest(".empty-feature-placeholder").classList.add("drag-over");
        }
      });

      zone.addEventListener("dragleave", (e) => {
        zone.closest(".empty-feature-placeholder").classList.remove("drag-over");
      });

      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.closest(".empty-feature-placeholder").classList.remove("drag-over");
        if (this.draggedCard) {
          this.handleDrop(zone, null);
        }
      });
    });
  },

  showDropIndicator: function(rect, isLeft) {
    const indicator = this.dropIndicator;
    indicator.style.display = 'block';
    indicator.style.left = (isLeft ? rect.left - 6 : rect.right + 3) + 'px';
    indicator.style.top = (rect.top + (rect.height - 60) / 2) + 'px';
  },

  hideDropIndicator: function() {
    if (this.dropIndicator) {
      this.dropIndicator.style.display = 'none';
    }
  },

  handleDrop: function (target, dropSide) {
    if (this.isProcessing || !this.draggedCard) return;
    
    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const isStaticButton = target.classList.contains("add-item-button-static");
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

      if (draggedFeature.journeyId === targetJourneyId && dropSide !== "move-journey") {
        // Same journey - reorder with position awareness
        const targetFeature = allFeatures.find((f) => f.id === targetId);
        const sortedList = allFeatures.filter(
          (f) => f.journeyId === draggedFeature.journeyId
        );
        const draggedIndex = sortedList.findIndex((item) => item.id === draggedId);
        const targetIndex = sortedList.findIndex((item) => item.id === targetId);

        // Enhanced positioning logic
        if (dropSide === "left") {
          // Insert before target
          if (targetIndex === 0) {
            newOrderValue = targetFeature.order / 2;
          } else {
            const prevItem = sortedList[targetIndex - 1];
            newOrderValue = (prevItem.order + targetFeature.order) / 2;
          }
        } else {
          // Insert after target
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
        // Different journey - move to end
        const featuresInNewJourney = allFeatures.filter(
          (f) => f.journeyId === targetJourneyId
        );
        const lastFeature = featuresInNewJourney[featuresInNewJourney.length - 1];
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

      // Update data store
      window.StoryMapDataStore.updateEntityOrder("feature", draggedId, newOrderValue);
      if (payload.newParentId) {
        const feature = window.StoryMapDataStore.getEntity("feature", draggedId);
        if (feature) feature.journeyId = payload.newParentId;
      }

      // Re-render with scroll management
      if (window.StoryMapScrollManager) {
        window.StoryMapScrollManager.beforeRefresh(draggedId);
      }

      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);

        if (window.StoryMapScrollManager) {
          window.StoryMapScrollManager.afterRefresh();
        }
      }

      // Dispatch to Bubble
      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: payload })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
