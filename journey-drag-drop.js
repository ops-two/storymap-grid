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

  handleDrop: function (targetCard) {
    // All of your original debouncing and isProcessing checks remain the same.
    const now = Date.now();
    if (now - this.lastTime < 300) return;
    this.lastTime = now;
    if (this.isProcessing) return;
    if (!this.draggedCard) return;

    try {
      this.isProcessing = true;

      const draggedId = this.draggedCard.dataset.id;
      const targetId = targetCard.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      // Use the Data Store as the single source of truth.
      const sortedJourneys =
        window.StoryMapDataStore.getEntitiesArray("journey");
      const draggedJourney = sortedJourneys.find((j) => j.id === draggedId);
      const targetIndex = sortedJourneys.findIndex((j) => j.id === targetId);

      if (targetIndex === -1 || !draggedJourney) {
        console.error(
          "Could not find dragged or target journey in Data Store."
        );
        return;
      }

      // --- NEW, MORE ROBUST CALCULATION LOGIC ---
      let newOrderValue;
      const targetJourney = sortedJourneys[targetIndex];

      // Determine if we are dragging the card to the left (a lower index) or right (a higher index)
      const draggedIndex = sortedJourneys.findIndex((j) => j.id === draggedId);

      if (draggedIndex > targetIndex) {
        // Dragging LEFT (e.g., from pos 4 to pos 2)
        if (targetIndex === 0) {
          // Dropping at the very beginning of the list
          newOrderValue = targetJourney.order / 2;
        } else {
          // Dropping between two items
          const prevJourney = sortedJourneys[targetIndex - 1];
          newOrderValue = (prevJourney.order + targetJourney.order) / 2;
        }
      } else {
        // Dragging RIGHT (e.g., from pos 2 to pos 4)
        const nextJourney = sortedJourneys[targetIndex + 1];
        if (nextJourney) {
          // Dropping between two items
          newOrderValue = (targetJourney.order + nextJourney.order) / 2;
        } else {
          // Dropping at the very end of the list
          newOrderValue = targetJourney.order + 10; // Add 10 to give space
        }
      }

      // Failsafe: if calculation results in the same order, add a tiny fraction to force a change.
      if (newOrderValue === draggedJourney.order) {
        newOrderValue += 0.001;
      }

      // Get the pre-formatted data object that Bubble expects.
      const fullJourneyData = window.StoryMapDataStore.getEntityForUpdate(
        "journey",
        draggedId
      );
      fullJourneyData.order_index = newOrderValue;

      // Dispatch the rich payload, just like your original code.
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
      this.isProcessing = false;
      this.draggedCard = null;
      this.draggedData = null;
    }
  },
};
