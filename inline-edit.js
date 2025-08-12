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
    
    // Use textarea for story cards to support multiline editing
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
    card.appendChild(input);
    input.focus();
    input.select();

    // Auto-resize textarea for story cards
    if (isStoryCard) {
      const autoResize = () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
      };
      
      // Initial resize
      autoResize();
      
      // Resize on input
      input.addEventListener('input', autoResize);
    }

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
      this.activeEdit = null;
    } else {
      this.cancelEdit();
    }
  },

  cancelEdit() {
    if (!this.activeEdit) return;
    const { textElement, input } = this.activeEdit;
    textElement.style.display = "";
    input.remove();
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
