// The definitive, complete, and schema-aligned data-store.js

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

    // --- JOURNEYS --- (Matches your schema)
    this.data.journeys.clear();
    rawData.rawJourneys.forEach((j) => {
      const id = j.get("_id");
      this.data.journeys.set(id, {
        id: id,
        name: j.get("name_text"), // Correct for 'name' (text)
        order: j.get("order_index_number"), // Correct for 'order_index' (number)
      });
    });

    // --- FEATURES --- (Matches your schema)
    this.data.features.clear();
    rawData.rawFeatures.forEach((f) => {
      const id = f.get("_id");
      const journeyRef = f.get("journey"); // Correct for 'journey' (Journey)
      this.data.features.set(id, {
        id: id,
        name: f.get("name_text"),
        order: f.get("order_index_number"),
        journeyId: journeyRef ? journeyRef.get("_id") : null,
      });
    });

    // --- STORIES --- (Meticulously corrected to match your Story screenshot)
    this.data.stories.clear();
    rawData.rawStories.forEach((s) => {
      const id = s.get("_id");
      const featureRef = s.get("feature");
      const releaseRef = s.get("release"); // Your schema shows the field is 'release'
      this.data.stories.set(id, {
        id: id,
        name: s.get("name_text"), // Your schema shows the field is 'name'
        order: s.get("order_index"), // Your schema shows 'order_index'
        type: s.get("type"), // Your schema shows 'type'
        featureId: featureRef ? featureRef.get("_id") : null,
        releaseId: releaseRef ? releaseRef.get("_id") : null,
      });
    });

    // --- RELEASES --- (Meticulously corrected to match your Release screenshot)
    this.data.releases.clear();
    rawData.rawReleases.forEach((r) => {
      const id = r.get("_id");
      this.data.releases.set(id, {
        id: id,
        name: r.get("name_text"), // Your schema shows 'name' (text)
        // targetDate is removed as it does not exist in your schema.
      });
    });
  },

  // --- HELPER FUNCTIONS --- (All preserved and correct)

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
