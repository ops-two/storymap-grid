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

    const { input, entityType, entityId, originalText, fieldName, card } =
      this.activeEdit;
    const newValue = input.value.trim();

    // Only save if value changed
    if (newValue !== originalText && newValue !== "") {
      // Show saving state
      input.disabled = true;
      input.style.opacity = "0.6";

      // Update entity in data store and get full data
      let fullEntityData = null;
      if (window.StoryMapDataStore) {
        // Update the specific field in data store
        const changes = {};
        changes[fieldName] = newValue;
        window.StoryMapDataStore.updateEntity(entityType, entityId, changes);

        // Get full entity data for update
        fullEntityData = window.StoryMapDataStore.getEntityForUpdate(
          entityType,
          entityId
        );
      }

      // If no data store, fall back to gathered data
      if (!fullEntityData) {
        fullEntityData = this.gatherEntityData(card, entityType, newValue);
      }

      // Critical log for debugging updates
      console.log(
        `Inline edit: ${entityType} ${entityId} - ${fieldName} changed`
      );

      // Emit update event for Bubble with all data
      document.dispatchEvent(
        new CustomEvent("storymap:update", {
          detail: {
            entityType,
            entityId,
            fieldName,
            newValue,
            oldValue: originalText,
            allData: fullEntityData,
          },
        })
      );

      // After a brief delay, update the UI to show success
      setTimeout(() => {
        if (this.activeEdit && this.activeEdit.entityId === entityId) {
          // Update the text element with new value
          const { textElement } = this.activeEdit;
          textElement.textContent = newValue;
          textElement.style.display = "";
          input.remove();
          this.activeEdit = null;
        }
      }, 500);
    } else {
      // No change or empty, just cancel
      this.cancelEdit();
    }
  },

  cancelEdit() {
    if (!this.activeEdit) return;

    const { textElement, input } = this.activeEdit;

    // Restore original text
    textElement.style.display = "";
    input.remove();

    this.activeEdit = null;
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
