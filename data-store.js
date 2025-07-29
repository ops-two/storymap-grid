// in data-store.js
window.StoryMapDataStore = {
  data: {
    project: null,
    journeys: new Map(),
    features: new Map(),
    stories: new Map(),
    releases: new Map(),
  },

  init(rawData) {
    this.data.project = {
      id: rawData.projectId,
      name: rawData.projectName,
    };

    this.data.journeys.clear();
    rawData.rawJourneys.forEach((j, index) => {
      const journeyId = j.get("_id");
      this.data.journeys.set(journeyId, {
        id: journeyId,
        name: j.get("name_text") || `Journey ${index + 1}`,
        order: j.get("order_index_number"),
      });
    });

    this.data.features.clear();
    rawData.rawFeatures.forEach((f, index) => {
      const featureId = f.get("_id");
      const journeyRef = f.get("journey_custom_journey");
      this.data.features.set(featureId, {
        id: featureId,
        name: f.get("name_text") || `Feature ${index + 1}`,
        order: f.get("order_index_number"),
        journeyId: journeyRef ? journeyRef.get("_id") : null,
      });
    });

    this.data.stories.clear();
    rawData.rawStories.forEach((s, index) => {
      const storyId = s.get("_id");
      const featureRef = s.get("feature_custom_feature3");
      const releaseRef = s.get("release_custom_release");
      this.data.stories.set(storyId, {
        id: storyId,
        name: s.get("title_text") || `Story ${index + 1}`,
        order: s.get("order_index_number"),
        type: s.get("type_option_storytype"),
        featureId: featureRef ? featureRef.get("_id") : null,
        releaseId: releaseRef ? releaseRef.get("_id") : null,
      });
    });

    this.data.releases.clear();
    rawData.rawReleases.forEach((r, index) => {
      const releaseId = r.get("_id");
      this.data.releases.set(releaseId, {
        id: releaseId,
        name: r.get("name_text") || `Release ${index + 1}`,
        targetDate: r.get("target_date_date"),
      });
    });
  },

  /**
   * Gets a formatted object ready for Bubble workflows, based on the original pattern.
   */
  getEntityForUpdate(entityType, entityId) {
    const entity = this.getEntity(entityType, entityId);
    if (!entity) return null;

    // This object structure matches what your original workflow expects.
    const updateData = {
      entityId: entity.id,
      // Use the clean 'name' property
      name_text: entity.name,
      // Use the clean 'order' property
      order_index: entity.order || 0,
    };

    // For stories, the name field is different in the original Bubble DB
    if (entityType === "story") {
      updateData.name_text = entity.name; // In our clean store, it's always 'name'
    }

    return updateData;
  },
  // Add this function to data-store.js

  /**
   * Updates the order of a single entity in the local store.
   * This is for optimistic UI updates.
   */
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
