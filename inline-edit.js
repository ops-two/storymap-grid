// The definitive inline-edit.js, built from your proven working code.

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
    // This is your proven, working dblclick logic. It is preserved.
    this.container.addEventListener("dblclick", (e) => {
      if (!e.target.classList.contains("card-title-text")) {
        return;
      }
      const card = e.target.closest(".card");
      if (!card || card.querySelector(".inline-edit-input")) return;
      const entityType = card.dataset.type;
      const entityId = card.dataset.id;
      if (!entityType || !entityId) return;
      this.startEdit(card, entityType, entityId);
    });

    // This is your proven, working global click listener. It is preserved.
    document.addEventListener("click", (e) => {
      if (this.activeEdit && !e.target.closest(".inline-edit-input")) {
        this.saveEdit();
      }
    });
  },

  startEdit(card, entityType, entityId) {
    const textElement = card.querySelector(".card-title-text");
    if (!textElement) return;

    // --- THIS IS THE CRITICAL FIX ---
    card.classList.add("is-editing"); // Add the state class

    // The rest of your proven, working logic is preserved.
    const currentText = textElement.textContent.trim();
    const input = document.createElement("input");
    input.type = "text";
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
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEdit();
      }
    });
    input.addEventListener("click", (e) => e.stopPropagation());
  },

  getFieldName(entityType) {
    // This is your proven, working function. It is preserved.
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

    // --- THIS IS THE CRITICAL FIX ---
    card.classList.remove("is-editing"); // Remove the state class

    // The rest of your proven, working logic is preserved.
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
    const { textElement, input, card } = this.activeEdit; // Get card from activeEdit

    // --- THIS IS THE CRITICAL FIX ---
    card.classList.remove("is-editing"); // Remove the state class

    // The rest of your proven, working logic is preserved.
    textElement.style.display = "";
    input.remove();
    this.activeEdit = null;
  },

  getFieldNameForBubble(entityType) {
    // This is your proven, working function. It is preserved.
    return entityType === "story" ? "title_text" : "name_text";
  },

  gatherEntityData(card, entityType, newValue) {
    // This is your proven, working function. It is preserved.
    const data = { entityId: card.dataset.id, name_text: newValue };
    const orderValue =
      card.getAttribute("data-order") ||
      card.getAttribute("data-order-index") ||
      "0";
    data.order_index = parseInt(orderValue);
    return data;
  },
};
