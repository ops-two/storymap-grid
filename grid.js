// The definitive, complete, and final grid.js renderer with the correct "Add Item" UI.

window.StoryMapRenderer = {
  render: function (containerElement) {
    // --- 1. PULL CLEAN DATA FROM THE DATA STORE ---
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const allFeatures = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // --- 2. PREPARE DATA STRUCTURES FOR RENDERING ---
    const features = [];
    journeys.forEach((j) =>
      features.push(...allFeatures.filter((f) => f.journeyId === j.id))
    );
    features.push(...allFeatures.filter((f) => !f.journeyId));
    journeys.forEach(
      (j) =>
        (j.featureIds = features
          .filter((f) => f.journeyId === j.id)
          .map((f) => f.id))
    );
    const featureOrderMap = new Map(features.map((f, i) => [f.id, i]));

    // --- 3. GRID CALCULATION & SVG DEFINITION ---
    const totalColumns = features.length > 0 ? features.length : 1;
    document.documentElement.style.setProperty("--total-columns", totalColumns);
    const iconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 13H8" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17H8" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 9H8" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
    journeys.forEach((journey, index) => {
      const prevJourney = journeys[index - 1];
      const nextJourney = journeys[index + 1];

      // Your proven journey rendering logic
      if (!journey.featureIds || journey.featureIds.length === 0) return;
      const featureIndices = journey.featureIds
        .map((id) => featureOrderMap.get(id))
        .filter((i) => i !== undefined);
      if (featureIndices.length === 0) return;
      featureIndices.sort((a, b) => a - b);
      const groups = [];
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
      groups.forEach((group, groupIndex) => {
        const startCol = Math.min(...group) + 1;
        const span = group.length;
        const title =
          groups.length > 1
            ? `${journey.name} (${groupIndex + 1}/${groups.length})`
            : journey.name;
        html += `<div class="card journey-card" data-id="${
          journey.id
        }" data-type="journey" data-order="${
          journey.order
        }" style="grid-column: ${startCol} / span ${span};">
                    <div class="add-item-button before" data-add-type="journey" data-before-order="${
                      prevJourney ? prevJourney.order : journey.order / 2
                    }" data-after-order="${journey.order}">+</div>
                    <span class="card-title-text">${title}</span>
                    <div class="card-icon-button">${iconSvg}</div>
                    <div class="add-item-button after" data-add-type="journey" data-before-order="${
                      journey.order
                    }" data-after-order="${
          nextJourney ? nextJourney.order : journey.order + 10
        }">+</div>
                 </div>`;
      });
    });

    // --- 4b. RENDER FEATURES ---
    features.forEach((feature, index) => {
      const prevFeature = features[index - 1];
      const nextFeature = features[index + 1];
      html += `<div class="card feature-card" data-id="${
        feature.id
      }" data-type="feature" data-order="${
        feature.order
      }" style="grid-column: ${index + 1};">
                  <div class="add-item-button before" data-add-type="feature" data-journey-id="${
                    feature.journeyId
                  }" data-before-order="${
        prevFeature && prevFeature.journeyId === feature.journeyId
          ? prevFeature.order
          : feature.order / 2
      }" data-after-order="${feature.order}">+</div>
                  <span class="card-title-text">${feature.name}</span>
                  <div class="card-icon-button">${iconSvg}</div>
                  <div class="add-item-button after" data-add-type="feature" data-journey-id="${
                    feature.journeyId
                  }" data-before-order="${feature.order}" data-after-order="${
        nextFeature && nextFeature.journeyId === feature.journeyId
          ? nextFeature.order
          : feature.order + 10
      }">+</div>
               </div>`;
    });

    // --- 4c. RENDER STORIES AND RELEASES ---
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    if (unreleasedStories.length > 0) {
      html += `<div class="release-header">Unassigned</div>`;
      features.forEach((feature, index) => {
        html += `<div class="feature-column" style="grid-column: ${
          index + 1
        };" data-feature-id="${feature.id}" data-release-id="unassigned">`;
        const storiesInColumn = unreleasedStories.filter(
          (s) => s.featureId === feature.id
        );
        storiesInColumn.forEach((story, storyIndex) => {
          const prevStory = storiesInColumn[storyIndex - 1];
          const nextStory = storiesInColumn[storyIndex + 1];
          html += `<div class="card story-card ${
            story.type === "Tech-Req" ? "tech" : ""
          }" data-id="${story.id}" data-type="story" data-order="${
            story.order
          }">
                            <div class="add-item-button above" data-add-type="story" data-feature-id="${
                              feature.id
                            }" data-release-id="unassigned" data-before-order="${
            prevStory ? prevStory.order : story.order / 2
          }" data-after-order="${story.order}">+</div>
                            <span class="card-title-text">${story.name}</span>
                            <div class="card-icon-button">${iconSvg}</div>
                            <div class="add-item-button below" data-add-type="story" data-feature-id="${
                              feature.id
                            }" data-release-id="unassigned" data-before-order="${
            story.order
          }" data-after-order="${
            nextStory ? nextStory.order : story.order + 10
          }">+</div>
                         </div>`;
        });
        html += `<div class="empty-column-drop-zone" data-feature-id="${feature.id}" data-release-id="unassigned"><span>Drop Story Here</span></div>`;
        html += `</div>`;
      });
    }

    const sortedReleasesToRender = releases
      .filter((r) => r && r.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    sortedReleasesToRender.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);
      if (releaseStories.length > 0) {
        html += `<div class="release-header" data-id="${release.id}">${release.name}</div>`;
        features.forEach((feature, index) => {
          html += `<div class="feature-column" style="grid-column: ${
            index + 1
          };" data-feature-id="${feature.id}" data-release-id="${release.id}">`;
          const storiesInColumn = releaseStories.filter(
            (s) => s.featureId === feature.id
          );
          storiesInColumn.forEach((story, storyIndex) => {
            const prevStory = storiesInColumn[storyIndex - 1];
            const nextStory = storiesInColumn[storyIndex + 1];
            html += `<div class="card story-card ${
              story.type === "Tech-Req" ? "tech" : ""
            }" data-id="${story.id}" data-type="story" data-order="${
              story.order
            }">
                                <div class="add-item-button above" data-add-type="story" data-feature-id="${
                                  feature.id
                                }" data-release-id="${
              release.id
            }" data-before-order="${
              prevStory ? prevStory.order : story.order / 2
            }" data-after-order="${story.order}">+</div>
                                <span class="card-title-text">${
                                  story.name
                                }</span>
                                <div class="card-icon-button">${iconSvg}</div>
                                <div class="add-item-button below" data-add-type="story" data-feature-id="${
                                  feature.id
                                }" data-release-id="${
              release.id
            }" data-before-order="${story.order}" data-after-order="${
              nextStory ? nextStory.order : story.order + 10
            }">+</div>
                             </div>`;
          });
          html += `<div class="empty-column-drop-zone" data-feature-id="${feature.id}" data-release-id="${release.id}"><span>Drop Story Here</span></div>`;
          html += `</div>`;
        });
      }
    });

    // --- 4d. CLOSE HTML TAGS ---
    html += `</div></div>`;
    containerElement.html(html);

    // --- 5. INITIALIZE INTERACTION MODULES ---
    if (window.StoryMapInlineEdit)
      window.StoryMapInlineEdit.init(containerElement[0]);
    if (window.StoryMapJourneyDragDrop)
      window.StoryMapJourneyDragDrop.init(containerElement[0]);
    if (window.StoryMapFeatureDragDrop)
      window.StoryMapFeatureDragDrop.init(containerElement[0]);
    if (window.StoryMapStoryDragDrop)
      window.StoryMapStoryDragDrop.init(containerElement[0]);
    if (window.StoryMapAddItemHandler)
      window.StoryMapAddItemHandler.init(containerElement[0]);
  },
};
