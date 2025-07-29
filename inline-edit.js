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
    // --- THE CRITICAL FIX: We are restoring the DBLCLICK event ---
    // It is more robust and avoids conflicts with the icon's single-click.
    this.container.addEventListener("dblclick", (e) => {
      // We ONLY want to trigger an edit if the user double-clicks the TEXT,
      // NOT the icon or the empty space on the card.
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

    // This global listener to save on click-outside is correct and preserved.
    document.addEventListener("click", (e) => {
      if (this.activeEdit && !e.target.closest(".inline-edit-input")) {
        this.saveEdit();
      }
    });
  },

  startEdit(card, entityType, entityId) {
    // --- THE SECOND CRITICAL FIX: The selector is now correct ---
    const textElement = card.querySelector(".card-title-text");
    if (!textElement) return; // Failsafe

    const currentText = textElement.textContent.trim();

    // The rest of this function (creating the input, etc.) is your proven, working code.
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

    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  },

  getFieldName(entityType) {
    // Map entity types to their name fields
    const fieldMap = {
      journey: "name_text",
      feature: "name_text",
      story: "title_text", // Stories use title_text
      persona: "name_text",
      release: "name_text",
    };

    return fieldMap[entityType] || "name_text";
  },

  saveEdit() {
    if (!this.activeEdit) return;

    const { input, entityType, entityId, originalText, card } = this.activeEdit;
    const newValue = input.value.trim();

    if (newValue !== originalText && newValue !== "") {
      input.disabled = true;
      input.style.opacity = "0.6";

      // --- THE CRITICAL FIX IS HERE ---

      // 1. Update the name in our local Data Store for the optimistic UI update.
      // We will add a new, dedicated function for this.
      window.StoryMapDataStore.updateEntityName(entityType, entityId, newValue);

      // 2. Get the full, correctly formatted data payload that our Bubble workflow expects.
      const fullEntityData = window.StoryMapDataStore.getEntityForUpdate(
        entityType,
        entityId
      );
      // Manually update the name in the payload just before sending.
      if (fullEntityData) fullEntityData.name_text = newValue;

      console.log(
        `Inline edit: Dispatching update for ${entityType} ${entityId}`
      );

      // 3. Emit the proven 'storymap:update' event.
      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType,
            entityId,
            fieldName: this.getFieldNameForBubble(entityType), // Use the correct Bubble field name
            newValue,
            oldValue: originalText,
            allData: fullEntityData,
          },
        })
      );

      // The optimistic UI update now happens because Bubble will trigger a re-render.
      // We can simplify this part.
      this.cancelEdit(); // Simply close the input box.
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
    // Format: entityId, name_text, and order_index
    const data = {
      entityId: card.dataset.id,
      name_text: newValue,
    };

    // Get order from data-order attribute (or data-order-index for compatibility)
    const orderValue =
      card.getAttribute("data-order") ||
      card.getAttribute("data-order-index") ||
      "0";
    data.order_index = parseInt(orderValue);

    return data;
  },
};
