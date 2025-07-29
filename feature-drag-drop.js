// The definitive feature-drag-drop.js, built from your proven working code.

window.StoryMapFeatureDragDrop = {
  draggedCard: null,
  isProcessing: false,

  init: function (container) {
    this.container = container;
    this.setupFeatureDragging();
  },

  setupFeatureDragging: function () {
    // Make only the real feature cards draggable. This is your proven logic.
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

    // --- THE CRITICAL UPGRADE ---
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

  // In feature-drag-drop.js, replace ONLY the handleDrop function

  handleDrop: function (target) {
    console.log(
      "%c--- FEATURE DROP INITIATED ---",
      "color: #ff00ff; font-weight: bold;"
    );
    if (this.isProcessing || !this.draggedCard) {
      console.error("Drop cancelled: isProcessing or no draggedCard.");
      return;
    }

    try {
      this.isProcessing = true;
      const draggedId = this.draggedCard.dataset.id;
      const isDropZone = target.classList.contains("empty-feature-drop-zone");
      const targetId = isDropZone ? null : target.dataset.id;
      console.log(
        `STEP 1: IDENTIFY CARDS. Dragged ID: ${draggedId}, Target ID: ${
          targetId || "EMPTY DROP ZONE"
        }`
      );
      if (!draggedId || draggedId === targetId) {
        this.isProcessing = false;
        return;
      }

      // --- THE CRITICAL DIAGNOSTIC ---
      const allFeatures = window.StoryMapDataStore.getEntitiesArray("feature");
      const draggedFeature = allFeatures.find((f) => f.id === draggedId);

      // We get the dragged feature's parent from the RELIABLE Data Store.
      const draggedJourneyId = draggedFeature.journeyId;

      // We get the target's parent from the HTML ATTRIBUTE, which is the likely point of failure.
      const targetJourneyId = target.dataset.journeyId;

      console.log(
        `STEP 2: IDENTIFY PARENTS. Dragged Journey ID (from Data Store): "${draggedJourneyId}", Target Journey ID (from HTML attribute): "${targetJourneyId}"`
      );

      // This is the check that is likely failing.
      if (draggedJourneyId === targetJourneyId) {
        console.log(
          "%cVERDICT: SIMPLE REORDER. (This block is likely not running)",
          "color: green;"
        );
      } else {
        console.error(
          "%cVERDICT: RE-PARENTING. (The code incorrectly entered this block because the Target Journey ID was wrong)",
          "color: red;"
        );
      }

      // For safety, we will stop the code here. We just want the logs.
      console.log("--- DEBUGGING COMPLETE. NO EVENT FIRED. ---");
    } catch (err) {
      console.error("CRITICAL ERROR in handleDrop:", err);
    } finally {
      this.isProcessing = false;
      this.draggedCard = null;
      // Re-render to put the card back for the next test.
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }
    }
  },
};
