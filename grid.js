// Story Map Grid Renderer (for Bubble Plugin)

window.StoryMapRenderer = {
    render: function(data, containerElement) {
        // 1. DATA TRANSFORMATION
        const personas = (data.rawPersonas || []).map((p, index) => ({
            id: p.get('_id'),
            title: p.get('name_text') || `Persona ${index + 1}`
        }));

        // First, create all features with their data
        const allFeatures = (data.rawFeatures || []).map((f, index) => {
            // Get journey reference - use correct Bubble field name
            const journeyRef = f.get('journey_custom_journey');
            const journeyId = journeyRef ? journeyRef.get('_id') : null;
            return {
                id: f.get('_id'),
                title: f.get('name_text') || `Feature ${index + 1}`,
                journeyId: journeyId,
                order: f.get('order_index_number') || index
            };
        });

        // Create and sort journeys
        const journeys = (data.rawJourneys || []).map((j, index) => {
            return {
                id: j.get('_id'),
                title: j.get('name_text') || `Journey ${index + 1}`,
                order: j.get('order_index_number') || index
            };
        }).sort((a, b) => a.order - b.order);

        // Now organize features by journey order, then by feature order within journey
        const features = [];
        journeys.forEach(journey => {
            const journeyFeatures = allFeatures
                .filter(f => f.journeyId === journey.id)
                .sort((a, b) => a.order - b.order);
            features.push(...journeyFeatures);
            // Add feature IDs to journey
            journey.featureIds = journeyFeatures.map(f => f.id);
        });

        // Add any features without journeys at the end
        const featuresWithoutJourney = allFeatures.filter(f => !f.journeyId);
        features.push(...featuresWithoutJourney);

        const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

        const stories = (data.rawStories || []).map((s, index) => {
            // Get feature and release references - use correct Bubble field names
            const featureRef = s.get('feature_custom_feature3');
            const featureId = featureRef ? featureRef.get('_id') : null;
            const releaseRef = s.get('release_custom_release');
            const releaseId = releaseRef ? releaseRef.get('_id') : null;
            
            return {
                id: s.get('_id'),
                title: s.get('title_text') || `Story ${index + 1}`,
                featureId: featureId,
                releaseId: releaseId,
                order: s.get('order_index_number') || index,
                type: s.get('type_option_storytype') || 'Story'
            };
        }).sort((a, b) => a.order - b.order);

        const releases = (data.rawReleases || []).map((r, index) => ({
            id: r.get('_id'),
            title: r.get('name_text') || `Release ${index + 1}`,
            targetDate: r.get('target_date_date')
        })).sort((a, b) => (a.targetDate || 0) - (b.targetDate || 0));

        // 2. GRID CALCULATION & DYNAMIC STYLE INJECTION
        const totalColumns = features.length > 0 ? features.length : 1;
        document.documentElement.style.setProperty('--total-columns', totalColumns);

        // 3. HTML GENERATION
        // 3. HTML GENERATION
        const projectTitle = data.projectName || 'Unnamed Project';
        let html = `
            <div class="story-map-container">
                <h2>${projectTitle}</h2>
                <div class="story-map-info">
                    <small>Journeys: ${journeys.length} | Features: ${features.length} | Stories: ${stories.length} | Personas: ${personas.length} | Releases: ${releases.length}</small>
                </div>
                
                <!-- Personas Row -->
                <div class="personas-row">
                    <div class="row-header">Personas</div>
                    <div class="row-content">
        `;
        
        if (personas.length > 0) {
            personas.forEach(persona => {
                html += `<div class="card persona-card" data-id="${persona.id}" data-type="persona"><span class="card-title">${persona.title}</span></div>`;
            });
        } else {
            html += `<span class="no-data">No personas defined</span>`;
        }
        
        html += `
                    </div>
                </div>
                
                <!-- Grid Layout -->
                <div class="story-map-grid-container">
        `;

        // Render Journeys - handle non-contiguous features
        journeys.forEach(journey => {
            const featureIndices = journey.featureIds.map(id => featureOrderMap.get(id)).filter(i => i !== undefined);
            if (featureIndices.length === 0) return;
            
            // Sort indices to find contiguous groups
            featureIndices.sort((a, b) => a - b);
            
            // Find contiguous groups of features
            const groups = [];
            let currentGroup = [featureIndices[0]];
            
            for (let i = 1; i < featureIndices.length; i++) {
                if (featureIndices[i] === featureIndices[i-1] + 1) {
                    // Contiguous, add to current group
                    currentGroup.push(featureIndices[i]);
                } else {
                    // Not contiguous, start new group
                    groups.push(currentGroup);
                    currentGroup = [featureIndices[i]];
                }
            }
            groups.push(currentGroup);
            
            // Render a journey card for each contiguous group
            groups.forEach((group, groupIndex) => {
                const startCol = Math.min(...group) + 1;
                const span = group.length;
                const title = groups.length > 1 ? `${journey.title} (${groupIndex + 1}/${groups.length})` : journey.title;
                html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span};"><span class="card-title">${title}</span></div>`;
            });
        });

        // Render Features
        features.forEach((feature, index) => {
            html += `<div class="card feature-card" data-id="${feature.id}" data-type="feature" style="grid-column: ${index + 1};"><span class="card-title">${feature.title}</span></div>`;
        });

        // Render Releases and Stories
        // First, handle stories without releases (unassigned)
        const unreleasedStories = stories.filter(s => !s.releaseId);
        if (unreleasedStories.length > 0) {
            html += `<div class="release-header">Unassigned</div>`;
            
            features.forEach((feature, index) => {
                const storiesInColumn = unreleasedStories.filter(s => s.featureId === feature.id);
                if (storiesInColumn.length > 0) {
                    html += `<div class="feature-column" style="grid-column: ${index + 1};">`;
                    storiesInColumn.forEach(story => {
                        const cardType = story.type === 'Tech-Req' ? 'tech' : 'story';
                        html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.title}</span></div>`;
                    });
                    html += '</div>';
                }
            });
        }
        
        // Then handle releases with their stories
        releases.forEach(release => {
            const releaseStories = stories.filter(s => s.releaseId === release.id);
            if (releaseStories.length === 0) return;

            html += `<div class="release-header" data-id="${release.id}">${release.title}</div>`;

            features.forEach((feature, index) => {
                const storiesInColumn = releaseStories.filter(s => s.featureId === feature.id);
                if (storiesInColumn.length > 0) {
                    html += `<div class="feature-column" style="grid-column: ${index + 1};">`;
                    storiesInColumn.forEach(story => {
                        const cardType = story.type === 'Tech-Req' ? 'tech' : 'story';
                        html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.title}</span></div>`;
                    });
                    html += '</div>';
                }
            });
        });

        html += '</div></div>';

        // 4. RENDER TO CONTAINER
        containerElement.html(html);
        
        // 5. INITIALIZE MODULES
        if (window.StoryMapInlineEdit) {
            window.StoryMapInlineEdit.init(containerElement[0]);
        }
        
        // Initialize journey drag and drop
        if (window.StoryMapJourneyDragDrop) {
            window.StoryMapJourneyDragDrop.init(containerElement[0]);
        }
    }
};
