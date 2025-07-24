// Journey Drag and Drop Module for Story Map

window.StoryMapJourneyDragDrop = {
  container: null,
  draggedCard: null,
  draggedEntityData: null,
  isProcessing: false,
  isInitialized: false, // Renamed for consistency

  init: function (container) {
    if (this.isInitialized) return;

    this.container = container;
    this.setupDelegatedJourneyDragging();
    this.isInitialized = true;
    console.log("Journey Drag Drop Initializing (Robust Version)...");
  },

  setupDelegatedJourneyDragging: function () {
    // Drag Start: Fires when a drag operation begins on a journey card
    this.container.addEventListener("dragstart", (e) => {
      const card = e.target.closest(".journey-card");
      if (!card) return; // Exit if the drag didn't start on a journey card

      const entityId = card.dataset.id;
      this.draggedEntityData = window.StoryMapDataStore.getEntity(
        "journey",
        entityId
      );

      // If for some reason the data isn't in the store, abort the drag.
      if (!this.draggedEntityData) {
        e.preventDefault();
        return;
      }

      this.draggedCard = card;
      // Use a short timeout to allow the browser to render the drag image before we apply classes.
      setTimeout(() => card.classList.add("dragging"), 0);

      e.dataTransfer.effectAllowed = "move";
    });

    // Drag Over: Fires continuously as a dragged item is over a valid drop target
    this.container.addEventListener("dragover", (e) => {
      const targetCard = e.target.closest(".journey-card");
      if (targetCard && this.draggedCard && targetCard !== this.draggedCard) {
        e.preventDefault();
        targetCard.classList.add("drag-over");
      }
    });
    // --- DRAG LEAVE & DRAG END ---
    // A single handler for cleaning up visuals
    const cleanupDragVisuals = (e) => {
      const card = e.target.closest(".journey-card");
      if (card) card.classList.remove("drag-over", "dragging");

      // Failsafe: ensure all drag-over classes are removed from the container
      this.container
        .querySelectorAll(".drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    };
    this.container.addEventListener("dragleave", cleanupDragVisuals);
    this.container.addEventListener("dragend", cleanupDragVisuals);

    // --- DROP ---
    this.container.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetCard = e.target.closest(".journey-card");
      if (targetCard && this.draggedCard && targetCard !== this.draggedCard) {
        this.handleDrop(targetCard);
      }
    });
  },

  // Drag End: Fires when the drag operation finishes (whether successful or not)

  handleDrop: function (targetCard) {
    if (this.isProcessing) return; // Prevent concurrent drops

    try {
      this.isProcessing = true;

      // --- 1. GET CLEAN DATA FROM THE DATA STORE ---
      const allJourneys = window.StoryMapDataStore.getEntitiesArray("journey");
      const targetEntityData = window.StoryMapDataStore.getEntity(
        "journey",
        targetCard.dataset.id
      );

      if (!this.draggedEntityData || !targetEntityData) {
        console.error(
          "Drag and drop failed: Could not find entity data in store."
        );
        return; // Abort
      }

      // --- 2. CALCULATE NEW ORDER (Midpoint Method) ---
      const targetIndex = allJourneys.findIndex(
        (j) => j.id === targetEntityData.id
      );
      let newOrderValue;

      if (targetIndex === 0) {
        // Dropped at the very beginning
        newOrderValue = allJourneys[0].order / 2;
      } else {
        // Dropped between two items
        const prevJourney = allJourneys[targetIndex - 1];
        newOrderValue = (prevJourney.order + targetEntityData.order) / 2;
      }

      // --- 3. OPTIMISTIC UI UPDATE (For instant feedback) ---
      // Move the dragged card in the DOM to be right before the target card.
      targetCard.parentNode.insertBefore(this.draggedCard, targetCard);
      this.draggedCard.classList.add("card--saving"); // Add saving visual feedback

      // --- 4. DISPATCH UPDATE EVENT TO BUBBLE ---
      const updatePayload = {
        entityType: "journey",
        entityId: this.draggedEntityData.id,
        fieldName: "order", // Use the generic field name
        newValue: newOrderValue,
        oldValue: this.draggedEntityData.order,
        // We no longer need to send 'allData' because Bubble only needs to
        // perform one action: "Make changes to a Thing..." with the new order value.
      };

      console.log("Dispatching reorder update:", updatePayload);
      document.dispatchEvent(
        new CustomEvent("storymap:update", { detail: updatePayload })
      );
    } catch (error) {
      console.error("An error occurred during drop handling:", error);
      // In a real-world scenario, we might want to revert the optimistic UI update here.
      // For now, we log the error.
    } finally {
      // This code runs whether the try block succeeded or failed.
      this.isProcessing = false;
      this.draggedCard = null;
      this.draggedEntityData = null;
    }
  },
};
