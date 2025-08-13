// The definitive inline-edit.js, adapted for the Miro-like UI

window.StoryMapInlineEdit = {
  container: null,
  activeEdit: null,
  isInitialized: false,

  init(container) {
    if (this.isInitialized) return;
    this.container = container;
    this.isInitialized = true;
    this.setupEditHandlers();
  },

  setupEditHandlers() {
    // This is the proven DBLCLICK event. It is correct.
    this.container.addEventListener("dblclick", (e) => {
      // --- CRITICAL CHANGE #1: The Target ---
      // We now check if the user double-clicked the text, not just the card.
      if (!e.target.classList.contains("card-title-text")) {
        return; // Exit if the double-click was not on the text itself.
      }

      const card = e.target.closest(".card");
      if (!card || card.querySelector(".inline-edit-input")) return;

      const entityType = card.dataset.type;
      const entityId = card.dataset.id;
      if (!entityType || !entityId) return;

      this.startEdit(card, entityType, entityId);
    });

    // This global listener is correct and has been preserved.
    document.addEventListener("click", (e) => {
      if (this.activeEdit && !e.target.closest(".inline-edit-input")) {
        this.saveEdit();
      }
    });
  },

  startEdit(card, entityType, entityId) {
    // --- CRITICAL CHANGE #2: The Selector ---
    // We now look for '.card-title-text' instead of '.card-title'.
    const textElement = card.querySelector(".card-title-text");
    if (!textElement) return;

    // --- The rest of this function is YOUR proven, working code. It is preserved perfectly. ---
    const currentText = textElement.textContent.trim();
    
    // Use textarea for story cards to enable multiline editing
    const isStoryCard = entityType === "story";
    const input = document.createElement(isStoryCard ? "textarea" : "input");
    if (!isStoryCard) {
      input.type = "text";
    }
    input.value = currentText;
    input.className = "inline-edit-input";

    this.activeEdit = {
      card,
      textElement,
      input,
      entityType,
      entityId,
      originalText: currentText,
      fieldName: this.getFieldName(entityType),
    };

    textElement.style.display = "none";
    card.classList.add("is-editing"); // Add class to hide icon
    card.appendChild(input);
    
    // Fixed-height textarea for story cards with internal scrolling
    if (isStoryCard) {
      // Calculate the available height within the card (subtract padding and borders)
      const cardHeight = card.offsetHeight;
      const availableHeight = cardHeight - 16; // Account for 8px padding top + 8px bottom
      
      // Set textarea to fixed height with scrolling
      input.style.height = availableHeight + 'px';
      input.style.minHeight = availableHeight + 'px';
      input.style.maxHeight = availableHeight + 'px';
      input.style.overflowY = 'auto';
      input.style.resize = 'none'; // Prevent manual resizing
      input.style.boxSizing = 'border-box';
    }
    
    input.focus();
    input.select();

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        // For textarea (story cards), allow Enter to create new lines
        if (isStoryCard && !e.ctrlKey && !e.metaKey) {
          return; // Allow normal Enter behavior for new lines
        }
        // For input or Ctrl+Enter/Cmd+Enter, save the edit
        e.preventDefault();
        this.saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEdit();
      }
    });
    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  },

  // --- All of your remaining functions are preserved, UNCHANGED. ---
  // They are proven to work and will not be touched.

  getFieldName(entityType) {
    const fieldMap = {
      journey: "name_text",
      feature: "name_text",
      story: "title_text",
      persona: "name_text",
      release: "name_text",
    };
    return fieldMap[entityType] || "name_text";
  },

  saveEdit() {
    if (!this.activeEdit) return;
    const { input, entityType, entityId, originalText, card, fieldName } =
      this.activeEdit;
    const newValue = input.value.trim();
    if (newValue !== originalText && newValue !== "") {
      input.disabled = true;
      input.style.opacity = "0.6";

      window.StoryMapDataStore.updateEntityName(entityType, entityId, newValue);
      const fullEntityData = window.StoryMapDataStore.getEntityForUpdate(
        entityType,
        entityId
      );
      if (fullEntityData) fullEntityData.name_text = newValue;

      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType,
            entityId,
            fieldName: this.getFieldNameForBubble(entityType),
            newValue,
            oldValue: originalText,
            allData: fullEntityData,
          },
        })
      );

      // We will now re-render to ensure the UI is perfectly in sync.
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }
      card.classList.remove("is-editing"); // Remove class to show icon again
      this.activeEdit = null;
    } else {
      this.cancelEdit();
    }
  },

  cancelEdit() {
    if (!this.activeEdit) return;
    const { textElement, input, card } = this.activeEdit;
    textElement.style.display = "";
    input.remove();
    card.classList.remove("is-editing"); // Remove class to show icon again
    this.activeEdit = null;
  },

  getFieldNameForBubble(entityType) {
    return entityType === "story" ? "title_text" : "name_text";
  },

  gatherEntityData(card, entityType, newValue) {
    const data = {
      entityId: card.dataset.id,
      name_text: newValue,
    };
    const orderValue =
      card.getAttribute("data-order") ||
      card.getAttribute("data-order-index") ||
      "0";
    data.order_index = parseInt(orderValue);
    return data;
  },
};
