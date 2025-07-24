window.StoryMapJourneyDragDrop = {
  draggedCard: null,
  draggedData: null,
  currentDropTarget: null,
  isProcessing: false,
  hasInitialized: false,
  lastDropTime: 0,

  // The init, cleanup, and setupJourneyDragging functions are IDENTICAL to your original file.
  // They are proven to work for capturing the drag events correctly.
  init: function (container) {
    this.container = container;
    this.cleanup();
    this.setupJourneyDragging();
    this.hasInitialized = true;
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

      card.addEventListener("dragstart", (e) => {
        this.draggedCard = card;
        this.draggedData = {
          id: card.dataset.id,
          name: card.querySelector(".card-title")?.textContent || "",
          order: parseFloat(card.dataset.order) || 0,
        };
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", card.innerHTML);
      });

      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        document.querySelectorAll(".drag-over").forEach((el) => {
          el.classList.remove("drag-over");
        });
      });

      card.addEventListener("dragover", (e) => {
        if (this.draggedCard && card !== this.draggedCard) {
          e.preventDefault();
          card.classList.add("drag-over");
        }
      });

      card.addEventListener("dragenter", (e) => {
        if (this.draggedCard && card !== this.draggedCard) {
          this.currentDropTarget = card;
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

  // --- THIS IS THE CORRECTED AND TAILORED handleDrop FUNCTION ---
  // In journey-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    const now = Date.now();
    if (now - this.lastDropTime < 300) return;
    this.lastDropTime = now;
    if (this.isProcessing) return;
    if (!this.draggedCard) {
      console.error("No dragged journey found");
      return;
    }

    try {
      this.isProcessing = true;

      const draggedId = this.draggedData?.id || this.draggedCard?.dataset.id;
      const targetId = targetCard.dataset.id;

      if (!draggedId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      // Use the Data Store as the source of truth for calculations
      const sortedJourneys =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedJourney = sortedJourneys.find((j) => j.id === draggedId);
      const targetIndex = sortedJourneys.findIndex((j) => j.id === targetId);

      if (targetIndex === -1 || !draggedJourney) {
        console.error("Target or dragged journey not found in Data Store");
        this.isProcessing = false;
        return;
      }

      // Your original, proven calculation logic
      let newOrderValue;
      if (targetIndex === 0) {
        newOrderValue = sortedJourneys[0].order - 1;
      } else {
        const targetJourneyOrder = sortedJourneys[targetIndex].order;
        const prevJourneyOrder = sortedJourneys[targetIndex - 1].order;
        newOrderValue = (prevJourneyOrder + targetJourneyOrder) / 2;
      }

      // --- THIS IS THE CRITICAL FIX ---
      // 1. Get the pre-formatted data object that Bubble expects.
      const fullJourneyData = window.StoryMapDataStore.getEntityForUpdate(
        "journey",
        draggedId
      );
      // 2. Manually update the order in this object before sending.
      fullJourneyData.order_index = newOrderValue;

      // 3. Dispatch the event with the rich payload, just like your original code.
      console.log(
        "Publishing journey update (original format):",
        fullJourneyData
      );
      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType: "journey",
            entityId: draggedId,
            fieldName: "order_index_number", // Use original field name
            newValue: newOrderValue,
            oldValue: draggedJourney.order,
            allData: fullJourneyData, // Send the rich object
          },
        })
      );
    } catch (err) {
      console.error("Error during drop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
      this.draggedData = null;
      this.currentDropTarget = null;
    }
  },
};
