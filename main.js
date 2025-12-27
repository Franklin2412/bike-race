// Road Rash - Core Engine

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const FPS = 60;
const STEP = 1 / FPS;
const WIDTH = 1024;
const HEIGHT = 768;
const ROAD_WIDTH = 2000;
const SEGMENT_LENGTH = 200;
const RUMBLE_LENGTH = 3;
const LANES = 3;
const FIELD_OF_VIEW = 100;
const CAMERA_HEIGHT = 1000;
const CAMERA_DEPTH = 1 / Math.tan((FIELD_OF_VIEW / 2) * Math.PI / 180);
const DRAW_DISTANCE = 300;
const FOG_DENSITY = 5;

// Colors
const COLORS = {
    SKY: '#72D7EE',
    TREE: '#005108',
    FOG: '#005108',
    LIGHT: { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC' },
    DARK: { road: '#696969', grass: '#009A00', rumble: '#BBBBBB' },
    START: { road: 'white', grass: 'white', rumble: 'white' },
    FINISH: { road: 'black', grass: 'black', rumble: 'black' }
};

// Background layers
const BACKGROUND = {
    SKY: { x: 0, y: 0, w: 1024, h: 768 },
    HILLS: { x: 0, y: 0, w: 1024, h: 768 },
    MOUNTAINS: { x: 0, y: 0, w: 1024, h: 768 }
};

// Assets
const IMAGES = {
    background: { src: 'images/background.png', img: null },
    bike: { src: 'images/bike.png', img: null },
    obstacles: { src: 'images/obstacles.png', img: null }
};

function loadImages(onComplete) {
    let count = Object.keys(IMAGES).length;
    for (let key in IMAGES) {
        let asset = IMAGES[key];
        asset.img = new Image();
        asset.img.onload = () => { if (--count === 0) onComplete(); };
        asset.img.src = asset.src;
    }
}

// Game State
let playerX = 0;
let position = 0;
let speed = 0;
let maxSpeed = SEGMENT_LENGTH / STEP;
let accel = maxSpeed / 5;
let breaking = -maxSpeed;
let decel = -maxSpeed / 5;
let offRoadDecel = -maxSpeed / 2;
let offRoadLimit = maxSpeed / 4;

let health = 100;
let score = 0;
let trashSmashed = 0;
let gameState = 'START';

// Road State
let segments = [];
let trackLength = 0;

// Project 3D to 2D
function project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;
    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
    p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
    p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
}

// Draw Segment
function segment(ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {
    let r1 = rumbleWidth(w1, lanes),
        r2 = rumbleWidth(w2, lanes),
        l1 = laneMarkerWidth(w1, lanes),
        l2 = laneMarkerWidth(w2, lanes),
        lanew1, lanew2, lanex1, lanex2, lane;

    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);

    polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
    polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
    polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

    if (color.lane) {
        lanew1 = w1 * 2 / lanes;
        lanew2 = w2 * 2 / lanes;
        lanex1 = x1 - w1 + lanew1;
        lanex2 = x2 - w2 + lanew2;
        for (lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++)
            polygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
    }

    fogRect(ctx, 0, y2, width, y1 - y2, fog);
}

function polygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
}

function rumbleWidth(projectedRoadWidth, lanes) { return projectedRoadWidth / Math.max(6, 2 * lanes); }
function laneMarkerWidth(projectedRoadWidth, lanes) { return projectedRoadWidth / Math.max(32, 8 * lanes); }

function fogRect(ctx, x, y, w, h, fog) {
    if (fog < 1) {
        ctx.globalAlpha = (1 - fog);
        ctx.fillStyle = COLORS.FOG;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
    }
}

// Parallax positions
let skyOffset = 0;
let hillOffset = 0;
let treeOffset = 0;

// Sprite helper
function renderSprite(ctx, width, height, resolution, roadWidth, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
    let destW = (sprite.w * scale * width / 2) * (ROAD_WIDTH / roadWidth);
    let destH = (sprite.h * scale * width / 2) * (ROAD_WIDTH / roadWidth);

    destX = destX + (destW * (offsetX || 0));
    destY = destY + (destH * (offsetY || 0));

    let clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
    if (clipH < destH)
        ctx.drawImage(sprite.img, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX, destY, destW, destH - clipH);
}

// Background rendering
function renderBackground(ctx, background, width, height, rotation, offset) {
    rotation = rotation || 0;
    offset = offset || 0;

    let image = background.img;
    let sw = image.width / 4;
    let sh = image.height;
    let dw = width;
    let dh = height;

    let x = (offset * width) % dw;
    if (x < 0) x += dw;

    ctx.drawImage(image, 0, 0, sw, sh, -x, 0, dw, dh);
    ctx.drawImage(image, 0, 0, sw, sh, dw - x, 0, dw, dh);
}

// Road Generation Helpers
function lastY() { return (segments.length == 0) ? 0 : segments[segments.length - 1].p2.world.y; }

function addSegment(curve, y) {
    let n = segments.length;
    segments.push({
        index: n,
        p1: { world: { y: lastY(), z: n * SEGMENT_LENGTH }, camera: {}, screen: {} },
        p2: { world: { y: y, z: (n + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
        curve: curve,
        sprites: [],
        color: Math.floor(n / RUMBLE_LENGTH) % 2 ? COLORS.DARK : COLORS.LIGHT
    });
}

function addSprite(n, sprite, offset) {
    segments[n].sprites.push({ source: sprite, offset: offset });
}

function addRoad(enter, hold, leave, curve, v) {
    let startY = lastY();
    let endY = startY + (Math.floor(v) * SEGMENT_LENGTH);
    let n, total = enter + hold + leave;
    for (n = 0; n < enter; n++)
        addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
    for (n = 0; n < hold; n++)
        addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
    for (n = 0; n < leave; n++)
        addSegment(easeIn(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
}

function addStraight(num) {
    num = num || 200;
    addRoad(num, num, num, 0, 0);
}

function addCurve(num, curve) {
    num = num || 200;
    curve = curve || 0.1;
    addRoad(num, num, num, curve, 0);
}

function addHill(num, height) {
    num = num || 200;
    height = height || 0;
    addRoad(num, num, num, 0, height);
}

function easeIn(a, b, percent) { return a + (b - a) * Math.pow(percent, 2); }
function easeOut(a, b, percent) { return a + (b - a) * (1 - Math.pow(1 - percent, 2)); }
function easeInOut(a, b, percent) { return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5); }

// Constants for sprites (based on generated assets)
const SPRITES = {
    TRASH: { x: 420, y: 450, w: 200, h: 180 }, // Approximate coordinates from obstacle_sprites
    CAR: { x: 60, y: 400, w: 300, h: 200 },
    PERSON: { x: 780, y: 370, w: 150, h: 260 },
    BIKE_STRAIGHT: { x: 400, y: 340, w: 220, h: 350 },
    BIKE_LEFT: { x: 200, y: 340, w: 220, h: 350 },
    BIKE_HARD_LEFT: { x: 0, y: 340, w: 220, h: 350 },
    BIKE_RIGHT: { x: 600, y: 340, w: 220, h: 350 },
    BIKE_HARD_RIGHT: { x: 800, y: 340, w: 220, h: 350 }
};

// Reset Road
function resetRoad() {
    segments = [];
    health = 100;
    score = 0;
    trashSmashed = 0;
    position = 0;
    speed = 0;
    playerX = 0;

    addStraight(25);
    addCurve(100, 2);
    addHill(50, 20);
    addCurve(100, -2);
    addHill(50, -20);
    addCurve(100, 3);
    addStraight(25);
    addCurve(100, -3);
    addHill(100, 40);
    addStraight(100);

    // Add random obstacles
    for (let n = 20; n < segments.length - 100; n += 10) {
        let type = Math.random();
        if (type < 0.4) addSprite(n, { img: IMAGES.obstacles.img, ...SPRITES.TRASH }, Math.random() * 2 - 1);
        else if (type < 0.7) addSprite(n, { img: IMAGES.obstacles.img, ...SPRITES.CAR }, Math.random() < 0.5 ? 0.6 : -0.6);
        else if (type < 0.9) addSprite(n, { img: IMAGES.obstacles.img, ...SPRITES.PERSON }, Math.random() < 0.5 ? 1.1 : -1.1);
    }

    segments[findSegment(playerX).index + 2].color = COLORS.START;
    segments[findSegment(playerX).index + 3].color = COLORS.START;

    for (let n = 0; n < RUMBLE_LENGTH; n++)
        segments[segments.length - 1 - n].color = COLORS.FINISH;

    trackLength = segments.length * SEGMENT_LENGTH;
}

function findSegment(z) {
    return segments[Math.floor(z / SEGMENT_LENGTH) % segments.length];
}

// Input Handlers
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// Start/Restart Handlers
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    resetRoad();
    gameState = 'PLAYING';
});

function startGame() {
    resetRoad();
    gameState = 'PLAYING';
    frame();
}

function update(dt) {
    if (gameState !== 'PLAYING') return;

    let playerSegment = findSegment(position + CAMERA_HEIGHT);
    let speedPercent = speed / maxSpeed;

    // Update Position
    position = (position + speed * dt);
    while (position >= trackLength) position -= trackLength;
    while (position < 0) position += trackLength;

    // Update Speed
    if (keys.up)
        speed = Math.min(speed + accel * dt, maxSpeed);
    else if (keys.down)
        speed = Math.max(speed + breaking * dt, 0);
    else
        speed = Math.max(speed + decel * dt, 0);

    // Update Player X (Steering)
    if (keys.left)
        playerX = playerX - (dt * 3 * speedPercent);
    else if (keys.right)
        playerX = playerX + (dt * 3 * speedPercent);

    // Handle curves
    playerX = playerX - (dt * 3 * speedPercent * playerSegment.curve);

    // Off-road penalty
    if (((playerX < -1) || (playerX > 1)) && (speed > offRoadLimit))
        speed = Math.max(speed + offRoadDecel * dt, offRoadLimit);

    // Update Sprites (Movement & Animation)
    for (let n = 0; n < segments.length; n++) {
        let seg = segments[n];
        for (let i = 0; i < seg.sprites.length; i++) {
            let s = seg.sprites[i];
            if (s.source.speed) {
                // Moving car logic: just move forward in segments
                // Simplified: we'll just let them be for now or move them slowly
                // Actually let's move them relative to world z
            }
            if (s.source.walking) {
                s.offset += Math.sin(position / 500) * 0.02; // Simple walking effect
            }
        }
    }

    // Collision Detection
    for (let i = 0; i < playerSegment.sprites.length; i++) {
        let sprite = playerSegment.sprites[i];
        let spriteW = sprite.source.w / 500; // Adjust for collision box
        if (Math.abs(playerX - sprite.offset) < spriteW) {
            if (sprite.source.collectible) {
                // Trash hit - Bonus!
                trashSmashed++;
                score += 500;
                playerSegment.sprites.splice(i, 1); // Remove trash bag
            } else {
                // Obstacle hit - Penalty!
                speed = 200;
                health -= 10;
                position -= 50; // Bump back
                if (health <= 0) gameOver();
            }
            break;
        }
    }

    // Score based on distance/speed
    score += Math.round(speed / 100);

    // Update Background Offset
    skyOffset = skyOffset - (playerSegment.curve * speedPercent * 0.01);

    // Clamp playerX
    playerX = Math.max(-3, Math.min(3, playerX));

    // Update UI
    document.getElementById('speed').innerText = Math.round(speed / 100);
    document.getElementById('health').innerText = Math.max(0, health);
    document.getElementById('score').innerText = score;
    document.getElementById('trash').innerText = trashSmashed;
}

function gameOver() {
    gameState = 'GAME_OVER';
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('final-stats').innerText = `You smashed ${trashSmashed} trash bags and scored ${score} points!`;
}

function render() {
    let baseSegment = findSegment(position);
    let basePercent = (position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
    let playerSegment = findSegment(position + CAMERA_HEIGHT);
    let playerPercent = ((position + CAMERA_HEIGHT) % SEGMENT_LENGTH) / SEGMENT_LENGTH;
    let playerY = easeInOut(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
    let maxy = HEIGHT;
    let x = 0;
    let dx = - (baseSegment.curve * basePercent);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw Background
    renderBackground(ctx, IMAGES.background, WIDTH, HEIGHT, 0, skyOffset);

    // Draw Road Segments
    for (let n = 0; n < DRAW_DISTANCE; n++) {
        let segment = segments[(baseSegment.index + n) % segments.length];
        segment.looped = segment.index < baseSegment.index;
        segment.fog = 1 - Math.max(0, (DRAW_DISTANCE - n) / DRAW_DISTANCE);

        project(segment.p1, playerX * ROAD_WIDTH - x, CAMERA_HEIGHT + playerY, position - (segment.looped ? trackLength : 0), CAMERA_DEPTH, WIDTH, HEIGHT, ROAD_WIDTH);
        project(segment.p2, playerX * ROAD_WIDTH - x - dx, CAMERA_HEIGHT + playerY, position - (segment.looped ? trackLength : 0), CAMERA_DEPTH, WIDTH, HEIGHT, ROAD_WIDTH);

        x = x + dx;
        dx = dx + segment.curve;

        if ((segment.p1.camera.z <= CAMERA_DEPTH) || (segment.p2.screen.y >= segment.p1.screen.y) || (segment.p2.screen.y >= maxy))
            continue;

        renderSegment(ctx, WIDTH, LANES,
            segment.p1.screen.x,
            segment.p1.screen.y,
            segment.p1.screen.w,
            segment.p2.screen.x,
            segment.p2.screen.y,
            segment.p2.screen.w,
            segment.fog,
            segment.color);

        maxy = segment.p2.screen.y;
    }

    // Draw Road Sprites (backwards to draw closest last)
    for (let n = DRAW_DISTANCE - 1; n > 0; n--) {
        let segment = segments[(baseSegment.index + n) % segments.length];
        for (let i = 0; i < segment.sprites.length; i++) {
            let sprite = segment.sprites[i];
            let spriteX = segment.p1.screen.x + (segment.p1.screen.w * sprite.offset);
            renderSprite(ctx, WIDTH, HEIGHT, 1, ROAD_WIDTH, sprite.source, segment.p1.screen.scale, spriteX, segment.p1.screen.y, (sprite.offset < 0 ? -1 : 0), -1);
        }
    }

    // Draw Player Bike
    let bikeSprite = SPRITES.BIKE_STRAIGHT;
    if (keys.left) bikeSprite = playerX < -1.5 ? SPRITES.BIKE_HARD_LEFT : SPRITES.BIKE_LEFT;
    else if (keys.right) bikeSprite = playerX > 1.5 ? SPRITES.BIKE_HARD_RIGHT : SPRITES.BIKE_RIGHT;

    renderSprite(ctx, WIDTH, HEIGHT, 1, ROAD_WIDTH, { img: IMAGES.bike.img, ...bikeSprite }, CAMERA_DEPTH / CAMERA_HEIGHT, WIDTH / 2, HEIGHT, -0.5, -1);
}

function renderSegment(ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {
    let r1 = rumbleWidth(w1, lanes),
        r2 = rumbleWidth(w2, lanes),
        l1 = laneMarkerWidth(w1, lanes),
        l2 = laneMarkerWidth(w2, lanes),
        lanew1, lanew2, lanex1, lanex2, lane;

    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);

    polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
    polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
    polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

    if (color.lane) {
        lanew1 = w1 * 2 / lanes;
        lanew2 = w2 * 2 / lanes;
        lanex1 = x1 - w1 + lanew1;
        lanex2 = x2 - w2 + lanew2;
        for (lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++)
            polygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
    }

    // Simple fog implementation
    ctx.fillStyle = COLORS.FOG;
    ctx.globalAlpha = 1 - fog;
    ctx.fillRect(0, y2, width, y1 - y2);
    ctx.globalAlpha = 1.0;
}

function frame() {
    update(STEP);
    render();
    requestAnimationFrame(frame);
}

// Start game only when images are loaded
loadImages(() => {
    resize();
    render();
});
