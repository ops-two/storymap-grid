// The definitive, complete, and final inline-edit.js file.

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
    // The dblclick listener is now the main "controller" for starting edits.
    this.container.addEventListener("dblclick", (e) => {
      if (!e.target.classList.contains("card-title-text")) return;

      const card = e.target.closest(".card");
      if (!card) return;

      // If we are already editing a DIFFERENT card, save the old one first.
      if (this.activeEdit && this.activeEdit.card !== card) {
        this.saveEdit();
      }

      // Only start a new edit if one isn't already active on THIS card.
      if (!card.querySelector(".inline-edit-input")) {
        const entityType = card.dataset.type;
        const entityId = card.dataset.id;
        if (!entityType || !entityId) return;
        this.startEdit(card, entityType, entityId);
      }
    });

    // The global listener is now smarter. It uses 'mousedown' to fire before other clicks.
    document.addEventListener("mousedown", (e) => {
      // Save only if the click is TRULY outside of any interactive card area.
      if (this.activeEdit && !e.target.closest(".card")) {
        this.saveEdit();
      }
    });
  },

  startEdit(card, entityType, entityId) {
    // This is your proven, working startEdit logic. It is preserved.
    const textElement = card.querySelector(".card-title-text");
    if (!textElement) return;
    card.classList.add("is-editing");
    const currentText = textElement.textContent.trim();
    const input = document.createElement("textarea");
    input.value = currentText;
    input.className = "inline-edit-input";
    input.rows = 1;
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
    const adjustHeight = () => {
      input.style.height = "auto";
      input.style.height = input.scrollHeight + "px";
    };
    input.addEventListener("input", adjustHeight);
    setTimeout(adjustHeight, 0);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
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
    // This is your proven getFieldName logic. It is preserved.
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
    const {
      input,
      entityType,
      entityId,
      originalText,
      card,
      textElement,
      fieldName,
    } = this.activeEdit;
    const newValue = input.value.trim();

    if (newValue !== "" && newValue !== originalText) {
      // This is your proven data dispatch logic. It is preserved.
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
    }

    // --- THIS IS THE CRITICAL FIX: SURGICAL DOM CLEANUP ---
    // We manually restore the card to its original state instead of re-rendering everything.
    textElement.textContent = newValue || originalText;
    textElement.style.display = "";
    input.remove();
    card.classList.remove("is-editing");
    this.activeEdit = null;
  },

  cancelEdit() {
    if (!this.activeEdit) return;
    // This is your proven cancel logic, now guaranteed to have the 'card' variable.
    const { textElement, input, card } = this.activeEdit;
    card.classList.remove("is-editing");
    textElement.style.display = "";
    input.remove();
    this.activeEdit = null;
  },

  getFieldNameForBubble(entityType) {
    // This is your proven helper function. It is preserved.
    return entityType === "story" ? "title_text" : "name_text";
  },

  gatherEntityData(card, entityType, newValue) {
    // This is your proven helper function. It is preserved.
    const data = { entityId: card.dataset.id, name_text: newValue };
    const orderValue =
      card.getAttribute("data-order") ||
      card.getAttribute("data-order-index") ||
      "0";
    data.order_index = parseInt(orderValue);
    return data;
  },
};
