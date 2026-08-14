type GameState = "ready" | "playing" | "paused";

type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  velocityX: number;
  velocityY: number;
  health: number;
  onGround: boolean;
  facing: 1 | -1;
}


const keysPressed = new Set<string>();

window.addEventListener("keydown", (event) => {
  keysPressed.add(event.key.toLowerCase());

  if (
    ["a", "d", "w", "arrowleft", "arrowright", "arrowup"].includes(key)
  ) {
    event.preventDefault();
  }
})

window.addEventListener("keyup", (event) => {
  keysPressed.delete(event.key.toLowerCase());
})


const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const startOverlay = document.querySelector<HTMLElement>("#start-overlay");
const pauseOverlay = document.querySelector<HTMLElement>("#pause-overlay");
const status = document.querySelector<HTMLElement>("#game-status");
const startButton = document.querySelector<HTMLButtonElement>("#start-button");
const resumeButton = document.querySelector<HTMLButtonElement>("#resume-button");
const pauseButton = document.querySelector<HTMLButtonElement>("#pause-button");
const resetButton = document.querySelector<HTMLButtonElement>("#reset-button");

const playerOne: Player = {
  x: 250,
  y: canvas.height * 0.78 - 100,
  width: 50,
  height: 100,
  color: "#f37872",
  velocityX: 0,
  velocityY: 0,
  health: 100,
  onGround: true,
  facing: 1,
};

const playerTwo: Player = {
  x: 950,
  y: canvas.height * 0.78 - 100,
  width: 50,
  height: 100,
  color: "#7baeea",
  velocityX: 0,
  velocityY: 0,
  health: 100,
  onGround: true,
  facing: -1,
};

if (!canvas || !startOverlay || !pauseOverlay || !status || !startButton || !resumeButton || !pauseButton || !resetButton) {
  throw new Error("The game page is missing a required element.");
}

const context = canvas.getContext("2d");

if (!context) {
  throw new Error("A 2D canvas context is required to run the game.");
}

let state: GameState = "ready";
let animationFrameId: number | undefined;
let lastFrameTime = 0;

function updateInterface(): void {
  startOverlay.hidden = state !== "ready";
  pauseOverlay.hidden = state !== "paused";
  pauseButton.textContent = state === "paused" ? "Resume" : "Pause";

  status.textContent = {
    ready: "Ready to fight",
    playing: "Match in progress",
    paused: "Match paused",
  }[state];
}

function drawLimb(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
}


function drawPlayer(player: Player): void {
  const centerX = player.x + player.width / 2;

  // These positions are relative to the player's invisible collision box.
  const headY = player.y + 18;
  const shoulderY = player.y + 38;
  const hipY = player.y + 68;
  const footY = player.y + player.height;

  // Make limbs swing a little while moving.
  const walking =
    player.velocityX === 0
      ? 0
      : Math.sin(performance.now() * 0.012) * 12;
  const legSwing = player.onGround ? walking : 0;
  const armSwing = player.onGround ? -walking : 0;

  context.save();

  context.strokeStyle = player.color;
  context.fillStyle = player.color;
  context.lineWidth = 8;
  context.lineCap = "round";
  context.lineJoin = "round";

  // Head
  context.beginPath();
  context.arc(centerX, headY, 13, 0, Math.PI * 2);
  context.fill();

  // Body
  context.beginPath();
  context.moveTo(centerX, shoulderY);
  context.lineTo(centerX, hipY);
  context.stroke();

  // Arms
  drawLimb(
    centerX,
    shoulderY,
    centerX + player.facing * (24 + armSwing),
    shoulderY + 18,
  );

  drawLimb(
    centerX,
    shoulderY,
    centerX - player.facing * (20 + armSwing),
    shoulderY + 25,
  );

  // Legs
  drawLimb(
    centerX,
    hipY,
    centerX + player.facing * (20 + legSwing),
    footY,
  );

  drawLimb(
    centerX,
    hipY,
    centerX - player.facing * (20 + legSwing),
    footY,
  );

  context.restore();
}

const floorY = canvas.height * 0.78;
const gravity = 0.7;
const jumpStrength = -16;

function punch(attacker: Player, victim: Player): void {
  // if playerOne is next to playerTwo and playerOne does a punch attack while facing player two,
  // register as a hit with a punch animation and a decrease two playerTwo health
  if (Math.abs(attacker.x - victim.x) < 10) {
    if ((attacker.facing === 1 && attacker.x > victim.x) || attacker.facing === -1 && attacker.x < victim.x) {
      victim.health -= 10;
    }
  }
}

function updatePlayerPhysics(player: Player): void {
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  
  player.velocityY += gravity;

  player.y += player.velocityY;
  
  const playerFloorY = floorY - player.height;
 
  if (player.y >= playerFloorY) {
    player.y = playerFloorY;
    player.velocityY = 0;
    player.onGround = true;
  }
}

function updatePlayers(): void {
  const speed = 6;

  playerOne.velocityX = 0;
  playerTwo.velocityX = 0;

  // Player 1: left/right movement
  if (keysPressed.has("a")) {
    playerOne.velocityX = -speed;
    playerOne.facing = -1;
  }

  if (keysPressed.has("d")) {
    playerOne.velocityX = speed;
    playerOne.facing = 1;
  }

  // Player 1: jump only when standing on the ground
  if (keysPressed.has("w") && playerOne.onGround) {
    playerOne.velocityY = jumpStrength;
    playerOne.onGround = false;
  }

  // Player 1: punch the enemy
  if (keysPressed.has("f")) {
    punch(playerOne, playerTwo)
  }

  // Player 2: left/right movement
  if (keysPressed.has("j")) {
    playerTwo.velocityX = -speed;
    playerTwo.facing = -1;
  }

  if (keysPressed.has("l")) {
    playerTwo.velocityX = speed;
    playerTwo.facing = 1;
  }

  // Player 2: jump only when standing on the ground
  if (keysPressed.has("i") && playerTwo.onGround) {
    playerTwo.velocityY = jumpStrength;
    playerTwo.onGround = false;
  }

  playerOne.x += playerOne.velocityX;
  playerTwo.x += playerTwo.velocityX;

  updatePlayerPhysics(playerOne);
  updatePlayerPhysics(playerTwo);
}


function drawArena(): void {
  const { width, height } = canvas;

  context.clearRect(0, 0, width, height);

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#304a80");
  sky.addColorStop(1, "#18223a");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#28384c";
  context.fillRect(0, height * 0.78, width, height * 0.22);

  context.strokeStyle = "rgb(255 255 255 / 12%)";
  context.lineWidth = 2;
  for (let x = 0; x <= width; x += 80) {
    context.beginPath();
    context.moveTo(x, height * 0.78);
    context.lineTo(x + 40, height);
    context.stroke();
  }

  context.fillStyle = "rgb(255 255 255 / 70%)";
  context.font = "700 28px system-ui";
  context.textAlign = "center";
  context.fillText("Arena ready", width / 2, height / 2);
  context.font = "18px system-ui";
  context.fillText("Add fighters and gameplay in src/main.ts", width / 2, height / 2 + 36);
  drawPlayer(playerOne);
  drawPlayer(playerTwo);
}

function gameLoop(timestamp: number): void {
  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  updatePlayers();
  drawArena();

  if (state === "playing") {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function startMatch(): void {
  state = "playing";
  lastFrameTime = performance.now();
  updateInterface();
  cancelAnimationFrame(animationFrameId ?? 0);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function pauseMatch(): void {
  if (state !== "playing") return;

  state = "paused";
  cancelAnimationFrame(animationFrameId ?? 0);
  updateInterface();
}

function resetMatch(): void {
  cancelAnimationFrame(animationFrameId ?? 0);
  state = "ready";
  updateInterface();
  drawArena();
}

startButton.addEventListener("click", startMatch);
resumeButton.addEventListener("click", startMatch);
pauseButton.addEventListener("click", () => {
  if (state === "playing") pauseMatch();
  else if (state === "paused") startMatch();
});
resetButton.addEventListener("click", resetMatch);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state === "playing") pauseMatch();
    else if (state === "paused") startMatch();
  }
});

updateInterface();
drawArena();
