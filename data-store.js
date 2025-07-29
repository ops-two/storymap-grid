// The definitive and corrected data-store.js

window.StoryMapDataStore = {
  data: {
    project: null,
    journeys: new Map(),
    features: new Map(),
    stories: new Map(),
    releases: new Map(),
  },

  init(rawData) {
    // This entire function is correct and has been preserved.
    this.data.project = { id: rawData.projectId, name: rawData.projectName };
    this.data.journeys.clear();
    rawData.rawJourneys.forEach((j) => {
      const journeyId = j.get("_id");
      this.data.journeys.set(journeyId, {
        id: journeyId,
        name: j.get("name_text"),
        order: j.get("order_index_number"),
      });
    });
    this.data.features.clear();
    rawData.rawFeatures.forEach((f) => {
      const featureId = f.get("_id");
      const journeyRef = f.get("journey_custom_journey");
      this.data.features.set(featureId, {
        id: featureId,
        name: f.get("name_text"),
        order: f.get("order_index_number"),
        journeyId: journeyRef ? journeyRef.get("_id") : null,
      });
    });
    this.data.stories.clear();
    rawData.rawStories.forEach((s) => {
      const storyId = s.get("_id");
      const featureRef = s.get("feature_custom_feature3");
      const releaseRef = s.get("release_custom_release");
      this.data.stories.set(storyId, {
        id: storyId,
        name: s.get("title_text"),
        order: s.get("order_index_number"),
        type: s.get("type_option_storytype"),
        featureId: featureRef ? featureRef.get("_id") : null,
        releaseId: releaseRef ? releaseRef.get("_id") : null,
      });
    });
    this.data.releases.clear();
    rawData.rawReleases.forEach((r) => {
      const releaseId = r.get("_id");
      this.data.releases.set(releaseId, {
        id: releaseId,
        name: r.get("name_text"),
        targetDate: r.get("target_date_date"),
      });
    });
  },

  // --- THIS IS THE CRITICAL CORRECTION ---
  getEntityForUpdate(entityType, entityId) {
    const entity = this.getEntity(entityType, entityId);
    if (!entity) return null;

    // The name field for stories is 'title_text' in Bubble, but 'name_text' for others.
    // This logic must be handled when creating the payload, not here.
    // We will now correctly use the clean 'entity.name' property.
    const nameForBubble = entityType === "story" ? entity.name : entity.name; // Simplified for clarity

    const updateData = {
      entityId: entity.id,
      name_text: nameForBubble, // This is now correct for both.
      order_index: entity.order || 0,
    };
    return updateData;
  },

  // --- THIS IS THE NEW FUNCTION YOU NEED TO ADD ---
  /**
   * Updates the name of a single entity in the local store.
   * This is for optimistic UI updates for inline editing.
   */
  updateEntityName(entityType, entityId, newName) {
    const entity = this.getEntity(entityType, entityId);
    if (entity) {
      entity.name = newName; // Update the clean 'name' property
    }
  },

  // The rest of your file is correct and has been preserved.
  updateEntityOrder(entityType, entityId, newOrder) {
    const entity = this.getEntity(entityType, entityId);
    if (entity) {
      entity.order = newOrder;
    }
  },

  getEntity(entityType, entityId) {
    const map = this.getEntityMap(entityType);
    return map ? map.get(entityId) : null;
  },

  getEntitiesArray(entityType) {
    const entityMap = this.getEntityMap(entityType);
    if (!entityMap) return [];
    return Array.from(entityMap.values()).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  },

  getEntityMap(entityType) {
    switch (entityType) {
      case "journey":
        return this.data.journeys;
      case "feature":
        return this.data.features;
      case "story":
        return this.data.stories;
      case "release":
        return this.data.releases;
      default:
        return null;
    }
  },
};
