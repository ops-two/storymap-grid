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

    // A. Render the Journeys on the FIRST row of the grid.
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));
    journeys.forEach((journey) => {
      const journeyFeatures = features.filter(
        (f) => f.journeyId === journey.id
      );
      if (journeyFeatures.length === 0) return;

      const featureIndices = journeyFeatures.map((f) =>
        featureOrderMap.get(f.id)
      );
      const startCol = Math.min(...featureIndices) + 1;
      const endCol = Math.max(...featureIndices) + 1;
      const span = endCol - startCol + 1;

      html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span}; grid-row: 1;">
                    <span class="card-title">${journey.name}</span>
                 </div>`;
    });

    // B. Render the Features on the SECOND row of the grid.
    features.forEach((feature, index) => {
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${index + 1}; grid-row: 2;">
                    <span class="card-title">${feature.name}</span>
                 </div>`;
    });

    // C. Render the Stories, ensuring they start on row 3
    let currentRow = 3; // The first row available for stories

    const renderStoriesForRelease = (storiesToRender, header) => {
      if (storiesToRender.length === 0) return;

      // Render the header on its own row
      if (header) {
        html += `<div class="release-header" style="grid-row: ${currentRow};">${header}</div>`;
        currentRow++; // Move to the next row for the stories
      }

      let maxStoriesInThisRelease = 0;
      features.forEach((feature, index) => {
        const storiesInColumn = storiesToRender.filter(
          (s) => s.featureId === feature.id
        );
        if (storiesInColumn.length > 0) {
          // The grid-row property ensures this column starts at the correct vertical position
          html += `<div class="feature-column" style="grid-column: ${
            index + 1
          }; grid-row: ${currentRow};">`;
          storiesInColumn.forEach((story) => {
            const cardTypeClass = story.type === "Tech-Req" ? "tech" : "story";
            html += `<div class="card story-card ${cardTypeClass}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          html += "</div>";

          if (storiesInColumn.length > maxStoriesInThisRelease) {
            maxStoriesInThisRelease = storiesInColumn.length;
          }
        }
      });
      // Increment the current row by the height of the largest column in this release
      currentRow += maxStoriesInThisRelease;
    };

    const unreleasedStories = stories.filter((s) => !s.releaseId);
    renderStoriesForRelease(unreleasedStories, "Unassigned");

    releases.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);
      renderStoriesForRelease(releaseStories, release.name);
    });

    html += `</div></div>`;
    containerElement.html(html);
  },
};
