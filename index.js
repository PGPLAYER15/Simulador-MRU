const canvas = document.getElementById("fallCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const velocityInput = document.getElementById("velocityInput");
const summaryButton = document.getElementById("summaryButton");
const summaryText = document.getElementById("summaryText");
const summaryModal = document.getElementById("summaryModal");
const closeModal = document.querySelector(".close");

const timeStep = 0.008; // 60 FPS
let animationFrame;
let startTime, elapsedTime, distanceTraveled;
let isMoving = false;

let ball = {
    x: 50,
    y: canvas.height / 2,
    radius: 20,
    velocityX: 50, // Velocidad en m/s
    ground: canvas.width,
};

function resetBall() {
    ball.x = 50;
    startTime = null;
    elapsedTime = 0;
    distanceTraveled = 0;
    draw();
}

function update() {
    if (!isMoving) return;

    if (!startTime) {
        startTime = performance.now();
    }

    elapsedTime = (performance.now() - startTime) / 1000; // Segundos
    ball.x += ball.velocityX * timeStep;
    distanceTraveled = (ball.x - 50);

    if (ball.x + ball.radius >= ball.ground) {
        cancelAnimationFrame(animationFrame);
        isMoving = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
}

function animate() {
    update();
    draw();
    if (isMoving) {
        animationFrame = requestAnimationFrame(animate);
    }
}

startButton.addEventListener("click", function () {
    const velocity = parseFloat(velocityInput.value);
    if (!isNaN(velocity) && velocity > 0) {
        ball.velocityX = velocity;
        resetBall();
        isMoving = true;
        animate();
    } else {
        alert("Ingresa una velocidad válida.");
    }
});

stopButton.addEventListener("click", function () {
    if (isMoving) {
        cancelAnimationFrame(animationFrame);
        stopButton.textContent = "Continuar Movimiento";
    } else {
        animate();
        isMoving = true;
        stopButton.textContent = "Detener Movimiento";
    }
    isMoving = !isMoving;
});

summaryButton.addEventListener("click", function () {
    summaryText.innerHTML = `
        <strong>Velocidad:</strong> ${ball.velocityX} m/s<br>
        <strong>Tiempo transcurrido:</strong> ${elapsedTime.toFixed(2)} s<br>
        <strong>Distancia recorrida:</strong> ${distanceTraveled.toFixed(2)} m
    `;
    summaryModal.style.display = "block";
});

closeModal.addEventListener("click", function () {
    summaryModal.style.display = "none";
});

document.addEventListener("click", function (event) {
    if (event.target === summaryModal) {
        summaryModal.style.display = "none";
    }
});

draw();
