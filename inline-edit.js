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

    // --- THIS IS THE CRITICAL FIX ---
    // We now listen for 'blur' (losing focus) instead of a global click.
    input.addEventListener("blur", () => this.saveEdit());

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

    // Set activeEdit to null FIRST to prevent re-triggering.
    this.activeEdit = null;

    const newValue = input.value.trim();

    if (newValue !== "" && newValue !== originalText) {
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

    // Surgical DOM cleanup.
    textElement.textContent = newValue || originalText;
    textElement.style.display = "";
    input.remove();
    card.classList.remove("is-editing");
  },

  cancelEdit() {
    if (!this.activeEdit) return;
    const { textElement, input, card } = this.activeEdit;

    // Set activeEdit to null FIRST.
    this.activeEdit = null;

    card.classList.remove("is-editing");
    textElement.style.display = "";
    input.remove();
  },

  getFieldNameForBubble(entityType) {
    return entityType === "story" ? "title_text" : "name_text";
  },

  gatherEntityData(card, entityType, newValue) {
    const data = { entityId: card.dataset.id, name_text: newValue };
    const orderValue =
      card.getAttribute("data-order") ||
      card.getAttribute("data-order-index") ||
      "0";
    data.order_index = parseInt(orderValue);
    return data;
  },
};
