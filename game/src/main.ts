type GameState = "ready" | "playing" | "paused";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const startOverlay = document.querySelector<HTMLElement>("#start-overlay");
const pauseOverlay = document.querySelector<HTMLElement>("#pause-overlay");
const status = document.querySelector<HTMLElement>("#game-status");
const startButton = document.querySelector<HTMLButtonElement>("#start-button");
const resumeButton = document.querySelector<HTMLButtonElement>("#resume-button");
const pauseButton = document.querySelector<HTMLButtonElement>("#pause-button");
const resetButton = document.querySelector<HTMLButtonElement>("#reset-button");

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
}

function gameLoop(timestamp: number): void {
  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  // Add game updates here, e.g. updatePlayers(deltaTime).
  void deltaTime;
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
