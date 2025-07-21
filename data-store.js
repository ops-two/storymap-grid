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
        releases: new Map()
    },
    
    // Track local modifications
    localChanges: new Map(),
    
    /**
     * Initialize data store with Bubble data
     */
    init(rawData) {
        // Store project info
        this.data.project = {
            id: rawData.projectId,
            name: rawData.projectName
        };
        
        // Store journeys with all fields
        this.data.journeys.clear();
        rawData.rawJourneys.forEach(journey => {
            const id = journey.get('_id');
            this.data.journeys.set(id, {
                _id: id,
                name_text: journey.get('name_text'),
                order_index_number: journey.get('order_index_number'),
                project: journey.get('project'),
                _raw: journey // Keep reference to Bubble object
            });
        });
        
        // Store features with all fields
        this.data.features.clear();
        rawData.rawFeatures.forEach(feature => {
            const id = feature.get('_id');
            this.data.features.set(id, {
                _id: id,
                name_text: feature.get('name_text'),
                order_index_number: feature.get('order_index_number'),
                journey_custom_journey: feature.get('journey_custom_journey'),
                project: feature.get('project'),
                _raw: feature
            });
        });
        
        // Store stories with all fields
        this.data.stories.clear();
        rawData.rawStories.forEach(story => {
            const id = story.get('_id');
            this.data.stories.set(id, {
                _id: id,
                title_text: story.get('title_text'),
                order_index_number: story.get('order_index_number'),
                feature_custom_feature3: story.get('feature_custom_feature3'),
                release_custom_release: story.get('release_custom_release'),
                type_option_storytype: story.get('type_option_storytype'),
                personas_list_custom_persona: story.get('personas_list_custom_persona'),
                _raw: story
            });
        });
        
        // Store personas
        this.data.personas.clear();
        rawData.rawPersonas.forEach(persona => {
            const id = persona.get('_id');
            this.data.personas.set(id, {
                _id: id,
                name_text: persona.get('name_text'),
                icon_image: persona.get('icon_image'),
                workspace: persona.get('workspace'),
                _raw: persona
            });
        });
        
        // Store releases
        this.data.releases.clear();
        rawData.rawReleases.forEach(release => {
            const id = release.get('_id');
            this.data.releases.set(id, {
                _id: id,
                name_text: release.get('name_text'),
                target_date_date: release.get('target_date_date'),
                workspace: release.get('workspace'),
                _raw: release
            });
        });
        
        // Clear local changes after fresh load
        this.localChanges.clear();
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
            timestamp: Date.now()
        });
        
        return updatedEntity;
    },
    
    /**
     * Get full entity data for updates
     */
    getEntityForUpdate(entityType, entityId) {
        const entityMap = this.getEntityMap(entityType);
        if (!entityMap) return null;
        
        const entity = entityMap.get(entityId);
        if (!entity) return null;
        
        // Return clean copy without internal fields
        const { _raw, ...cleanEntity } = entity;
        return cleanEntity;
    },
    
    /**
     * Get entity map by type
     */
    getEntityMap(entityType) {
        switch(entityType) {
            case 'journey': return this.data.journeys;
            case 'feature': return this.data.features;
            case 'story': return this.data.stories;
            case 'persona': return this.data.personas;
            case 'release': return this.data.releases;
            default: return null;
        }
    },
    
    /**
     * Get all entities of a type as array
     */
    getEntitiesArray(entityType) {
        const entityMap = this.getEntityMap(entityType);
        if (!entityMap) return [];
        
        return Array.from(entityMap.values())
            .map(({ _raw, ...entity }) => entity)
            .sort((a, b) => {
                const orderA = a.order_index_number || 0;
                const orderB = b.order_index_number || 0;
                return orderA - orderB;
            });
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
    }
};
