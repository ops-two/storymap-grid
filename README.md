# Bubble Story Map Plugin - Grid Layout Files

This repository contains the CSS and JavaScript files for the Bubble.io Story Map Visualizer plugin's grid layout implementation.

## Files

- **grid.css**: Styling for the story map grid layout, including:
  - CSS Grid layout for hierarchical visualization
  - Card styles for journeys, features, stories, personas, and releases
  - Responsive design with CSS variables
  
- **grid.js**: JavaScript rendering engine that:
  - Transforms Bubble data into clean JavaScript objects
  - Calculates grid layout for proper hierarchical alignment
  - Generates HTML markup for the story map visualization
  - Handles dynamic column sizing based on features

## Usage

These files are hosted on Bubble's CDN and loaded into the plugin via the headers.txt file. They work together with the plugin's update.txt controller to create a dynamic story map visualization.

## Architecture

The plugin follows a modular architecture:
- `update.txt` (in Bubble) - Data loading and event handling
- `grid.js` - Rendering logic and HTML generation
- `grid.css` - Visual styling and layout

This separation allows for easy maintenance and updates without modifying the core Bubble plugin code.
