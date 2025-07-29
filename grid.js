// The definitive and complete grid.js renderer

window.StoryMapRenderer = {
  render: function (containerElement) {
    // --- 1. PULL CLEAN DATA FROM THE DATA STORE ---
    // This part is correct and working.
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const allFeatures = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // --- 2. PREPARE DATA STRUCTURES FOR RENDERING ---
    // This section correctly sorts features by their parent journey and preserves your original logic.
    const features = [];
    journeys.forEach((journey) => {
      const journeyFeatures = allFeatures.filter(
        (f) => f.journeyId === journey.id
      );
      features.push(...journeyFeatures);
    });
    const unassignedFeatures = allFeatures.filter((f) => !f.journeyId);
    features.push(...unassignedFeatures);

    journeys.forEach((journey) => {
      const journeyFeatures = features.filter(
        (f) => f.journeyId === journey.id
      );
      journey.featureIds = journeyFeatures.map((f) => f.id);
    });
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

    // --- 3. GRID CALCULATION ---
    // This is correct.
    const totalColumns = features.length > 0 ? features.length : 1;
    document.documentElement.style.setProperty("--total-columns", totalColumns);

    // --- 4. HTML GENERATION ---
    const projectTitle = project ? project.name : "Unnamed Project";
    let html = `
        <div class="story-map-container">
            <h2>${projectTitle}</h2>
            <div class="story-map-info">
                <small>Journeys: ${journeys.length} | Features: ${features.length} | Stories: ${stories.length} | Releases: ${releases.length}</small>
            </div>
            <div class="story-map-grid-container">
    `;

    // --- 4a. RENDER JOURNEYS ---
    // This is your proven, working logic for rendering journeys, including the "smart splitting".
    journeys.forEach((journey) => {
      if (!journey.featureIds) return;
      const featureIndices = journey.featureIds
        .map((id) => featureOrderMap.get(id))
        .filter((i) => i !== undefined);
      if (featureIndices.length === 0) return;
      featureIndices.sort((a, b) => a - b);
      const groups = [];
      if (featureIndices.length > 0) {
        let currentGroup = [featureIndices[0]];
        for (let i = 1; i < featureIndices.length; i++) {
          if (featureIndices[i] === featureIndices[i - 1] + 1) {
            currentGroup.push(featureIndices[i]);
          } else {
            groups.push(currentGroup);
            currentGroup = [featureIndices[i]];
          }
        }
        groups.push(currentGroup);
      }
      groups.forEach((group, groupIndex) => {
        const startCol = Math.min(...group) + 1;
        const span = group.length;
        const title =
          groups.length > 1
            ? `${journey.name} (${groupIndex + 1}/${groups.length})`
            : journey.name;
        html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span};"><span class="card-title">${title}</span></div>`;
      });
    });

    // --- 4b. RENDER FEATURES ---
    // This is the proven, working logic for rendering the feature row.
    features.forEach((feature, index) => {
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${
        index + 1
      };"><span class="card-title">${feature.name}</span></div>`;
    });

    // --- 4c. RENDER STORIES AND RELEASES (THE DEFINITIVE, CORRECTED LOGIC) ---
    const unreleasedStories = stories.filter((s) => !s.releaseId);

    // REPLACE WITH THIS SECTION
    if (unreleasedStories.length > 0) {
      html += `<div class="release-header">Unassigned</div>`;
      features.forEach((feature, index) => {
        const storiesInColumn = unreleasedStories.filter(
          (s) => s.featureId === feature.id
        );
        html += `<div class="feature-column" style="grid-column: ${
          index + 1
        };" data-feature-id="${feature.id}" data-release-id="unassigned">`;

        // THIS IS THE CRITICAL FIX: The story rendering logic is now present.
        storiesInColumn.forEach((story) => {
          html += `<div class="card story-card ${
            story.type === "Tech-Req" ? "tech" : ""
          }" data-id="${story.id}" data-type="story" data-order="${
            story.order
          }"><span class="card-title">${story.name}</span></div>`;
        });

        // We also ensure the drop zone is rendered correctly for this section.
        html += `<div class="empty-column-drop-zone" data-feature-id="${feature.id}" data-release-id="unassigned"><span>Drop Story Here</span></div>`;
        html += `</div>`;
      });
    }

    // Now, loop through each release and render its section.
    releases.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);

      html += `<div class="release-header" data-id="${release.id}">${release.name}</div>`;
      features.forEach((feature, index) => {
        const storiesInColumn = releaseStories.filter(
          (s) => s.featureId === feature.id
        );
        html += `<div class="feature-column" style="grid-column: ${
          index + 1
        };" data-feature-id="${feature.id}">`;
        if (storiesInColumn.length > 0) {
          storiesInColumn.forEach((story) => {
            html += `<div class="card story-card ${
              story.type === "Tech-Req" ? "tech" : ""
            }" data-id="${story.id}" data-type="story" data-order="${
              story.order
            }"><span class="card-title">${story.name}</span></div>`;
          });
        }
        // Always render a drop zone in this release's columns as well.
        html += `<div class="empty-column-drop-zone" data-feature-id="${feature.id}"><span>Drop Story Here</span></div>`;
        html += `</div>`;
      });
    });

    // --- 4d. CLOSE HTML TAGS ---
    html += `</div></div>`;
    containerElement.html(html);

    // --- 5. INITIALIZE INTERACTION MODULES ---
    // This is correct and working.
    if (window.StoryMapInlineEdit)
      window.StoryMapInlineEdit.init(containerElement[0]);
    if (window.StoryMapJourneyDragDrop)
      window.StoryMapJourneyDragDrop.init(containerElement[0]);
    if (window.StoryMapFeatureDragDrop)
      window.StoryMapFeatureDragDrop.init(containerElement[0]);
    if (window.StoryMapStoryDragDrop)
      window.StoryMapStoryDragDrop.init(containerElement[0]);
  },
};
