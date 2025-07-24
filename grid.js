// Story Map Grid Renderer (for Bubble Plugin)
window.StoryMapRenderer = {
  // The internal dataStore property is no longer needed and can be removed.

  render: function (containerElement) {
    // Note: 'data' parameter is removed
    // --- NEW: 1. PULL CLEAN DATA FROM THE DATA STORE ---
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const features = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // 2. GRID CALCULATION & DYNAMIC STYLE INJECTION
    const totalColumns = features.length > 0 ? features.length : 1;
    document.documentElement.style.setProperty("--total-columns", totalColumns);

    // 3. HTML GENERATION
    // 3. HTML GENERATION
    const projectTitle = project.name || "Unnamed Project";
    let html = `
            <div class="story-map-container">
                <h2>${projectTitle}</h2>
                <div class="story-map-info">
                    <small>Journeys: ${journeys.length} | Features: ${features.length} | Stories: ${stories.length} | Releases: ${releases.length}</small>
                </div>
                
                <!-- Personas Row is removed as per requirements -->
                
                <div class="story-map-grid-container">
        `;

    // We now need to link features to journeys for rendering
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));
    journeys.forEach((journey) => {
      const journeyFeatures = features.filter(
        (f) => f.journeyId === journey.id
      );
      // ... the rest of your complex journey rendering logic can now use 'journeyFeatures' ...
      // The logic itself remains complex but now operates on clean data.
      // Example of using new property names:
      html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}">...<span class="card-title">${journey.name}</span>...</div>`;
    });

    // Render Features
    features.forEach((feature, index) => {
      // Use clean property 'feature.name'
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${
        index + 1
      };"><span class="card-title">${feature.name}</span></div>`;
    });

    // Render Releases and Stories (using clean property names)
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    if (unreleasedStories.length > 0) {
      html += `<div class="release-header">Unassigned</div>`;
      features.forEach((feature, index) => {
        const storiesInColumn = unreleasedStories.filter(
          (s) => s.featureId === feature.id
        );
        if (storiesInColumn.length > 0) {
          /* ... */
        }
        // Use clean property 'story.name'
        // html += `<div class="card story-card ..." data-id="${story.id}"...><span class="card-title">${story.name}</span></div>`;
      });
    }

    releases.forEach((release) => {
      // Use clean properties 'release.name' and 'release.id'
      // html += `<div class="release-header" data-id="${release.id}">${release.name}</div>`;
      // ... etc ...
    });

    html += "</div></div>";

    // 4. RENDER TO CONTAINER
    containerElement.html(html);
  },
};
