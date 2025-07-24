window.StoryMapJourneyDragDrop = {
  // We will no longer initialize in update.txt. Instead, we'll initialize from the renderer
  // AFTER the elements have been created, just like the original code.

  init: function (container) {
    // Find all journey cards within the container and attach listeners directly.
    const journeyCards = container.querySelectorAll(".journey-card");

    journeyCards.forEach((card) => {
      card.draggable = true;

      card.addEventListener("dragstart", (e) => this.handleDragStart(e, card));
      card.addEventListener("dragend", (e) => this.handleDragEnd(e, card));
      card.addEventListener("dragover", (e) => this.handleDragOver(e, card));
      card.addEventListener("dragleave", (e) => this.handleDragLeave(e, card));
      card.addEventListener("drop", (e) => this.handleDrop(e, card));
    });
  },

  handleDragStart: function (e, card) {
    this.draggedCard = card;
    // Use a short timeout to allow the browser's drag image to be created.
    setTimeout(() => card.classList.add("dragging"), 0);
    e.dataTransfer.effectAllowed = "move";
  },

  handleDragEnd: function (e, card) {
    card.classList.remove("dragging");
    // Failsafe cleanup
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  },

  handleDragOver: function (e, card) {
    if (this.draggedCard && card !== this.draggedCard) {
      e.preventDefault(); // This is essential to allow a drop
      card.classList.add("drag-over");
    }
  },

  handleDragLeave: function (e, card) {
    card.classList.remove("drag-over");
  },

  handleDrop: function (e, card) {
    e.preventDefault();
    card.classList.remove("drag-over");

    if (!this.draggedCard || this.draggedCard === card) return;

    const allJourneys = window.StoryMapDataStore.getEntitiesArray("journey");
    const draggedId = this.draggedCard.dataset.id;
    const targetId = card.dataset.id;

    const draggedJourney = allJourneys.find((j) => j.id === draggedId);
    const targetJourney = allJourneys.find((j) => j.id === targetId);
    if (!draggedJourney || !targetJourney) return;

    const targetIndex = allJourneys.findIndex((j) => j.id === targetId);
    let newOrderValue;

    if (targetIndex === 0) {
      newOrderValue = targetJourney.order / 2;
    } else if (draggedJourney.order > targetJourney.order) {
      // Dragging left
      const prevJourney = allJourneys[targetIndex - 1];
      newOrderValue = (prevJourney.order + targetJourney.order) / 2;
    } else {
      // Dragging right
      const nextJourney = allJourneys[targetIndex + 1];
      if (nextJourney) {
        newOrderValue = (targetJourney.order + nextJourney.order) / 2;
      } else {
        newOrderValue = targetJourney.order + 1;
      }
    }

    document.dispatchEvent(
      new CustomEvent("storymap:update", {
        detail: {
          entityType: "journey",
          entityId: draggedId,
          fieldName: "order",
          newValue: newOrderValue,
        },
      })
    );
  },
};
