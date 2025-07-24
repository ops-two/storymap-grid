window.StoryMapRenderer = {
  render: function (containerElement) {
    // --- 1. PULL CLEAN DATA FROM THE DATA STORE ---
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const features = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // --- 2. GRID CALCULATION & DYNAMIC STYLE INJECTION ---
    const totalColumns = features.length > 0 ? features.length : 1;
    document.documentElement.style.setProperty("--total-columns", totalColumns);

    // --- 3. HTML GENERATION ---
    const projectTitle = project ? project.name : "Unnamed Project";
    let html = `
            <div class="story-map-container">
                <h2>${projectTitle}</h2>
                <div class="story-map-info">
                    <small>Journeys: ${journeys.length} | Features: ${features.length} | Stories: ${stories.length} | Releases: ${releases.length}</small>
                </div>
                <div class="story-map-grid-container">
        `;

    // --- FINAL, CORRECTED RENDERING LOGIC ---

    // A. Render the Journeys on the FIRST row of the grid.
    // This logic calculates which columns each journey card should span.
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));
    journeys.forEach((journey) => {
      const journeyFeatures = features.filter(
        (f) => f.journeyId === journey.id
      );
      if (journeyFeatures.length === 0) return; // Skip journeys with no features

      const featureIndices = journeyFeatures.map((f) =>
        featureOrderMap.get(f.id)
      );
      const startCol = Math.min(...featureIndices) + 1;
      const endCol = Math.max(...featureIndices) + 1;
      const span = endCol - startCol + 1;

      // The "grid-row: 1;" is the critical fix that forces all journeys onto the same top row.
      html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span}; grid-row: 1;">
                    <span class="card-title">${journey.name}</span>
                 </div>`;
    });

    // B. Render the Features on the SECOND row of the grid.
    // The "grid-row: 2;" ensures they appear cleanly below the journeys.
    features.forEach((feature, index) => {
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${index + 1}; grid-row: 2;">
                    <span class="card-title">${feature.name}</span>
                 </div>`;
    });

    // C. Render the Stories. They will automatically flow into the rows below the features.
    // This logic is correct and does not need to change.
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    if (unreleasedStories.length > 0) {
      html += `<div class="release-header" style="grid-row: 3;">Unassigned</div>`; // Assign a start row
      features.forEach((feature, index) => {
        const storiesInColumn = unreleasedStories.filter(
          (s) => s.featureId === feature.id
        );
        if (storiesInColumn.length > 0) {
          html += `<div class="feature-column" style="grid-column: ${
            index + 1
          }; grid-row: 4;">`; // Assign a start row
          storiesInColumn.forEach((story) => {
            const cardTypeClass = story.type === "Tech-Req" ? "tech" : "story";
            html += `<div class="card story-card ${cardTypeClass}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          html += "</div>";
        }
      });
    }

    releases.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);
      if (releaseStories.length > 0) {
        html += `<div class="release-header">${release.name}</div>`;
        features.forEach((feature, index) => {
          const storiesInColumn = releaseStories.filter(
            (s) => s.featureId === feature.id
          );
          if (storiesInColumn.length > 0) {
            html += `<div class="feature-column" style="grid-column: ${
              index + 1
            };">`;
            storiesInColumn.forEach((story) => {
              const cardTypeClass =
                story.type === "Tech-Req" ? "tech" : "story";
              html += `<div class="card story-card ${cardTypeClass}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
            });
            html += "</div>";
          }
        });
      }
    });

    html += "</div></div>";

    // --- 4. RENDER TO CONTAINER ---
    containerElement.html(html);
  },
};
