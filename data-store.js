/**
 * Central Data Store for Story Map
 * Maintains full entity records and handles synchronization with Bubble
 */
window.StoryMapDataStore = {
  // Complete data structure
  data: {
    project: null,
    journeys: new Map(),
    features: new Map(),
    stories: new Map(),
    personas: new Map(),
    releases: new Map(),
  },

  // Track local modifications
  localChanges: new Map(),

  /**
   * Initialize data store with Bubble data
   */
  init(rawData) {
    this.data.project = {
      id: rawData.projectId,
      name: rawData.projectName,
    };

    // --- Journeys Transformation (Already Fixed) ---
    this.data.journeys.clear();
    rawData.rawJourneys.forEach((j, index) => {
      const journeyId = j.get("_id");
      this.data.journeys.set(journeyId, {
        id: journeyId,
        name: j.get("name_text") || `Journey ${index + 1}`,
        order: j.get("order_index_number"),
      });
    });

    // --- Features Transformation (NEW FIX) ---
    this.data.features.clear();
    rawData.rawFeatures.forEach((f, index) => {
      const featureId = f.get("_id");
      const journeyRef = f.get("journey_custom_journey");
      this.data.features.set(featureId, {
        id: featureId,
        name: f.get("name_text") || `Feature ${index + 1}`, // Added fallback
        order: f.get("order_index_number"),
        journeyId: journeyRef ? journeyRef.get("_id") : null,
      });
    });

    // --- Stories Transformation (NEW FIX) ---
    this.data.stories.clear();
    rawData.rawStories.forEach((s, index) => {
      const storyId = s.get("_id");
      const featureRef = s.get("feature_custom_feature3");
      const releaseRef = s.get("release_custom_release");
      this.data.stories.set(storyId, {
        id: storyId,
        name: s.get("title_text") || `Story ${index + 1}`, // Added fallback
        order: s.get("order_index_number"),
        type: s.get("type_option_storytype"),
        featureId: featureRef ? featureRef.get("_id") : null,
        releaseId: releaseRef ? releaseRef.get("_id") : null,
      });
    });

    // --- Releases Transformation (NEW FIX) ---
    this.data.releases.clear();
    rawData.rawReleases.forEach((r, index) => {
      const releaseId = r.get("_id");
      this.data.releases.set(releaseId, {
        id: releaseId,
        name: r.get("name_text") || `Release ${index + 1}`, // Added fallback
        targetDate: r.get("target_date_date"),
      });
    });

    this.localChanges.clear();
  },

  /**
   * Get full entity data for updates
   */
  getEntityForUpdate(entityType, entityId) {
    const entityMap = this.getEntityMap(entityType);
    if (!entityMap) return null;

    const entity = entityMap.get(entityId);
    if (!entity) return null;

    // Transform to expected update format
    const updateData = {
      entityId: entity._id,
    };

    // Add name field based on entity type
    if (entityType === "story") {
      updateData.name_text = entity.title_text;
    } else {
      updateData.name_text = entity.name_text;
    }

    // Add order_index (not order_index_number)
    updateData.order_index = entity.order_index_number || 0;

    return updateData;
  },

  /**
   * Get entity map by type
   */
  getEntityMap(entityType) {
    switch (entityType) {
      case "journey":
        return this.data.journeys;
      case "feature":
        return this.data.features;
      case "story":
        return this.data.stories;
      case "persona":
        return this.data.personas;
      case "release":
        return this.data.releases;
      default:
        return null;
    }
  },

  /**
   * Get all entities of a type as a sorted array of CLEAN objects
   */
  getEntitiesArray(entityType) {
    const entityMap = this.getEntityMap(entityType);
    if (!entityMap) return [];

    return Array.from(entityMap.values()).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  },

  /**
   * Retrieves a single entity by its ID
   */
  getEntity(entityType, entityId) {
    const map = this.getEntityMap(entityType);
    return map ? map.get(entityId) : null;
  },

  /**
   * Update entity with local changes
   */
  updateEntity(entityType, entityId, changes) {
    const entityMap = this.getEntityMap(entityType);
    if (!entityMap) {
      console.error(`Unknown entity type: ${entityType}`);
      return null;
    }

    const entity = entityMap.get(entityId);
    if (!entity) {
      console.error(`Entity not found: ${entityType} ${entityId}`);
      return null;
    }

    // Apply changes to local copy
    const updatedEntity = { ...entity, ...changes };
    entityMap.set(entityId, updatedEntity);

    // Track this as a local change
    this.localChanges.set(`${entityType}:${entityId}`, {
      entityType,
      entityId,
      changes,
      timestamp: Date.now(),
    });

    return updatedEntity;
  },

  /**
   * Check if we have local changes
   */
  hasLocalChanges() {
    return this.localChanges.size > 0;
  },

  /**
   * Clear local changes (after successful sync)
   */
  clearLocalChanges() {
    this.localChanges.clear();
  },
};
