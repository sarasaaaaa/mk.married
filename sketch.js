let bowImg;
let arrowImg;
let shootSound;
// let heartImg; // Removed heart image variable
let angle = 0;
let state = 'READY'; // READY, AIMING, FIRED, STUCK, COOLDOWN
let arrowPos;
let firedAngle = 0;
let cooldownStartTime = 0;
let myFrameCount = 0;
const ARROW_SPEED = 15;

// Typography variables
// Matter.js aliases
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;

let engine;
let world;
let particles = [];
let walls = [];
let Font;
// let modules = []; // Replaced by particles array setup

function preload() {
  bowImg = loadImage('활.png');
  arrowImg = loadImage('화살.png');
  back = loadImage('배경.png');
  backfront = loadImage('배경틀.png');
  // heartImg = loadImage('하트.png'); // Removed heart image load
  //Font = loadFont('');
  Font2 = loadFont('ZEN-SERIF-Regular.otf');
  Font3 = loadFont('Quindelia.ttf');
  shootSound = loadSound('ppong.mp3');
}

function setup() {
  createCanvas(344, 486);
  // pixelDensity(2);
  arrowPos = createVector(width / 2, height - 150);



  // --- Physics Setup ---
  engine = Engine.create();
  world = engine.world;

  // Create Screen Boundaries (Margin 50px)
  let wallThickness = 100; // Make thick enough to prevent tunneling
  let ground = Bodies.rectangle(width / 2, height - 38 + (wallThickness / 2), width, wallThickness, { isStatic: true });
  let leftWall = Bodies.rectangle(41 - (wallThickness / 2), height / 2, wallThickness, height, { isStatic: true });
  let rightWall = Bodies.rectangle(width - 41 + (wallThickness / 2), height / 2, wallThickness, height, { isStatic: true });

  walls.push(ground, leftWall, rightWall);
  World.add(world, walls);

  // --- Typography Setup ---
  // Create off-screen graphics to scan text
  let pg = createGraphics(width, height);
  pg.pixelDensity(1);
  pg.background(0);
  pg.textFont(Font3);
  pg.textAlign(CENTER, CENTER);
  pg.fill(255);

  // Draw ONLY 'Wedding' to buffer for particles
  pg.textSize(63);
  pg.text('Married', width / 2 + 2, height / 2 - 30);

  // Scan buffer for points
  let gap = 3;
  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      let c = pg.get(x, y);
      if (brightness(c) > 0) {
        let p = Bodies.circle(x, y, 3.3, {
          isStatic: true,
          restitution: 0.8,
          friction: 0.5
        });
        p.emoji = random(['❤️']);
        particles.push(p);
        World.add(world, p);
      }
    }
  }
}

function draw() {
  Engine.update(engine);
  myFrameCount++;

  image(back, 0, 0, width, height);

  // --- Typography Draw ---
  // 1. Static Text (Invitation) - Always Black
  fill("#f8d7f9");
  textFont(Font3);
  textAlign(CENTER, CENTER);
  textSize(23);
  stroke("#f53db6");
  strokeWeight(2.5);
  text('HyunHo & Maria', width / 2 + 2, height / 2 - 130);

  fill("#f53db6");
  textFont(Font3);
  textAlign(CENTER, CENTER);
  textSize(18);
  noStroke();
  text('We are getting', width / 2 + 5, height / 2 - 68);

  // strokeWeight(1);
  // stroke("#f53db6");
  // textFont(Font2);
  // textSize(18);
  // text('2026. 7. 31', width / 2 , height / 2 + 10);


  // 2. Background 'Wedding' (Red) - Revealed when particles shrink
  fill("#f53db6"); // Fixed color to Red
  textSize(63);
  textFont(Font3);
  noStroke();
  text('Married', width / 2 + 2, height / 2 - 30);

  // 3. Foreground 'Wedding' (Heart Particles)
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(10);
  textFont('Arial');

  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    let pos = p.position;
    let angle = p.angle;

    // Arrow impact logic
    if (state === 'STUCK') {
      let dArrow = dist(arrowPos.x, arrowPos.y - 50, pos.x, pos.y);
      if (dArrow < 55 && p.isStatic) {
        // Drop only some particles
        if (random(1) < 0.15) {
          Body.setStatic(p, false);
          Body.setVelocity(p, { x: random(-2, 2), y: random(0, 2) });
        }
      }
    }

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    text(p.emoji, 0, 0);
    pop();
  }

  // --- Bow and Arrow Logic ---
  let centerX = width / 2;
  let centerY = height - 140;

  // State Logic
  if (state === 'READY') {
    angle = 0;
    myFrameCount = 0;
    arrowPos.set(centerX, centerY);
    // Only start aiming if clicking near the bow (radius 150)
    if (mouseIsPressed && dist(mouseX, mouseY, centerX, centerY) < 80) {
      state = 'AIMING';
    }
  } else if (state === 'AIMING') {
    if (mouseIsPressed) {
      angle = sin(myFrameCount * 0.05) * 0.65;
      arrowPos.set(centerX, centerY);
    } else {
      // Mouse released -> Fire
      state = 'FIRED';
      firedAngle = angle;
      shootSound.play();
    }
  } else if (state === 'FIRED') {
    // Move arrow
    let vx = ARROW_SPEED * sin(firedAngle);
    let vy = -ARROW_SPEED * cos(firedAngle);
    arrowPos.x += vx;
    arrowPos.y += vy;

    // Check target
    if (arrowPos.y <= 270) {
      state = 'STUCK';
      stuckStartTime = millis();
    }
  } else if (state === 'STUCK') {
    if (millis() - stuckStartTime > 1500) {
      state = 'COOLDOWN';
      cooldownStartTime = millis();
    }
  } else if (state === 'COOLDOWN') {
    if (millis() - cooldownStartTime > 0) {
      state = 'READY';
    }
  }

  // Determine Bow Angle
  let currentBowAngle = (state === 'READY') ? 0 : (state === 'AIMING' ? angle : firedAngle);

  // Draw Bow
  push();
  translate(centerX, centerY);
  rotate(currentBowAngle);
  imageMode(CENTER);
  image(bowImg, 0, 0, 130, 80);
  pop();

  // Draw Arrow
  if (state !== 'COOLDOWN') {
    push();
    if (state === 'FIRED' || state === 'STUCK') {
      translate(arrowPos.x, arrowPos.y);
      rotate(firedAngle);
    } else {
      // READY or AIMING
      translate(centerX, centerY);
      rotate(currentBowAngle);
    }
    imageMode(CENTER);
    image(arrowImg, 0, 0, 100, 80);
    pop();
  }

  fill("#f8d7f9");
  textFont(Font3);
  textAlign(CENTER, CENTER);
  textSize(16);
  strokeWeight(1);
  stroke("#f8d7f9");
  text('2026. 7. 25', width / 2, height - 65);

  image(backfront, 0, 0, width, height);
}
