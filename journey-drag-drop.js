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
  // In journey-drag-drop.js, replace ONLY the handleDrop function

  // In journey-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    if (
      this.isProcessing ||
      !this.draggedCard ||
      this.draggedCard === targetCard
    ) {
      this.isProcessing = false;
      return;
    }
    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;

      // Use the Data Store for reliable calculations
      const sortedJourneys =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedJourney = sortedJourneys.find((j) => j.id === draggedId);
      const targetIndex = sortedJourneys.findIndex((j) => j.id === targetId);
      if (targetIndex === -1 || !draggedJourney) return;

      // The unified, correct calculation logic
      let newOrderValue;
      const targetJourney = sortedJourneys[targetIndex];
      if (targetIndex === 0) {
        newOrderValue = targetJourney.order / 2;
      } else {
        const prevJourney = sortedJourneys[targetIndex - 1];
        newOrderValue = (prevJourney.order + targetJourney.order) / 2;
      }
      if (newOrderValue === draggedJourney.order) return;

      // OPTIMISTIC UI UPDATE
      window.StoryMapDataStore.updateEntityOrder(
        "journey",
        draggedId,
        newOrderValue
      );
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // --- THE CRITICAL FIX: RECONSTRUCT THE ORIGINAL PAYLOAD ---
      // Your workflow is not parsing JSON, it's parsing a specific string.
      // We will build that exact string format.
      const originalPayload = {
        entityType: "journey",
        entityId: draggedId,
        changes: {
          order_index_number: newOrderValue,
        },
      };

      // This simulates the 'allData' object from your original code.
      const allData = {
        entityId: draggedId,
        name_text: draggedJourney.name,
        order_index: newOrderValue,
      };

      // --- DISPATCH THE ORIGINAL, RICH PAYLOAD ---
      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType: "journey",
            entityId: draggedId,
            fieldName: "order_index_number", // Use original field name
            newValue: newOrderValue,
            oldValue: draggedJourney.order,
            allData: allData,
          },
        })
      );
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
    }
  },
};
