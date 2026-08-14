type GameState = "ready" | "playing" | "paused" | "game-over";

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
  attackUntil: number;
}


const keysPressed = new Set<string>();

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keysPressed.add(key);

  if (["a", "d", "w", "j", "i", "l", "f", "h"].includes(key)) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keysPressed.delete(event.key.toLowerCase());
})


const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const startOverlay = document.querySelector<HTMLElement>("#start-overlay");
const pauseOverlay = document.querySelector<HTMLElement>("#pause-overlay");
const gameOverOverlay = document.querySelector<HTMLElement>("#game-over-overlay");
const winnerMessage = document.querySelector<HTMLElement>("#winner-message");
const status_1 = document.querySelector<HTMLElement>("#game-status");
const startButton = document.querySelector<HTMLButtonElement>("#start-button");
const resumeButton = document.querySelector<HTMLButtonElement>("#resume-button");
const playAgainButton = document.querySelector<HTMLButtonElement>("#play-again-button");
const pauseButton = document.querySelector<HTMLButtonElement>("#pause-button");
const resetButton = document.querySelector<HTMLButtonElement>("#reset-button");
const playerOneHealthBar = document.querySelector<HTMLElement>("#player-one-health");
const playerTwoHealthBar = document.querySelector<HTMLElement>("#player-two-health");
if (
  !canvas ||
  !startOverlay ||
  !pauseOverlay ||
  !gameOverOverlay ||
  !winnerMessage ||
  !status_1 ||
  !startButton ||
  !resumeButton ||
  !playAgainButton ||
  !pauseButton ||
  !resetButton ||
  !playerOneHealthBar ||
  !playerTwoHealthBar
) {
  throw new Error("The game page is missing a required element.");
}


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
  attackUntil: 0,
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
  attackUntil: 0,
};

if (!canvas || !startOverlay || !pauseOverlay || !status_1 || !startButton || !resumeButton || !pauseButton || !resetButton) {
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
  gameOverOverlay.hidden = state !== "game-over";
  pauseButton.textContent = state === "paused" ? "Resume" : "Pause";
  pauseButton.disabled = state === "game-over";

  status_1.textContent = {
    ready: "Ready to fight",
    playing: "Match in progress",
    paused: "Match paused",
    "game-over": "Match finished",
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

  // Head, with an eye and nose placed on the side the player faces.
  context.beginPath();
  context.arc(centerX, headY, 13, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#10131c";
  context.beginPath();
  context.arc(centerX + player.facing * 6, headY - 3, 2.5, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#10131c";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(centerX + player.facing * 11, headY + 2);
  context.lineTo(centerX + player.facing * 17, headY + 4);
  context.stroke();

  context.strokeStyle = player.color;
  context.fillStyle = player.color;
  context.lineWidth = 8;

  // Body
  context.beginPath();
  context.moveTo(centerX, shoulderY);
  context.lineTo(centerX, hipY);
  context.stroke();

  // The front arm extends for a short time when punching.
  const isPunching = performance.now() < player.attackUntil;
  const frontHandX = centerX + player.facing * (isPunching ? 68 : 24 + armSwing);
  const frontHandY = shoulderY + (isPunching ? 4 : 18);

  drawLimb(centerX, shoulderY, frontHandX, frontHandY);
  drawLimb(
    centerX,
    shoulderY,
    centerX - player.facing * (20 + armSwing),
    shoulderY + 25,
  );

  if (isPunching) {
    context.beginPath();
    context.arc(frontHandX, frontHandY, 7, 0, Math.PI * 2);
    context.fill();
  }

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

function damagePlayer(player: Player, amount: number): void {
  player.health = Math.max(0, player.health - amount);
  updateHealthBars();

  if (player.health === 0) {
    endMatch(player);
  }
}

function endMatch(loser: Player): void {
  const winner = loser === playerOne ? "Player 2" : "Player 1";

  state = "game-over";
  keysPressed.clear();
  cancelAnimationFrame(animationFrameId ?? 0);
  winnerMessage.textContent = `${winner} wins the match!`;
  updateInterface();
  drawArena();
}

function punch(attacker: Player, victim: Player): void {
  const now = performance.now();
  const punchDuration = 180;

  // A player cannot begin another punch until this animation finishes.
  if (now < attacker.attackUntil) return;
  attacker.attackUntil = now + punchDuration;

  const attackerCenterX = attacker.x + attacker.width / 2;
  const victimCenterX = victim.x + victim.width / 2;
  const victimIsInFront =
    attacker.facing === 1
      ? victimCenterX >= attackerCenterX
      : victimCenterX <= attackerCenterX;

  // These match the visible extended arm and the victim's drawn torso.
  const fistX = attackerCenterX + attacker.facing * 68;
  const fistY = attacker.y + 42;
  const fistRadius = 7;
  const attackLeft = Math.min(attackerCenterX, fistX) - fistRadius;
  const attackRight = Math.max(attackerCenterX, fistX) + fistRadius;
  const victimBodyLeft = victim.x + 10;
  const victimBodyRight = victim.x + victim.width - 10;
  const victimBodyTop = victim.y + 30;
  const victimBodyBottom = victim.y + 75;

  const punchOverlapsBodyHorizontally =
    attackRight >= victimBodyLeft && attackLeft <= victimBodyRight;
  const punchOverlapsBodyVertically =
    fistY + fistRadius >= victimBodyTop &&
    fistY - fistRadius <= victimBodyBottom;

  if (
    victimIsInFront &&
    punchOverlapsBodyHorizontally &&
    punchOverlapsBodyVertically
  ) {
    damagePlayer(victim, 10);
  }
}

function updateHealthBars(): void {
  playerOneHealthBar.style.width = `${playerOne.health}%`;
  playerTwoHealthBar.style.width = `${playerTwo.health}%`;
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
  updateHealthBars();
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

  playerOne.health = 100;
  playerTwo.health = 100;
  playerOne.x = 250;
  playerTwo.x = 950;
  playerOne.y = floorY - playerOne.height;
  playerTwo.y = floorY - playerTwo.height;
  playerOne.velocityX = 0;
  playerTwo.velocityX = 0;
  playerOne.velocityY = 0;
  playerTwo.velocityY = 0;
  playerOne.onGround = true;
  playerTwo.onGround = true;
  playerOne.facing = 1;
  playerTwo.facing = -1;
  playerOne.attackUntil = 0;
  playerTwo.attackUntil = 0;
  keysPressed.clear();

  state = "ready";
  updateInterface();
  updateHealthBars();
  drawArena();
}

startButton.addEventListener("click", startMatch);
resumeButton.addEventListener("click", startMatch);
playAgainButton.addEventListener("click", () => {
  resetMatch();
  startMatch();
});
pauseButton.addEventListener("click", () => {
  if (state === "playing") pauseMatch();
  else if (state === "paused") startMatch();
});
resetButton.addEventListener("click", resetMatch);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "escape") {
    if (state === "playing") pauseMatch();
    else if (state === "paused") startMatch();
    return;
  }

  if (event.repeat || state !== "playing") return;

  if (key === "f") punch(playerOne, playerTwo);
  if (key === "h") punch(playerTwo, playerOne);
});

updateInterface();
updateHealthBars();
drawArena();
