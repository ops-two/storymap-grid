// Story Map Grid Renderer (for Bubble Plugin)

window.StoryMapRenderer = {
    render: function(data, containerElement) {
        // 1. DATA TRANSFORMATION
        const personas = (data.rawPersonas || []).map((p, index) => ({
            id: p.get('_id'),
            title: p.get('name_text') || `Persona ${index + 1}`
        }));

        const features = (data.rawFeatures || []).map((f, index) => {
            // Get journey reference - in Bubble, this returns the ID directly
            const journeyRef = f.get('journey');
            return {
                id: f.get('_id'),
                title: f.get('name_text') || `Feature ${index + 1}`,
                journeyId: journeyRef, // This should be the journey ID
                order: f.get('order_index_number') || index
            };
        }).sort((a, b) => a.order - b.order);

        const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

        const journeys = (data.rawJourneys || []).map((j, index) => {
            const journeyId = j.get('_id');
            const journeyFeatures = features.filter(f => f.journeyId === journeyId);
            return {
                id: journeyId,
                title: j.get('name_text') || `Journey ${index + 1}`,
                order: j.get('order_index_number') || index,
                featureIds: journeyFeatures.map(f => f.id)
            };
        }).sort((a, b) => a.order - b.order);

        const stories = (data.rawStories || []).map((s, index) => {
            // Get feature and release references
            const featureRef = s.get('feature');
            const releaseRef = s.get('release');
            return {
                id: s.get('_id'),
                title: s.get('title_text') || `Story ${index + 1}`,
                featureId: featureRef, // This should be the feature ID
                releaseId: releaseRef, // This should be the release ID
                type: s.get('type_option_storytype') || 'Story'
            };
        });

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
                html += `<div class="card persona-card" data-id="${persona.id}">${persona.title}</div>`;
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

        // Render Journeys
        journeys.forEach(journey => {
            const featureIndices = journey.featureIds.map(id => featureOrderMap.get(id)).filter(i => i !== undefined);
            if (featureIndices.length === 0) return;
            const startCol = Math.min(...featureIndices) + 1;
            const endCol = Math.max(...featureIndices) + 1;
            const span = endCol - startCol + 1;
            html += `<div class="card journey-card" data-id="${journey.id}" style="grid-column: ${startCol} / span ${span};">${journey.title}</div>`;
        });

        // Render Features
        features.forEach((feature, index) => {
            html += `<div class="card feature-card" data-id="${feature.id}" style="grid-column: ${index + 1};">${feature.title}</div>`;
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
                        html += `<div class="card story-card ${cardType}" data-id="${story.id}">${story.title}</div>`;
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
                        html += `<div class="card story-card ${cardType}" data-id="${story.id}">${story.title}</div>`;
                    });
                    html += '</div>';
                }
            });
        });

        html += '</div></div>';

        // 4. RENDER TO CONTAINER
        containerElement.html(html);
    }
};
