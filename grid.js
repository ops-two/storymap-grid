// The definitive, complete, and non-redundant grid.js renderer

window.StoryMapRenderer = {
  // In grid.js, replace ONLY the render function for this test

  render: function (containerElement) {
    console.log(
      "%c--- RENDERER DEBUG: INITIATED ---",
      "color: #ff00ff; font-weight: bold;"
    );

    // --- 1. DATA PULL ---
    const stories = window.StoryMapDataStore.getEntitiesArray("story");
    const releases = window.StoryMapDataStore.getEntitiesArray("release");
    console.log(
      `STEP 1: Data Store returned ${stories.length} stories and ${releases.length} releases.`
    );
    console.log("Full Release Data from Store:", releases);

    // ... (All the other data pulling and feature sorting is correct) ...
    const project = window.StoryMapDataStore.data.project;
    const journeys = window.StoryMapDataStore.getEntitiesArray("journey");
    const allFeatures = window.StoryMapDataStore.getEntitiesArray("feature");
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
    const totalColumns = features.length > 0 ? features.length : 1;
    document.documentElement.style.setProperty("--total-columns", totalColumns);
    const iconSvg = `<svg>...</svg>`; // Abridged for clarity
    let html = `...`; // Abridged for clarity

    // --- 4c. RENDER STORIES AND RELEASES (THE DEBUG SECTION) ---
    const unreleasedStories = stories.filter((s) => !s.releaseId);
    console.log(
      `STEP 2: Found ${unreleasedStories.length} unassigned stories.`
    );
    // ... (The Unassigned rendering logic is likely correct, so we'll skip its logs) ...

    // --- THIS IS THE MOST CRITICAL PART ---
    console.log(
      "%c--- DEBUGGING THE RELEASE LOOP ---",
      "color: #00aaff; font-weight: bold;"
    );

    const storiesWithReleases = stories.filter((s) => s.releaseId);
    console.log(
      `STEP 3: Found ${storiesWithReleases.length} stories that have a releaseId.`
    );

    const uniqueReleaseIds = [
      ...new Set(storiesWithReleases.map((s) => s.releaseId)),
    ];
    console.log(
      "STEP 4: The unique release IDs found on the stories are:",
      uniqueReleaseIds
    );

    const mappedReleases = uniqueReleaseIds.map((id) => {
      const release = window.StoryMapDataStore.getEntity("release", id);
      console.log(`  - Mapping ID ${id} to Release Object:`, release);
      return release;
    });
    console.log(
      "STEP 5: The full release objects mapped from the IDs:",
      mappedReleases
    );

    const filteredReleases = mappedReleases.filter((r) => r && r.name);
    console.log(
      "STEP 6: The release objects AFTER filtering out nulls/unnamed:",
      filteredReleases
    );

    const sortedReleasesToRender = filteredReleases.sort(
      (a, b) => (a.targetDate || 0) - (b.targetDate || 0)
    );
    console.log(
      "STEP 7: The final, sorted list of releases to be rendered is:"
    );
    console.table(sortedReleasesToRender);

    if (sortedReleasesToRender.length === 0) {
      console.error(
        "CRITICAL FAILURE: After all filtering, there are 0 releases to render. The loop will not run."
      );
    }

    sortedReleasesToRender.forEach((release) => {
      console.log(
        `%cRendering section for RELEASE: ${release.name}`,
        "color: green;"
      );
      // ... (The rest of the rendering logic) ...
    });

    console.log("--- RENDERER DEBUGGING COMPLETE ---");

    // ... (The rest of the function remains the same) ...
  },
};
