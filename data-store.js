// The definitive, stable, and schema-aligned data-store.js

window.StoryMapDataStore = {
  data: {
    project: null,
    journeys: new Map(),
    features: new Map(),
    stories: new Map(),
    releases: new Map(),
  },

  init(rawData) {
    this.data.project = { id: rawData.projectId, name: rawData.projectName };

    this.data.journeys.clear();
    rawData.rawJourneys.forEach((j) => {
      const id = j.get("_id");
      this.data.journeys.set(id, {
        id: id,
        name: j.get("name_text"),
        order: j.get("order_index_number"),
      });
    });

    this.data.features.clear();
    rawData.rawFeatures.forEach((f) => {
      const id = f.get("_id");
      const journeyRef = f.get("journey_custom_journey");
      this.data.features.set(id, {
        id: id,
        name: f.get("name_text"),
        order: f.get("order_index_number"),
        journeyId: journeyRef ? journeyRef.get("_id") : null,
      });
    });

    this.data.stories.clear();
    rawData.rawStories.forEach((s) => {
      const id = s.get("_id");
      const featureRef = s.get("feature_custom_feature3");
      const releaseRef = s.get("release_custom_release");
      this.data.stories.set(id, {
        id: id,
        name: s.get("title_text"),
        order: s.get("order_index_number"),
        type: s.get("type_option_storytype"),
        featureId: featureRef ? featureRef.get("_id") : null,
        releaseId: releaseRef ? releaseRef.get("_id") : null,
      });
    });

    this.data.releases.clear();
    rawData.rawReleases.forEach((r) => {
      const id = r.get("_id");
      this.data.releases.set(id, {
        id: id,
        name: r.get("name_text"),
      });
    });
  },

  getEntityForUpdate(entityType, entityId) {
    const entity = this.getEntity(entityType, entityId);
    if (!entity) return null;
    const updateData = {
      entityId: entity.id,
      name_text: entity.name,
      order_index: entity.order || 0,
    };
    return updateData;
  },

  updateEntityName(entityType, entityId, newName) {
    const entity = this.getEntity(entityType, entityId);
    if (entity) {
      entity.name = newName;
    }
  },

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
