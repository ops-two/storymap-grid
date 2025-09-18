// Scroll Position Manager for Bubble.io Story Map
// Handles scroll position retention during DOM refresh/re-renders

window.StoryMapScrollManager = {
  savedScrollPosition: null,
  editedElementId: null,
  scrollContainer: null,
  
  /**
   * Initialize the scroll manager with the appropriate container
   */
  init(container) {
    // Find the scrollable container - could be the story-map-container or a parent Bubble container
    this.scrollContainer = this.findScrollContainer(container);
    console.log('ScrollManager initialized with container:', this.scrollContainer);
  },

  /**
   * Find the actual scrollable container in Bubble.io environment
   */
  findScrollContainer(startElement) {
    let element = startElement;
    
    // First try to find .story-map-container
    const storyMapContainer = element.querySelector('.story-map-container');
    if (storyMapContainer) {
      return storyMapContainer;
    }
    
    // If not found, traverse up to find a scrollable parent
    while (element && element !== document.body) {
      const computedStyle = window.getComputedStyle(element);
      const overflowY = computedStyle.overflowY;
      
      // Check if this element is scrollable
      if (overflowY === 'auto' || overflowY === 'scroll' || element.scrollHeight > element.clientHeight) {
        return element;
      }
      
      element = element.parentElement;
    }
    
    // Fallback to window if no scrollable container found
    return window;
  },

  /**
   * Save current scroll position before DOM refresh
   */
  saveScrollPosition() {
    if (!this.scrollContainer) return;
    
    if (this.scrollContainer === window) {
      this.savedScrollPosition = {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset
      };
    } else {
      this.savedScrollPosition = {
        x: this.scrollContainer.scrollLeft,
        y: this.scrollContainer.scrollTop
      };
    }
    
    console.log('Scroll position saved:', this.savedScrollPosition);
  },

  /**
   * Save the ID of the element being edited
   */
  saveEditedElement(elementId) {
    this.editedElementId = elementId;
    console.log('Edited element saved:', elementId);
  },

  /**
   * Restore scroll position after DOM refresh
   * Uses hybrid approach: try to scroll to edited element first, then fallback to saved position
   */
  restoreScrollPosition() {
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.performScrollRestore();
    }, 50);
  },

  /**
   * Perform the actual scroll restoration
   */
  performScrollRestore() {
    let scrollRestored = false;

    // Strategy 1: Try to scroll to the edited element (best UX)
    if (this.editedElementId) {
      scrollRestored = this.scrollToEditedElement();
    }

    // Strategy 2: Fallback to saved scroll position
    if (!scrollRestored && this.savedScrollPosition) {
      this.scrollToSavedPosition();
    }

    // Clear saved data after restoration
    this.clearSavedData();
  },

  /**
   * Try to scroll to the edited element
   */
  scrollToEditedElement() {
    try {
      const editedElement = document.querySelector(`[data-id="${this.editedElementId}"]`);
      
      if (editedElement) {
        // Use scrollIntoView with smooth behavior and center alignment
        editedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        
        console.log('Scrolled to edited element:', this.editedElementId);
        return true;
      }
    } catch (error) {
      console.warn('Failed to scroll to edited element:', error);
    }
    
    return false;
  },

  /**
   * Scroll to the saved position
   */
  scrollToSavedPosition() {
    try {
      if (this.scrollContainer === window) {
        window.scrollTo({
          left: this.savedScrollPosition.x,
          top: this.savedScrollPosition.y,
          behavior: 'smooth'
        });
      } else {
        this.scrollContainer.scrollTo({
          left: this.savedScrollPosition.x,
          top: this.savedScrollPosition.y,
          behavior: 'smooth'
        });
      }
      
      console.log('Scrolled to saved position:', this.savedScrollPosition);
    } catch (error) {
      console.warn('Failed to scroll to saved position:', error);
    }
  },

  /**
   * Clear saved data after restoration
   */
  clearSavedData() {
    this.savedScrollPosition = null;
    this.editedElementId = null;
  },

  /**
   * Complete scroll retention workflow - call before DOM refresh
   */
  beforeRefresh(editedElementId = null) {
    this.saveScrollPosition();
    if (editedElementId) {
      this.saveEditedElement(editedElementId);
    }
  },

  /**
   * Complete scroll restoration workflow - call after DOM refresh
   */
  afterRefresh() {
    this.restoreScrollPosition();
  }
};
