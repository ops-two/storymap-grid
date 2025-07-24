window.StoryMapRenderer = {
  render: function (containerElement) {
    // --- 1. PULL CLEAN DATA FROM THE DATA STORE ---
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const features = window.StoryMapDataStore.getEntitiesArray("feature");
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");

    const projectTitle = project ? project.name : "Unnamed Project";
    let html = `
        <div class="story-map-container">
            <h2>${projectTitle}</h2>
            <div class="story-map-info">
                <small>Journeys: ${journeys.length} | Features: ${features.length} | Stories: ${stories.length} | Releases: ${releases.length}</small>
            </div>
            <div class="story-map-content">
    `;

    // --- 2. RENDER THE BOARD GROUPED BY RELEASES ---

    // First, render stories NOT in any release
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    if (unreleasedStories.length > 0) {
      html += `<div class="release-group">`;
      html += `<div class="release-header">Unassigned</div>`;
      html += `<div class="journeys-container">`; // Container for all journeys in this release

      journeys.forEach((journey) => {
        const featuresInJourney = features.filter(
          (f) => f.journeyId === journey.id
        );
        const storiesInJourneyAndRelease = unreleasedStories.filter((s) =>
          featuresInJourney.some((f) => f.id === s.featureId)
        );

        // Only render the journey if it has stories in this release
        if (storiesInJourneyAndRelease.length > 0) {
          html += `<div class="journey-group">`;
          html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey">${journey.name}</div>`;
          html += `<div class="features-container">`;

          featuresInJourney.forEach((feature) => {
            const storiesInFeature = unreleasedStories.filter(
              (s) => s.featureId === feature.id
            );
            if (storiesInFeature.length > 0) {
              html += `<div class="feature-group">`;
              html += `<div class="card feature-card" data-id="${feature.id}" data-type="feature">${feature.name}</div>`;
              html += `<div class="stories-container">`;
              storiesInFeature.forEach((story) => {
                const cardTypeClass =
                  story.type === "Tech-Req" ? "tech" : "story";
                html += `<div class="card story-card ${cardTypeClass}" data-id="${story.id}" data-type="story">${story.name}</div>`;
              });
              html += `</div></div>`; // Close stories-container & feature-group
            }
          });
          html += `</div></div>`; // Close features-container & journey-group
        }
      });
      html += `</div></div>`; // Close journeys-container & release-group
    }

    // Then, loop through each release
    releases.forEach((release) => {
      const storiesInRelease = stories.filter(
        (s) => s.releaseId === release.id
      );
      if (storiesInRelease.length === 0) return; // Skip empty releases

      html += `<div class="release-group">`;
      html += `<div class="release-header">${release.name}</div>`;
      html += `<div class="journeys-container">`;

      journeys.forEach((journey) => {
        const featuresInJourney = features.filter(
          (f) => f.journeyId === journey.id
        );
        const storiesInJourneyAndRelease = storiesInRelease.filter((s) =>
          featuresInJourney.some((f) => f.id === s.featureId)
        );

        if (storiesInJourneyAndRelease.length > 0) {
          html += `<div class="journey-group">`;
          html += `<div class="card journey-card" data-id="${journey.id}" data-type="journey">${journey.name}</div>`;
          html += `<div class="features-container">`;

          featuresInJourney.forEach((feature) => {
            const storiesInFeature = storiesInRelease.filter(
              (s) => s.featureId === feature.id
            );
            if (storiesInFeature.length > 0) {
              html += `<div class="feature-group">`;
              html += `<div class="card feature-card" data-id="${feature.id}" data-type="feature">${feature.name}</div>`;
              html += `<div class="stories-container">`;
              storiesInFeature.forEach((story) => {
                const cardTypeClass =
                  story.type === "Tech-Req" ? "tech" : "story";
                html += `<div class="card story-card ${cardTypeClass}" data-id="${story.id}" data-type="story">${story.name}</div>`;
              });
              html += `</div></div>`;
            }
          });
          html += `</div></div>`;
        }
      });
      html += `</div></div>`;
    });

    html += `</div></div>`;
    containerElement.html(html);
  },
};
