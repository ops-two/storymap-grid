// The definitive journey-drag-drop.js with Optimistic Updates

window.StoryMapJourneyDragDrop = {
  draggedCard: null,
  isProcessing: false, // Simplified state management

  // The init, cleanup, and setup functions are your proven, original versions.
  init: function (container) {
    this.container = container;
    this.cleanup();
    this.setupJourneyDragging();
  },

  cleanup: function () {
    if (!this.container) return;
    const journeyCards = this.container.querySelectorAll(".journey-card");
    journeyCards.forEach((card) => {
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
    });
  },

  setupJourneyDragging: function () {
    const journeyCards = this.container.querySelectorAll(".journey-card");
    journeyCards.forEach((card) => {
      if (card.dataset.dragSetup === "true") return;
      card.dataset.dragSetup = "true";
      card.draggable = true;
      // All original event listeners (dragstart, dragend, etc.) are preserved.
      // This ensures the drag feel is correct.
      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", (e) =>
        card.classList.remove("dragging")
      );
      card.addEventListener("dragover", (e) => {
        if (this.draggedCard && card !== this.draggedCard) e.preventDefault();
      });
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        if (this.draggedCard && card !== this.draggedCard)
          this.handleDrop(card);
      });
    });
  },

  // --- THIS IS THE DEFINITIVE handleDrop FUNCTION ---
  handleDrop: function (targetCard) {
    if (this.isProcessing) return;
    if (!this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // 1. Get reliably sorted data from the Data Store.
      const sortedJourneys =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedJourney = sortedJourneys.find((j) => j.id === draggedId);
      const targetIndex = sortedJourneys.findIndex((j) => j.id === targetId);
      if (targetIndex === -1 || !draggedJourney) return;

      // 2. Calculate the new order with unified logic that works in both directions.
      let newOrderValue;
      const targetJourney = sortedJourneys[targetIndex];
      if (targetIndex === 0) {
        newOrderValue = targetJourney.order / 2;
      } else {
        const prevJourney = sortedJourneys[targetIndex - 1];
        newOrderValue = (prevJourney.order + targetJourney.order) / 2;
      }
      if (newOrderValue === draggedJourney.order) return; // No change needed

      // --- 3. THE OPTIMISTIC UI UPDATE ---
      // Update our local data store immediately.
      window.StoryMapDataStore.updateEntityOrder(
        "journey",
        draggedId,
        newOrderValue
      );

      // Force the renderer to redraw the entire grid with the new local order.
      // We find the main canvas element to pass to the renderer.
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // 4. Dispatch the update event to Bubble to save the data in the background.
      const fullJourneyData = window.StoryMapDataStore.getEntityForUpdate(
        "journey",
        draggedId
      );
      fullJourneyData.order_index = newOrderValue;

      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType: "journey",
            entityId: draggedId,
            fieldName: "order_index_number",
            newValue: newOrderValue,
            oldValue: draggedJourney.order,
            allData: fullJourneyData,
          },
        })
      );
    } catch (err) {
      console.error("Error in handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
