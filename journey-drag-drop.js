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
  // In journey-drag-drop.js, replace ONLY the handleDrop function

  // In journey-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (targetCard) {
    // All of your original debouncing and isProcessing checks remain the same.
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

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;

      if (!draggedId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      // --- THE UNIFIED & CORRECTED CALCULATION LOGIC ---

      // 1. Get the reliably sorted list of journeys from our Data Store.
      const sortedJourneys =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedJourney = sortedJourneys.find((j) => j.id === draggedId);
      const targetIndex = sortedJourneys.findIndex((j) => j.id === targetId);

      if (targetIndex === -1 || !draggedJourney) {
        console.error("Target or dragged journey not found in Data Store.");
        this.isProcessing = false;
        return;
      }

      // 2. Calculate the new order value. This logic is now the same for all drag directions.
      let newOrderValue;
      const targetJourney = sortedJourneys[targetIndex];

      if (targetIndex === 0) {
        // Case 1: Dropping at the very beginning of the list.
        // Place it before the first item.
        newOrderValue = targetJourney.order / 2;
      } else {
        // Case 2: Dropping anywhere else.
        // Place it between the item before the target and the target itself.
        const prevJourney = sortedJourneys[targetIndex - 1];
        newOrderValue = (prevJourney.order + targetJourney.order) / 2;
      }

      // 3. Failsafe: if for any reason the order is the same, do nothing.
      // This prevents sending unnecessary updates to Bubble.
      if (newOrderValue === draggedJourney.order) {
        this.isProcessing = false;
        return;
      }

      // 4. Get the pre-formatted data object that your Bubble workflow expects.
      const fullJourneyData = window.StoryMapDataStore.getEntityForUpdate(
        "journey",
        draggedId
      );
      fullJourneyData.order_index = newOrderValue;

      // 5. Dispatch the rich payload, just like your original working code.
      console.log(
        `Publishing update for ${draggedId}. New Order: ${newOrderValue}`
      );
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
      // Your original finally block is preserved.
      this.isProcessing = false;
      this.draggedCard = null;
      this.draggedData = null;
      this.currentDropTarget = null;
    }
  },
};
