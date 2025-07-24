window.StoryMapRenderer = {
  // We no longer need the internal dataStore here.

  // The render function no longer needs the 'data' parameter.
  render: function (containerElement) {
    // --- NEW: Pull clean data directly from the Data Store ---
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const features = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // --- ALL OF THE ORIGINAL, WORKING LOGIC IS PRESERVED BELOW ---
    // --- It has only been adapted to use the new data property names ---

    // The logic to organize features under journeys is slightly different in the original. Let's use it.
    journeys.forEach((journey) => {
      const journeyFeatures = features.filter(
        (f) => f.journeyId === journey.id
      );
      // Note: the original file sorted features again here, which is redundant
      // as getEntitiesArray already sorts them. We can skip that.
      journey.featureIds = journeyFeatures.map((f) => f.id);
    });

    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

    // 2. GRID CALCULATION & DYNAMIC STYLE INJECTION
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
                
                <!-- Personas Row is removed as requested -->
                
                <div class="story-map-grid-container">
        `;

    // Render Journeys - using the original, correct logic
    journeys.forEach((journey) => {
      // Check if featureIds was attached
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
        // ADAPTED: Use journey.name instead of journey.title
        const title =
          groups.length > 1
            ? `${journey.name} (${groupIndex + 1}/${groups.length})`
            : journey.name;
        html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span};"><span class="card-title">${title}</span></div>`;
      });
    });

    // Render Features - ADAPTED: Use feature.name instead of feature.title
    features.forEach((feature, index) => {
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" style="grid-column: ${
        index + 1
      };"><span class="card-title">${feature.name}</span></div>`;
    });

    // Render Releases and Stories - using the original, correct logic
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
            // ADAPTED: Use story.name instead of story.title
            html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          html += "</div>";
        }
      });
    }

    releases.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);
      if (releaseStories.length === 0) return;

      // ADAPTED: Use release.name instead of release.title
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
            // ADAPTED: Use story.name instead of story.title
            html += `<div class="card story-card ${cardType}" data-id="${story.id}" data-type="story"><span class="card-title">${story.name}</span></div>`;
          });
          html += "</div>";
        }
      });
    });

    html += "</div></div>";

    // 4. RENDER TO CONTAINER
    containerElement.html(html);

    // 5. REMOVED - Module initialization is now handled in update.txt
  },
};
