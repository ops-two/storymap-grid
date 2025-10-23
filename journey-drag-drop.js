// Enhanced Journey Drag & Drop with better drop zone detection

window.StoryMapJourneyDragDrop = {
  draggedCard: null,
  isProcessing: false,
  dropIndicator: null,

  init: function (container) {
    this.container = container;
    this.cleanup();
    this.createDropIndicator();
    this.setupJourneyDragging();
  },

  cleanup: function () {
    if (!this.container) return;
    const journeyCards = this.container.querySelectorAll(".journey-card");
    journeyCards.forEach((card) => {
      card.draggable = false;
    });
  },

  createDropIndicator: function() {
    if (!this.dropIndicator) {
      this.dropIndicator = document.createElement('div');
      this.dropIndicator.className = 'drop-indicator-journey';
      this.dropIndicator.style.cssText = `
        position: absolute;
        width: 3px;
        height: 50px;
        background: #28a745;
        border-radius: 2px;
        pointer-events: none;
        display: none;
        z-index: 1000;
        box-shadow: 0 0 8px rgba(40,167,69,0.5);
      `;
      document.body.appendChild(this.dropIndicator);
    }
  },

  setupJourneyDragging: function () {
    const journeyCards = this.container.querySelectorAll(".journey-card");
    
    journeyCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;

      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        setTimeout(() => card.classList.add("dragging"), 0);
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        this.hideDropIndicator();
        document
          .querySelectorAll(".journey-card.drag-over-left, .journey-card.drag-over-right")
          .forEach((c) => c.classList.remove("drag-over-left", "drag-over-right"));
        
        // Execute pending drop after drag animation completes
        if (this.pendingDrop) {
          setTimeout(() => {
            this.executeDrop(this.pendingDrop.targetCard, this.pendingDrop.dropSide);
            this.pendingDrop = null;
          }, 50); // Small delay to ensure drag visual is gone
        }
      });

      // Enhanced dragover with position detection
      card.addEventListener("dragover", (e) => {
        if (!this.draggedCard || card === this.draggedCard) return;
        
        e.preventDefault();
        
        // Get mouse position relative to card
        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX;
        const cardCenterX = rect.left + rect.width / 2;
        
        // Determine if hovering left or right side
        const isLeftSide = mouseX < cardCenterX;
        
        // Show visual feedback
        card.classList.remove("drag-over-left", "drag-over-right");
        card.classList.add(isLeftSide ? "drag-over-left" : "drag-over-right");
        
        // Position drop indicator
        this.showDropIndicator(rect, isLeftSide);
        
        // Store drop position
        card.dataset.dropSide = isLeftSide ? "left" : "right";
      });

      card.addEventListener("dragleave", (e) => {
        const rect = card.getBoundingClientRect();
        if (
          e.clientX < rect.left || 
          e.clientX > rect.right ||
          e.clientY < rect.top || 
          e.clientY > rect.bottom
        ) {
          card.classList.remove("drag-over-left", "drag-over-right");
          this.hideDropIndicator();
        }
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over-left", "drag-over-right");
        this.hideDropIndicator();
        
        if (this.draggedCard && card !== this.draggedCard) {
          const dropSide = card.dataset.dropSide || "right";
          // Queue the drop to execute after dragend
          this.pendingDrop = { targetCard: card, dropSide: dropSide };
        }
      });
    });
  },

  showDropIndicator: function(rect, isLeft) {
    const indicator = this.dropIndicator;
    indicator.style.display = 'block';
    indicator.style.left = (isLeft ? rect.left - 6 : rect.right + 3) + 'px';
    indicator.style.top = (rect.top + (rect.height - 50) / 2) + 'px';
  },

  hideDropIndicator: function() {
    if (this.dropIndicator) {
      this.dropIndicator.style.display = 'none';
    }
  },

  executeDrop: function (targetCard, dropSide) {
    if (this.isProcessing || !this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      
      if (!draggedId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      const sortedList = window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedItem = sortedList.find((item) => item.id === draggedId);
      const targetIndex = sortedList.findIndex((item) => item.id === targetId);

      if (targetIndex === -1 || !draggedItem) {
        this.isProcessing = false;
        return;
      }

      let newOrderValue;
      const targetItem = sortedList[targetIndex];

      // Enhanced positioning logic based on drop side
      if (dropSide === "left") {
        // Insert before target
        if (targetIndex === 0) {
          newOrderValue = targetItem.order / 2;
        } else {
          const prevItem = sortedList[targetIndex - 1];
          newOrderValue = (prevItem.order + targetItem.order) / 2;
        }
      } else {
        // Insert after target
        const nextItem = sortedList[targetIndex + 1];
        if (nextItem) {
          newOrderValue = (targetItem.order + nextItem.order) / 2;
        } else {
          newOrderValue = targetItem.order + 10;
        }
      }

      if (newOrderValue === draggedItem.order) {
        this.isProcessing = false;
        this.draggedCard = null;
        return;
      }

      // Update data store (optimistic)
      window.StoryMapDataStore.updateEntityOrder("journey", draggedId, newOrderValue);

      // Try optimistic DOM update first (instant feedback)
      let optimisticUpdateSuccess = false;
      if (window.StoryMapRenderer && window.StoryMapRenderer.updateSingleElement) {
        optimisticUpdateSuccess = window.StoryMapRenderer.updateSingleElement(
          "journey",
          draggedId,
          { order: newOrderValue }
        );
        
        if (optimisticUpdateSuccess) {
          // Mark the optimistic update to prevent unnecessary re-render
          window.StoryMapRenderer.markOptimisticUpdate();
          console.log('⚡ Journey drag applied instantly - no re-render needed');
        }
      }

      // Fallback: If optimistic update failed, use full re-render with scroll preservation
      if (!optimisticUpdateSuccess) {
        console.log('⚠️ Journey optimistic update failed, falling back to full re-render');
        
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
      }

      // Prepare full journey data for Bubble
      const fullJourneyData = window.StoryMapDataStore.getEntityForUpdate(
        "journey",
        draggedId
      );
      if (fullJourneyData) fullJourneyData.order_index = newOrderValue;

      // Dispatch to Bubble (happens in background)
      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType: "journey",
            entityId: draggedId,
            fieldName: "order_index",
            newValue: newOrderValue,
            oldValue: draggedItem.order,
            allData: fullJourneyData,
            // NEW: Add flags for optimistic update
            optimisticUpdate: optimisticUpdateSuccess,
            revertData: { order: draggedItem.order }  // For error recovery
          },
        })
      );
    } catch (err) {
      console.error("Error in Journey handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
