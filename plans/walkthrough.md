# Walkthrough - Road Rash "Trash Mode" Final Version

I have completed the development of the Road Rash inspired racing game, fully optimized for GitHub Pages.

## Project Overview
The game is a retro-style pseudo-3D racer where you navigate a motorcycle through a winding, hilly road.

## Key Features Implemented

### 1. Pseudo-3D Racing Engine
- **Segment-Based Road**: Smooth curves and hills using mathematical easing functions.
- **3D Projection**: Real-time transformation of world coordinates to screen space.
- **Dynamic Physics**: Acceleration, braking, and steering with speed-dependent sensitivity.

### 2. High-Quality Retro Assets
- **Generated Graphics**: Unique 16-bit pixel art for the player bike, background scenery, and road obstacles.
- **Sprite System**: Automated scaling and positioning of 2D sprites in the 3D world.
- **Parallax Background**: Multi-layer background that responds to steering and speed.

### 3. Gameplay Mechanics (Trash Mode)
- **Health System**: Collisions with cars and pedestrians reduce health. Game over at 0%.
- **Scoring System**: Points are earned for speed and hitting "Trash Bags".
- **Dynamic Obstacles**: Pedestrians walk across the road, creating a more challenging experience.
- **Game Over Loop**: Full cycle from Start to Game Over with stats display and restart capability.

### 4. Git & GitHub Configuration
- **Initialized Git**: Local repository set up and initial commit made.
- **Remote Origin**: Added `git@github.com:Franklin2412/bike-race.git`.
- **README & .gitignore**: Added project documentation and clean repository setup.

## Visual Progress

````carousel
![Bike Spritesheet](file:///C:/Users/damer/.gemini/antigravity/brain/32edc522-336f-4de6-b537-911a705661f7/bike_spritesheet_1766847053272.png)
<!-- slide -->
![Background Scenery](file:///C:/Users/damer/.gemini/antigravity/brain/32edc522-336f-4de6-b537-911a705661f7/background_scenery_1766847073396.png)
<!-- slide -->
![Obstacle Sprites](file:///C:/Users/damer/.gemini/antigravity/brain/32edc522-336f-4de6-b537-911a705661f7/obstacle_sprites_1766847090359.png)
````

## Final Project Structure
```
/bike-race
  /images
    - bike.png
    - background.png
    - obstacles.png
  /plans
    - implementation_plan.md
    - task.md
    - walkthrough.md
  - index.html
  - style.css
  - main.js
  - README.md
  - .gitignore
```

## How to Play
1. **Open `index.html`** in any modern web browser.
2. **Click "START RACE"**.
3. **Avoid cars and people** to stay alive.
4. **Hit trash bags** for bonus points!
