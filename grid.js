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

    // --- THE DEFINITIVE RENDERING LOGIC ---

    // A. Render the Journeys on the FIRST row of the grid.
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

    journeys.forEach((journey) => {
      const journeyFeatures = features.filter(
        (f) => f.journeyId === journey.id
      );
      if (journeyFeatures.length === 0) return;

      // Find the min and max column index for ALL features of this journey
      const featureIndices = journeyFeatures.map((f) =>
        featureOrderMap.get(f.id)
      );
      const startCol = Math.min(...featureIndices) + 1;
      const endCol = Math.max(...featureIndices) + 1;
      const span = endCol - startCol + 1;

      // Render ONE card per journey, forced onto row 1.
      html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span}; grid-row: 1;">
                        <span class="card-title">${journey.name}</span>
                     </div>`;
    });

    // B. Render the Features on the SECOND row of the grid.
    const featureRowIndex = 2;
    features.forEach((feature, index) => {
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${
        index + 1
      }; grid-row: ${featureRowIndex};">
                        <span class="card-title">${feature.name}</span>
                     </div>`;
    });

    // C. Render the Stories starting on the THIRD row.
    let currentRow = featureRowIndex + 1;
    const renderStoriesForRelease = (storiesToRender, header) => {
      if (storiesToRender.length === 0) return;

      if (header) {
        html += `<div class="release-header" style="grid-row: ${currentRow};">${header}</div>`;
        currentRow++;
      }

      let maxStoriesInThisRelease = 0;
      const featureColumnHtml = new Map();

      features.forEach((feature) => {
        const storiesInColumn = storiesToRender.filter(
          (s) => s.featureId === feature.id
        );
        if (storiesInColumn.length > 0) {
          let columnHtml = `<div class="feature-column">`;
          storiesInColumn.forEach((story) => {
            const cardTypeClass = story.type === "Tech-Req" ? "tech" : "story";
            columnHtml += `<div class="card story-card ${cardTypeClass}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          columnHtml += "</div>";
          featureColumnHtml.set(feature.id, columnHtml);
          if (storiesInColumn.length > maxStoriesInThisRelease) {
            maxStoriesInThisRelease = storiesInColumn.length;
          }
        }
      });

      if (featureColumnHtml.size > 0) {
        html += `<div class="story-row" style="grid-row: ${currentRow} / span ${maxStoriesInThisRelease};">`;
        features.forEach((feature, index) => {
          if (featureColumnHtml.has(feature.id)) {
            html +=
              `<div style="grid-column: ${index + 1};">` +
              featureColumnHtml.get(feature.id) +
              `</div>`;
          }
        });
        html += `</div>`;
        currentRow += maxStoriesInThisRelease;
      }
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
