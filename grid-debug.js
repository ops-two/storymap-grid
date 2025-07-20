// Story Map Grid Renderer (for Bubble Plugin) - DEBUG VERSION

window.StoryMapRenderer = {
    render: function(data, containerElement) {
        console.log('StoryMapRenderer: Starting render with data:', data);
        
        // 1. DATA TRANSFORMATION
        const personas = (data.rawPersonas || []).map((p, index) => ({
            id: p.get('_id'),
            title: p.get('name_text') || `Persona ${index + 1}`
        }));
        console.log('Personas:', personas);

        const features = (data.rawFeatures || []).map((f, index) => {
            const feature = {
                id: f.get('_id'),
                title: f.get('name_text') || `Feature ${index + 1}`,
                journeyId: f.get('journey'),
                order: f.get('order_index_number') || index
            };
            console.log(`Feature ${index}:`, feature, 'journey field:', f.get('journey'));
            return feature;
        }).sort((a, b) => a.order - b.order);
        console.log('All features:', features);

        const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

        const journeys = (data.rawJourneys || []).map((j, index) => {
            const journeyId = j.get('_id');
            const journeyFeatures = features.filter(f => f.journeyId === journeyId);
            const journey = {
                id: journeyId,
                title: j.get('name_text') || `Journey ${index + 1}`,
                order: j.get('order_index_number') || index,
                featureIds: journeyFeatures.map(f => f.id)
            };
            console.log(`Journey ${index}:`, journey, 'matching features:', journeyFeatures.length);
            return journey;
        }).sort((a, b) => a.order - b.order);
        console.log('All journeys:', journeys);

        const stories = (data.rawStories || []).map((s, index) => {
            const story = {
                id: s.get('_id'),
                title: s.get('title_text') || `Story ${index + 1}`,
                featureId: s.get('feature'),
                releaseId: s.get('release'),
                type: s.get('type_option_storytype') || 'Story'
            };
            console.log(`Story ${index}:`, story, 'feature:', s.get('feature'), 'release:', s.get('release'));
            return story;
        });
        console.log('All stories:', stories);

        const releases = (data.rawReleases || []).map((r, index) => ({
            id: r.get('_id'),
            title: r.get('name_text') || `Release ${index + 1}`,
            targetDate: r.get('target_date_date')
        })).sort((a, b) => (a.targetDate || 0) - (b.targetDate || 0));
        console.log('All releases:', releases);

        // 2. GRID CALCULATION & DYNAMIC STYLE INJECTION
        const totalColumns = features.length > 0 ? features.length : 1;
        document.documentElement.style.setProperty('--total-columns', totalColumns);

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
        console.log('Rendering journeys...');
        journeys.forEach(journey => {
            const featureIndices = journey.featureIds.map(id => featureOrderMap.get(id)).filter(i => i !== undefined);
            console.log(`Journey "${journey.title}" feature indices:`, featureIndices);
            if (featureIndices.length === 0) {
                console.log(`Skipping journey "${journey.title}" - no features`);
                return;
            }
            const startCol = Math.min(...featureIndices) + 1;
            const endCol = Math.max(...featureIndices) + 1;
            const span = endCol - startCol + 1;
            console.log(`Journey "${journey.title}" grid: start=${startCol}, end=${endCol}, span=${span}`);
            html += `<div class="card journey-card" data-id="${journey.id}" style="grid-column: ${startCol} / span ${span};">${journey.title}</div>`;
        });

        // Render Features
        console.log('Rendering features...');
        features.forEach((feature, index) => {
            html += `<div class="card feature-card" data-id="${feature.id}" style="grid-column: ${index + 1};">${feature.title}</div>`;
        });

        // Render Releases and Stories
        console.log('Rendering releases and stories...');
        
        // First, let's handle stories without releases
        const unreleasedStories = stories.filter(s => !s.releaseId);
        if (unreleasedStories.length > 0) {
            console.log(`Found ${unreleasedStories.length} unreleased stories`);
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
        
        // Then handle releases
        releases.forEach((release, releaseIndex) => {
            const releaseStories = stories.filter(s => s.releaseId === release.id);
            console.log(`Release "${release.title}" has ${releaseStories.length} stories`);
            if (releaseStories.length === 0) return;

            html += `<div class="release-header" data-id="${release.id}">${release.title}</div>`;

            features.forEach((feature, index) => {
                const storiesInColumn = releaseStories.filter(s => s.featureId === feature.id);
                if (storiesInColumn.length > 0) {
                    console.log(`Feature "${feature.title}" has ${storiesInColumn.length} stories in release "${release.title}"`);
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
        console.log('StoryMapRenderer: Render complete');
    }
};
