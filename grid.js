// in grid.js
window.StoryMapRenderer = {
  render: function (containerElement) {
    // 1. PULL CLEAN DATA from our new Data Store
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const features = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // 2. GRID CALCULATION
    const totalColumns = features.length > 0 ? features.length : 1;
    document.documentElement.style.setProperty("--total-columns", totalColumns);

    // 3. HTML GENERATION
    const projectTitle = project ? project.name : "Unnamed Project";
    let html = `
            <div class="story-map-container">
                <h2>${projectTitle}</h2>
                <div class="story-map-info">
                    <small>Journeys: ${journeys.length} | Features: ${features.length} | Stories: ${stories.length} | Releases: ${releases.length}</small>
                </div>
                <div class="story-map-grid-container">
        `;

    // --- DEFINITIVE "SINGLE BAR" JOURNEY & FEATURE RENDERING ---
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

    // A. Render each Journey on its OWN dedicated row as a SINGLE bar
    journeys.forEach((journey, index) => {
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

      html += `<div class="card journey-card" data-id="${
        journey.id
      }" data-type="journey" data-order="${
        journey.order
      }" style="grid-column: ${startCol} / span ${span}; grid-row: ${
        index + 1
      };">
                        <span class="card-title">${journey.name}</span>
                     </div>`;
    });

    // B. Render the single Feature row BELOW all the journeys
    const featureRowIndex = journeys.length + 1;
    features.forEach((feature, index) => {
      html += `<div class.card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${
        index + 1
      }; grid-row: ${featureRowIndex};">
                        <span class="card-title">${feature.name}</span>
                     </div>`;
    });

    // C. Render Stories, starting below the feature row
    let currentRow = featureRowIndex + 1;
    // ... (This story logic is correct and taken from your original file)
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    if (unreleasedStories.length > 0) {
      html += `<div class="release-header" style="grid-row: ${currentRow++};">Unassigned</div>`;
      features.forEach((feature, index) => {
        const storiesInColumn = unreleasedStories.filter(
          (s) => s.featureId === feature.id
        );
        if (storiesInColumn.length > 0) {
          html += `<div class="feature-column" style="grid-column: ${
            index + 1
          }; grid-row: ${currentRow};">`;
          storiesInColumn.forEach((story) => {
            const cardType = story.type === "Tech-Req" ? "tech" : "story";
            html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          html += "</div>";
        }
      });
      currentRow += Math.max(
        0,
        ...features.map(
          (f) => unreleasedStories.filter((s) => s.featureId === f.id).length
        )
      );
    }

    releases.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);
      if (releaseStories.length > 0) {
        html += `<div class="release-header" style="grid-row: ${currentRow++};">${
          release.name
        }</div>`;
        features.forEach((feature, index) => {
          const storiesInColumn = releaseStories.filter(
            (s) => s.featureId === feature.id
          );
          if (storiesInColumn.length > 0) {
            html += `<div class="feature-column" style="grid-column: ${
              index + 1
            }; grid-row: ${currentRow};">`;
            storiesInColumn.forEach((story) => {
              const cardType = story.type === "Tech-Req" ? "tech" : "story";
              html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
            });
            html += "</div>";
          }
        });
        currentRow += Math.max(
          0,
          ...features.map(
            (f) => releaseStories.filter((s) => s.featureId === f.id).length
          )
        );
      }
    });

    html += `</div></div>`;
    containerElement.html(html);

    // 4. INITIALIZE INTERACTION MODULES (The reliable pattern)
    if (window.StoryMapInlineEdit)
      window.StoryMapInlineEdit.init(containerElement[0]);
    if (window.StoryMapJourneyDragDrop)
      window.StoryMapJourneyDragDrop.init(containerElement[0]);
  },
};
