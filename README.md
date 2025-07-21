# Bubble Story Map Plugin - Grid Layout Files

This repository contains the CSS and JavaScript files for the Bubble.io Story Map Visualizer plugin's grid layout implementation.

## Architecture Overview

The plugin follows a modular architecture designed to work within Bubble's constraints:

### Core Files

#### 1. **data-store.js** - Centralized Data Management
- **Purpose**: Maintains a single source of truth for all entity data
- **Key Functions**:
  - `init()`: Initializes store with Bubble's raw data
  - `updateEntity()`: Updates specific entity fields locally
  - `getEntityForUpdate()`: Returns entity data in expected update format (entityId, name_text, order_index)
- **Why Needed**: Prevents data loss during drag-drop operations by maintaining full entity state

#### 2. **grid.js** - Rendering Engine
- **Purpose**: Transforms Bubble data into visual story map grid
- **Key Functions**:
  - `render()`: Main entry point, processes all entities
  - `transformData()`: Converts Bubble's list format to structured objects
  - `calculateLayout()`: Determines grid dimensions and positions
  - `generateHTML()`: Creates DOM elements for the grid
- **Features**:
  - Dynamic column calculation based on features
  - Hierarchical alignment of journeys → features → stories
  - Personas and releases in separate rows

#### 3. **event-bridge.js** - Bubble Communication Layer
- **Purpose**: Handles all events between the plugin and Bubble workflows
- **Key Functions**:
  - `init()`: Stores Bubble instance reference
  - `handleUpdate()`: Processes entity updates
  - `handleAdd()`: Handles new entity creation
  - `handleReorder()`: Manages drag-drop reordering
- **Events Published**:
  - `journey_updated`, `feature_updated`, `story_updated`
  - `pending_update` state with JSON payload

#### 4. **inline-edit.js** - In-place Editing
- **Purpose**: Enables direct text editing of entity names
- **Key Functions**:
  - `makeEditable()`: Converts text to input field
  - `handleSave()`: Validates and saves changes
  - `gatherEntityData()`: Collects full entity data for updates
- **Integration**: Uses data store for consistent updates

#### 5. **journey-drag-drop.js** - Drag and Drop Functionality
- **Purpose**: Allows reordering of journey cards
- **Key Functions**:
  - `handleDragStart()`: Captures dragged journey data
  - `handleDrop()`: Calculates new order and updates
  - `calculateOrderValue()`: Determines precise positioning using decimal values
- **Features**:
  - Debouncing to prevent race conditions
  - Visual feedback during drag operations
  - Preserves journey names during reorder

#### 6. **grid.css** - Visual Styling
- **Key Features**:
  - CSS Grid layout with dynamic columns
  - Card styling for different entity types
  - Drag-drop visual states
  - Scrollable container for large maps
  - CSS variables for easy customization

## Bubble Plugin Integration

### Plugin Files (in Bubble Editor)

1. **headers.txt**: Loads all JavaScript and CSS files via jsDelivr CDN
2. **update.txt**: Main controller that:
   - Loads data from Bubble properties
   - Initializes all modules
   - Handles Bubble's async data loading
   - Publishes state changes

### Bubble Constraints & Solutions

1. **Fixed Element Size**: Bubble plugins require fixed dimensions
   - Solution: Use `overflow: auto` for scrolling
   - Grid uses `min-width: fit-content` to expand naturally

2. **Async Data Loading**: Bubble loads data asynchronously
   - Solution: Try-catch with 'not ready' error handling
   - Load-first, mutate-last pattern

3. **Data Format**: Bubble uses specific field naming
   - Example: `order_index_number` in Bubble → `order_index` for updates
   - Solution: Data transformation in `getEntityForUpdate()`

4. **State Management**: Plugin re-renders on data changes
   - Solution: Data store re-initializes with fresh data
   - Trade-off: Local unsaved changes are lost (acceptable)

## Update Data Format

All updates must include exactly three fields:
```javascript
{
  entityId: "journey_123",
  name_text: "User Journey Name", 
  order_index: 1.5  // Can be decimal for precise positioning
}
```

## Event Flow

1. User Action (drag/edit) → 
2. JavaScript handler → 
3. Data store update → 
4. Event dispatch → 
5. Event bridge → 
6. Bubble workflow trigger

## Key Implementation Details

### Drag-Drop Name Preservation
- Bug Fix: Changed selector from `.journey-title` to `.card-title`
- Stores journey data at drag start to prevent null references
- Sends full entity data to prevent field overwrites

### Order Index Calculation
- Uses decimal values for precise positioning
- Supports negative values for edge cases
- Calculates midpoint between adjacent items

### Concurrency Control
- 300ms debounce on drag operations
- `isProcessing` flag prevents overlapping updates
- Drag state cleared only after completion

## CDN Deployment

Files are served via jsDelivr with commit-specific URLs:
```
https://cdn.jsdelivr.net/gh/ops-two/storymap-grid@{commit}/file.js
```

Update commit hash in headers.txt after pushing changes.

## Development Workflow

1. Edit files locally
2. Test changes
3. Commit and push to GitHub
4. Update commit hash in headers.txt
5. Update plugin version in Bubble editor
6. Test in Bubble application

## Debugging Tips

- Console logs are minimized to critical events only
- Check browser console for update payloads
- Verify CDN URLs are using latest commit
- Clear browser cache if changes don't appear
- Check Bubble workflows receive correct data format
