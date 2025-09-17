# 0.0.11a - Rebuild For web

-The
-This project now uses proper ES6 module imports with a clean folder structure.

## Project Structure

```
src/
├── RubyDung.js           # Main entry point and game class
├── LibHandler.js         # Three.js library handler
├── Player.js             # Player class
├── Entity.js             # Base entity class
├── PlaceHandler.js       # Block placement logic
├── Sound.js              # Audio handling
├── config.js             # Game configuration
├── chat.js               # Chat system
├── AABB/                 # Collision detection
│   └── AABB.js
├── character/            # Character-related classes
│   ├── Zombie.js
│   ├── ZombieModel.js
│   └── animation.js
├── level/                # World and level generation
│   ├── World.js
│   ├── NoiseGenerator.js
│   └── gen/
│       ├── NoiseGenerator.js
│       └── worldGeneratorWorker.js
├── render/               # Rendering and graphics
│   ├── Tile.js
│   ├── font.js
│   ├── Cube.js
│   ├── Bush.js
│   ├── BlockColorSystem.js
│   ├── VersionRenderer.js
│   └── particle/
│       ├── Particle.js
│       └── ParticleEngine.js
└── lib/                  # External libraries
    ├── three.js          # Local Three.js library
    ├── three.core.min.js
    └── utils/
        └── BufferGeometryUtils.js
```

## Import Structure

All imports now use proper relative paths:

- **RubyDung.js** serves as the main gateway and imports from all folders
- Files in subfolders use `../` to import from parent directories
- Files in the same folder use `./` for relative imports
- All Three.js imports go through `LibHandler.js` for consistency

## Key Changes Made

1. **Fixed import paths** in all JavaScript files to use correct relative paths
2. **Updated package.json** to use `"type": "module"` for ES6 module support
3. **Centralized Three.js imports** through LibHandler.js
4. **Fixed Three.js library imports** in RGBELoader.js, GLTFLoader.js, and BufferGeometryUtils.js
5. **Enhanced LibHandler.js** to export individual THREE components for library compatibility
6. **Organized imports** by functionality (core, entities, rendering, world)

## How to Run

1. Start a local HTTP server:
   ```bash
   python -m http.server 8000
   ```

2. Open one of these files in your browser:
   - `http://localhost:8000/index.html` - Main launcher
   - `http://localhost:8000/MAIN.html` - Direct game access
   - `http://localhost:8000/FS.html` - Fullscreen mode
(OR JUST GO TO THE NETLIFY LINK AND PICK A URL) 
## Three.js Library Configuration

### LibHandler.js Features:
- Exports the complete THREE object
- Exports individual THREE components for library compatibility
- Provides async loaders for RGBELoader and GLTFLoader
- Single source of truth for Three.js imports

## Summary

The game uses pure ES6 modules without any build tools:
- No Babel transpilation needed
- No Webpack bundling required
- Uses local Three.js library (no external CDN dependencies)
- All imports are resolved at runtime by the browser
- Also built off of original java code
