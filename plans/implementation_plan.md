# Implementation Plan - Road Rash Web Game (GitHub Pages Ready)

Create a retro-style pseudo-3D racing game inspired by Road Rash, playable in the browser and optimized for GitHub Pages.

## Proposed Changes

### GitHub Pages Compatibility
- Ensure all asset references (images, audio, scripts) use relative paths.
- Avoid absolute URLs or root-level leading slashes (e.g., use `assets/image.png` instead of `/assets/image.png`).
- [NEW] Add a GitHub Action `.github/workflows/deploy.yml` to support automated deployments if needed, or simply confirm the manual push workflow.
- Ensure the build is purely static (HTML/CSS/JS).

### Sprites & Assets
- Implement a `Sprite` class to handle rendering and scaling of 2D sprites in the 3D world.
- **Player Bike**: Use multiple frames for leaning (left, mid, right) and straight movement.
- **Obstacles**: 
    - Cars (moving at varying speeds).
    - Trash/Debris (static on the road).
    - Pedestrians (crossing).
- [NEW] Asset Loader: A simple utility to load image assets before starting the game loop.

### Gameplay & "Trash Mode" Logic
- **Dynamic Obstacles**:
    - **Cars**: Implement a `speed` property for car sprites so they move along the road.
    - **Pedestrians**: Implement side-to-side movement across the lanes.
- **Health System**:
    - Initialize `health` (e.g., 100%).
    - Collisions with Cars/People reduce health.
    - Game Over when health reach 0.
- **Scoring & "Trash Mode"**:
    - "Trash Bags" are collectable/hittable for points (Bonus points).
    - Distance also contributes to score.
    - Track "Trash Smashed" count.
- **HUD Update**:
    - Add Health bar.
    - Add Score display.
    - Add "Trash Mode" stats (Trash Smashed).

### Visuals
- **Parallax Background**: Add layers for mountains, hills, and sky that move at different speeds relative to steering and speed.
- **HUD**: Improve the speedometer and add a distance/progress bar.

## Verification Plan

### Manual Verification
- Verify sprite scaling as they move towards the camera.
- Test collision accuracy with different obstacle types.
- Ensure parallax background moves correctly with steering and speed.
