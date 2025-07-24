window.StoryMapRenderer = {
  render: function (containerElement) {
    // --- 1. PULL CLEAN DATA FROM THE NEW DATA STORE ---
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const features = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // --- 2. PREPARE DATA USING YOUR ORIGINAL, PROVEN LOGIC ---
    // This logic correctly determines how journeys are grouped and split.
    journeys.forEach((journey) => {
      const journeyFeatures = features.filter(
        (f) => f.journeyId === journey.id
      );
      journey.featureIds = journeyFeatures.map((f) => f.id);
    });
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

    // --- 3. GRID CALCULATION & DYNAMIC STYLE INJECTION ---
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

    // --- RENDER JOURNEYS & FEATURES USING YOUR ORIGINAL, PROVEN LOGIC ---
    // This is your original code, only adapted to use our new clean property names (e.g., journey.name)
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

    features.forEach((feature, index) => {
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${
        index + 1
      };"><span class="card-title">${feature.name}</span></div>`;
    });

    // --- RENDER STORIES (This logic was already correct) ---
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    if (unreleasedStories.length > 0) {
      html += `<div class="release-header">Unassigned</div>`;
      features.forEach((feature, index) => {
        const storiesInColumn = unreleasedStories.filter(
          (s) => s.featureId === feature.id
        );
        if (storiesInColumn.length > 0) {
          html += `<div class="feature-column" style="grid-column: ${
            index + 1
          };">`;
          storiesInColumn.forEach((story) => {
            const cardType = story.type === "Tech-Req" ? "tech" : "story";
            html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          html += "</div>";
        }
      });
    }

    releases.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);
      if (releaseStories.length === 0) return;
      html += `<div class="release-header" data-id="${release.id}">${release.name}</div>`;
      features.forEach((feature, index) => {
        const storiesInColumn = releaseStories.filter(
          (s) => s.featureId === feature.id
        );
        if (storiesInColumn.length > 0) {
          html += `<div class="feature-column" style="grid-column: ${
            index + 1
          };">`;
          storiesInColumn.forEach((story) => {
            const cardType = story.type === "Tech-Req" ? "tech" : "story";
            html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          html += "</div>";
        }
      });
    });

    html += `</div></div>`;

    // --- 5. RENDER TO CONTAINER ---
    containerElement.html(html);
    if (window.StoryMapJourneyDragDrop) {
      window.StoryMapJourneyDragDrop.init(containerElement[0]);
    }
  },
};
