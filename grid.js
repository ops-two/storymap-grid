// The definitive, complete, and final grid.js renderer.

window.StoryMapRenderer = {
  render: function (containerElement) {
    // --- 1. PULL CLEAN DATA FROM THE DATA STORE ---
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const allFeatures = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    // --- 2. PREPARE DATA STRUCTURES ---
    const displayItems = [];
    journeys.forEach((journey) => {
      const journeyFeatures = allFeatures.filter(
        (f) => f.journeyId === journey.id
      );
      if (journeyFeatures.length > 0) {
        displayItems.push(...journeyFeatures);
      } else {
        displayItems.push({ isPlaceholder: true, journey: journey });
      }
    });
    const unassignedFeatures = allFeatures.filter((f) => !f.journeyId);
    displayItems.push(...unassignedFeatures);

    // --- 3. GRID CALCULATION & SVG DEFINITION ---
    const totalColumns = displayItems.length > 0 ? displayItems.length : 1;
    document.documentElement.style.setProperty("--total-columns", totalColumns);
    const iconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 13H8" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17H8" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 9H8" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    // --- 4. HTML GENERATION ---
    const projectTitle = project ? project.name : "Unnamed Project";
    let html = `
        <div class="story-map-container">
            <h2>${projectTitle}</h2>
            <div class="story-map-info">
                <small>Journeys: ${journeys.length} | Features: ${allFeatures.length} | Stories: ${stories.length} | Releases: ${releases.length}</small>
            </div>
            <div class="story-map-grid-container">
    `;

    // --- 4a. RENDER JOURNEYS (ALWAYS RENDERS ALL JOURNEYS CORRECTLY) ---
    journeys.forEach((journey, index) => {
      const journeyFeatures = allFeatures.filter(
        (f) => f.journeyId === journey.id
      );

      if (journeyFeatures.length > 0) {
        // --- CASE 1: Journey has features. This is your proven, working logic. ---
        const featureIndices = journeyFeatures
          .map((f) => displayItems.findIndex((df) => df.id === f.id))
          .filter((i) => i !== -1);
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
          const prevJourney = journeys[index - 1];
          const nextJourney = journeys[index + 1];
          const beforeOrder = prevJourney
            ? prevJourney.order
            : (journey.order || 0) - 20;
          const afterOrder = nextJourney
            ? nextJourney.order
            : (journey.order || 0) + 20;

          html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span};">
                  <div class="add-item-button before" data-add-type="journey" data-before-order="${beforeOrder}" data-after-order="${journey.order}">+</div>
                  <span class="card-title-text">${title}</span>
                  <div class="card-icon-button">${iconSvg}</div>
                  <div class="add-item-button after" data-add-type="journey" data-before-order="${journey.order}" data-after-order="${afterOrder}">+</div>
               </div>`;
        });
      } else {
        // --- CASE 2: Journey is EMPTY. This is the new, corrected logic. ---
        const placeholderIndex = displayItems.findIndex(
          (df) => df.isPlaceholder && df.journey.id === journey.id
        );
        if (placeholderIndex !== -1) {
          const startCol = placeholderIndex + 1;
          const span = 1;

          const prevJourney = journeys[index - 1];
          const nextJourney = journeys[index + 1];
          const beforeOrder = prevJourney
            ? prevJourney.order
            : (journey.order || 0) - 20;
          const afterOrder = nextJourney
            ? nextJourney.order
            : (journey.order || 0) + 20;

          // CRITICAL FIX: It now renders a proper, styled .journey-card
          html += `<div class="card journey-card " data-id="${journey.id}" data-type="journey" data-order="${journey.order}" style="grid-column: ${startCol} / span ${span};">
                    <div class="add-item-button before" data-add-type="journey" data-before-order="${beforeOrder}" data-after-order="${journey.order}">+</div>
                    <span class="card-title-text">${journey.name}</span>
                    <div class="card-icon-button">${iconSvg}</div>
                    <div class="add-item-button after" data-add-type="journey" data-before-order="${journey.order}" data-after-order="${afterOrder}">+</div>
                 </div>`;
        }
      }
    });

    displayItems.forEach((item, index) => {
      if (item.isPlaceholder) {
        html += `<div class="feature-column empty-feature-drop-zone" style="grid-column: ${
          index + 1
        };" data-journey-id="${item.journey.id}">
                <div class="empty-feature-placeholder">
                    <div class="add-item-button-static" data-add-type="feature" data-journey-id="${
                      item.journey.id
                    }" data-before-order="0" data-after-order="20">+ Add Feature</div>
                </div>
             </div>`;
      } else {
        const feature = item;
        const featuresInSameJourney = allFeatures.filter(
          (f) => f.journeyId === feature.journeyId
        );
        const ownIndexInJourney = featuresInSameJourney.findIndex(
          (f) => f.id === feature.id
        );
        const prevFeature =
          ownIndexInJourney > 0
            ? featuresInSameJourney[ownIndexInJourney - 1]
            : null;
        const nextFeature =
          ownIndexInJourney < featuresInSameJourney.length - 1
            ? featuresInSameJourney[ownIndexInJourney + 1]
            : null;
        const beforeOrder = prevFeature
          ? prevFeature.order
          : (feature.order || 0) - 20;
        const afterOrder = nextFeature
          ? nextFeature.order
          : (feature.order || 0) + 20;
        html += `<div class="card feature-card" data-id="${
          feature.id
        }" data-type="feature" data-order="${
          feature.order
        }" style="grid-column: ${index + 1};">
                    <div class="add-item-button before" data-add-type="feature" data-journey-id="${
                      feature.journeyId
                    }" data-before-order="${beforeOrder}" data-after-order="${
          feature.order
        }">+</div>
                    <span class="card-title-text">${feature.name}</span>
                    <div class="card-icon-button">${iconSvg}</div>
                    <div class="add-item-button after" data-add-type="feature" data-journey-id="${
                      feature.journeyId
                    }" data-before-order="${
          feature.order
        }" data-after-order="${afterOrder}">+</div>
                 </div>`;
      }
    });

    // --- 4c. RENDER STORIES AND RELEASES (with Tech-Req Formatting) ---
    const sortedReleasesToRender = releases
      .filter((r) => r && r.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    if (
      unreleasedStories.length > 0 ||
      (stories.length === 0 && releases.length === 0)
    ) {
      html += `<div class="release-header">Unassigned</div>`;
      displayItems.forEach((item, index) => {
        html += `<div class="feature-column" style="grid-column: ${
          index + 1
        };" data-feature-id="${
          item.isPlaceholder ? "" : item.id
        }" data-release-id="unassigned">`;
        if (!item.isPlaceholder) {
          const feature = item;
          const storiesInColumn = unreleasedStories.filter(
            (s) => s.featureId === feature.id
          );
          if (storiesInColumn.length > 0) {
            storiesInColumn.forEach((story, storyIndex) => {
              const prevStory =
                storyIndex > 0 ? storiesInColumn[storyIndex - 1] : null;
              const nextStory =
                storyIndex < storiesInColumn.length - 1
                  ? storiesInColumn[storyIndex + 1]
                  : null;
              const beforeOrder = prevStory
                ? prevStory.order
                : (story.order || 0) - 20;
              const afterOrder = nextStory
                ? nextStory.order
                : (story.order || 0) + 20;

              // --- THIS IS THE CRITICAL UPGRADE ---
              const isTechReq = story.type && story.type === "Tech-Req";
              const titleClass = isTechReq ? "tech-req-title" : ""; // Add a class for Tech-Req titles

              html += `<div class="card story-card ${
                isTechReq ? "tech" : ""
              }" data-id="${story.id}" data-type="story" data-order="${
                story.order
              }">
                      <div class="add-item-button above" data-add-type="story" data-feature-id="${
                        feature.id
                      }" data-release-id="unassigned" data-before-order="${beforeOrder}" data-after-order="${
                story.order
              }">+</div>
                      <span class="card-title-text ${titleClass}">${
                story.name
              }</span>
                      <div class="card-icon-button">${iconSvg}</div>
                      <div class="add-item-button below" data-add-type="story" data-feature-id="${
                        feature.id
                      }" data-release-id="unassigned" data-before-order="${
                story.order
              }" data-after-order="${afterOrder}">+</div>
                   </div>`;
            });
          } else {
            html += `<div class="empty-story-placeholder" data-feature-id="${feature.id}" data-release-id="unassigned">
                    <div class="add-item-button-static" data-add-type="story" data-feature-id="${feature.id}" data-release-id="unassigned" data-before-order="0" data-after-order="20">+ Add Story</div>
                 </div>`;
          }
          html += `<div class="empty-column-drop-zone" data-feature-id="${feature.id}" data-release-id="unassigned"><span>Drop Story Here</span></div>`;
        }
        html += `</div>`;
      });
    }
    sortedReleasesToRender.forEach((release) => {
      const releaseStories = stories.filter((s) => s.releaseId === release.id);
      if (releaseStories.length > 0) {
        html += `<div class="release-header" data-id="${release.id}">${release.name}</div>`;
        displayItems.forEach((item, index) => {
          html += `<div class="feature-column" style="grid-column: ${
            index + 1
          };" data-feature-id="${
            item.isPlaceholder ? "" : item.id
          }" data-release-id="${release.id}">`;
          if (!item.isPlaceholder) {
            const feature = item;
            const storiesInColumn = releaseStories.filter(
              (s) => s.featureId === feature.id
            );
            if (storiesInColumn.length > 0) {
              storiesInColumn.forEach((story, storyIndex) => {
                const prevStory =
                  storyIndex > 0 ? storiesInColumn[storyIndex - 1] : null;
                const nextStory =
                  storyIndex < storiesInColumn.length - 1
                    ? storiesInColumn[storyIndex + 1]
                    : null;
                const beforeOrder = prevStory
                  ? prevStory.order
                  : (story.order || 0) - 20;
                const afterOrder = nextStory
                  ? nextStory.order
                  : (story.order || 0) + 20;

                // --- THIS IS THE CRITICAL UPGRADE ---
                const isTechReq = story.type === "Tech-Req";
                const titleClass = isTechReq ? "tech-req-title" : "";

                html += `<div class="card story-card ${
                  isTechReq ? "tech" : ""
                }" data-id="${story.id}" data-type="story" data-order="${
                  story.order
                }">
                        <div class="add-item-button above" data-add-type="story" data-feature-id="${
                          feature.id
                        }" data-release-id="${
                  release.id
                }" data-before-order="${beforeOrder}" data-after-order="${
                  story.order
                }">+</div>
                        <span class="card-title-text ${titleClass}">${
                  story.name
                }</span>
                        <div class="card-icon-button">${iconSvg}</div>
                        <div class="add-item-button below" data-add-type="story" data-feature-id="${
                          feature.id
                        }" data-release-id="${release.id}" data-before-order="${
                  story.order
                }" data-after-order="${afterOrder}">+</div>
                     </div>`;
              });
            } else {
              html += `<div class="empty-story-placeholder" data-feature-id="${feature.id}" data-release-id="${release.id}">
                      <div class="add-item-button-static" data-add-type="story" data-feature-id="${feature.id}" data-release-id="${release.id}" data-before-order="0" data-after-order="20">+ Add Story</div>
                   </div>`;
            }
            html += `<div class="empty-column-drop-zone" data-feature-id="${feature.id}" data-release-id="${release.id}"><span>Drop Story Here</span></div>`;
          }
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
