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
    // This is your proven DBLCLICK event logic. It is preserved.
    this.container.addEventListener("dblclick", (e) => {
      if (!e.target.classList.contains("card-title-text")) return;

      // If we are already editing something, save it first before starting a new edit.
      if (this.activeEdit) {
        this.saveEdit();
      }

      const card = e.target.closest(".card");
      if (!card || card.querySelector(".inline-edit-input")) return;
      const entityType = card.dataset.type;
      const entityId = card.dataset.id;
      if (!entityType || !entityId) return;
      this.startEdit(card, entityType, entityId);
    });

    // --- THIS IS THE CRITICAL FIX ---
    // We change from "click" to "mousedown" to fire before the dblclick.
    // We also add a check to ensure the click wasn't on another card's text.
    document.addEventListener("mousedown", (e) => {
      if (
        this.activeEdit &&
        !e.target.closest(".inline-edit-input") &&
        !e.target.classList.contains("card-title-text")
      ) {
        this.saveEdit();
      }
    });
  },

  startEdit(card, entityType, entityId) {
    // --- CRITICAL CHANGE #2: The Selector ---
    // We now look for '.card-title-text' instead of '.card-title'.
    const textElement = card.querySelector(".card-title-text");
    if (!textElement) return;

    card.classList.add("is-editing"); // Add the state class

    // --- The rest of this function is YOUR proven, working code. It is preserved perfectly. ---
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
      input.style.height = "auto"; // Reset height
      input.style.height = input.scrollHeight + "px"; // Set to content height
    };
    input.addEventListener("input", adjustHeight);
    setTimeout(adjustHeight, 0); // Adjust height on initial render
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
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

      // The full re-render is the final step. It handles all UI cleanup.
      const mainCanvas = $(this.container).closest('[id^="bubble-r-box"]');
      if (window.StoryMapRenderer && mainCanvas.length) {
        window.StoryMapRenderer.render(mainCanvas);
      }

      // CRITICAL FIX: The line below has been REMOVED. The re-render makes it unnecessary.
      // card.classList.remove("is-editing");

      this.activeEdit = null;
    } else {
      this.cancelEdit();
    }
  },

  cancelEdit() {
    if (!this.activeEdit) return;
    const { textElement, input, card } = this.activeEdit;
    card.classList.remove("is-editing");

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
