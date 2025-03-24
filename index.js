const canvas = document.getElementById("fallCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const velocityInput = document.getElementById("velocityInput");
const distanceInput = document.getElementById("distanceInput");
const totalDistanceInput = document.getElementById("totalDistanceInput"); // Nuevo input para distancia total
const accelerationInput = document.getElementById("accelerationInput"); // Nuevo input para aceleración
const summaryButton = document.getElementById("summaryButton");
const summaryContainer = document.getElementById("summaryContainer");

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 600;
const timeStep = 0.008; // 60 FPS
let animationFrame;
let startTime, elapsedTime, distanceTraveled;
let isMoving = false;
let pausedTime = 0;
let targetDistance = 0;
let targetReached = false;
let timeToTarget = 0;
let cameraOffset = 0; // Para seguir al objeto cuando se mueve fuera de la pantalla visible
let totalDistance = DEFAULT_CANVAS_WIDTH - 50; // Distancia total por defecto (ajustar más tarde)
let pixelsPerMeter = 1; // Escala: 1 píxel = 1 metro (ajustable)
let acceleration = 0; // Agregar aceleración para MRUA
let ball = {
    x: 50,
    y: canvas.height / 2,
    radius: 20,
    velocityX: 50, // Velocidad en m/s
    ground: DEFAULT_CANVAS_WIDTH,
};

// Configurar canvas inicial
function setupCanvas() {
    // Valores por defecto
    if (isNaN(parseFloat(totalDistanceInput.value)) || parseFloat(totalDistanceInput.value) <= 0) {
        totalDistance = DEFAULT_CANVAS_WIDTH - 50;
        totalDistanceInput.value = totalDistance;
    } else {
        totalDistance = parseFloat(totalDistanceInput.value);
    }

    // Calcular la escala según la distancia total
    if (totalDistance > (DEFAULT_CANVAS_WIDTH - 50)) {
        pixelsPerMeter = (DEFAULT_CANVAS_WIDTH - 50) / totalDistance;
    } else {
        pixelsPerMeter = 1;
    }

    // Establecer ancho real del canvas según la escala
    const realCanvasWidth = 50 + (totalDistance * pixelsPerMeter);
    canvas.width = DEFAULT_CANVAS_WIDTH; // Mantenemos el mismo tamaño visible
    
    // Actualizar límite del movimiento
    ball.ground = 50 + (totalDistance * pixelsPerMeter);
    
    resetBall();
}

function resetBall() {
    ball.x = 50;
    cameraOffset = 0;
    startTime = null;
    elapsedTime = 0;
    distanceTraveled = 0;
    pausedTime = 0;
    targetReached = false;
    timeToTarget = 0;
    draw();
}


function update() {
    if (!isMoving) return;

    if (!startTime) {
        startTime = performance.now() - pausedTime * 1000; // Ajustar por tiempo pausado
    }

    elapsedTime = (performance.now() - startTime) / 1000; // Segundos
    const prevX = ball.x;
    
    // Aplicar aceleración en MRUA: v = v0 + at, x = x0 + v0t + (1/2)at^2
    ball.velocityX += ball.accelerationX * timeStep; // v = v0 + at
    ball.x += (ball.velocityX * pixelsPerMeter * timeStep) + (0.5 * ball.accelerationX * Math.pow(timeStep, 2) * pixelsPerMeter);
    
    distanceTraveled = (ball.x - 50) / pixelsPerMeter;

    // Manejar cámara siguiendo al objeto cuando se sale de pantalla
    if (ball.x > DEFAULT_CANVAS_WIDTH - 100 + cameraOffset) {
        cameraOffset += (ball.x - prevX);
    }

    // Verificar si hemos alcanzado la distancia objetivo
    if (targetDistance > 0 && !targetReached && distanceTraveled >= targetDistance) {
        targetReached = true;
        timeToTarget = elapsedTime;
        
        // Mostrar notificación
        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = `¡Distancia objetivo de ${targetDistance}m alcanzada en ${timeToTarget.toFixed(2)} segundos!`;
        document.body.appendChild(notification);
        
        // Eliminar la notificación después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    if (ball.x >= ball.ground) {
        ball.x = ball.ground;
        cancelAnimationFrame(animationFrame);
        isMoving = false;
        stopButton.textContent = "Detener Movimiento";
        
        // Notificación de llegada al final
        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = `¡Recorrido completado! Distancia total: ${distanceTraveled.toFixed(2)}m en ${elapsedTime.toFixed(2)} segundos`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sistema de coordenadas adaptado a la cámara
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    
    // Dibujar línea de referencia
    ctx.beginPath();
    ctx.moveTo(0, ball.y + ball.radius);
    ctx.lineTo(Math.min(ball.ground + 50, cameraOffset + DEFAULT_CANVAS_WIDTH), ball.y + ball.radius);
    ctx.strokeStyle = "#aaaaaa";
    ctx.stroke();
    
    // Dibujar marcas de distancia
    const visibleStart = Math.floor(cameraOffset / 100) * 100;
    const visibleEnd = visibleStart + DEFAULT_CANVAS_WIDTH + 100;
    
    for (let x = 50; x <= ball.ground; x += 100) {
        if (x >= visibleStart && x <= visibleEnd) {
            ctx.beginPath();
            ctx.moveTo(x, ball.y + ball.radius - 5);
            ctx.lineTo(x, ball.y + ball.radius + 5);
            ctx.strokeStyle = "#555555";
            ctx.stroke();
            
            // Añadir texto con la distancia en metros
            const distanceMeters = ((x - 50) / pixelsPerMeter).toFixed(0);
            ctx.fillStyle = "#333333";
            ctx.font = "12px Arial";
            ctx.fillText(`${distanceMeters}m`, x - 15, ball.y + ball.radius + 20);
        }
    }
    
    // Dibujar línea de meta (final de recorrido)
    ctx.beginPath();
    ctx.moveTo(ball.ground, ball.y - 100);
    ctx.lineTo(ball.ground, ball.y + ball.radius + 30);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Bandera de meta final
    ctx.beginPath();
    ctx.moveTo(ball.ground, ball.y - 100);
    ctx.lineTo(ball.ground + 30, ball.y - 85);
    ctx.lineTo(ball.ground, ball.y - 70);
    ctx.fillStyle = "#000";
    ctx.fill();
    
    // Dibujar objetivo si está establecido
    if (targetDistance > 0) {
        const targetX = 50 + (targetDistance * pixelsPerMeter);
        
        if (targetX >= visibleStart && targetX <= visibleEnd) {
            // Línea vertical en la posición objetivo
            ctx.beginPath();
            ctx.moveTo(targetX, ball.y - 100);
            ctx.lineTo(targetX, ball.y + ball.radius + 30);
            ctx.strokeStyle = targetReached ? "green" : "red";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.lineWidth = 1;
            
            // Bandera de meta intermedia
            ctx.beginPath();
            ctx.moveTo(targetX, ball.y - 100);
            ctx.lineTo(targetX + 30, ball.y - 85);
            ctx.lineTo(targetX, ball.y - 70);
            ctx.fillStyle = targetReached ? "green" : "red";
            ctx.fill();
            
            // Texto "META"
            ctx.fillStyle = "white";
            ctx.font = "bold 12px Arial";
            ctx.fillText("", targetX + 5, ball.y - 85);
            
            // Mostrar tiempo predicho o tiempo real
            if (targetReached) {
                ctx.fillStyle = "green";
                ctx.font = "14px Arial";
                ctx.fillText(`${timeToTarget.toFixed(2)}s`, targetX - 40, ball.y - 110);
            } else if (ball.velocityX > 0) {
                const predictedTime = targetDistance / ball.velocityX;
                ctx.fillStyle = "#333";
                ctx.font = "14px Arial";
                ctx.fillText(`Est: ${predictedTime.toFixed(2)}s`, targetX - 40, ball.y - 110);
            }
        }
    }
    
    // Dibujar bola
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
    
    ctx.restore(); // Restaurar sistema de coordenadas
    
    // Añadir información en tiempo real (fuera del sistema de coordenadas desplazado)
    if (startTime) {
        ctx.fillStyle = "#333333";
        ctx.font = "14px Arial";
        ctx.fillText(`Velocidad: ${ball.velocityX} m/s`, 20, 30);
        ctx.fillText(`Tiempo: ${elapsedTime.toFixed(2)} s`, 20, 50);
        ctx.fillText(`Distancia: ${distanceTraveled.toFixed(2)} m de ${totalDistance} m`, 20, 70);
        
        if (targetDistance > 0) {
            const remainingDistance = Math.max(0, targetDistance - distanceTraveled);
            ctx.fillText(`Distancia al objetivo: ${remainingDistance.toFixed(2)} m`, 20, 90);
        }
        
        // Mostrar escala
        ctx.fillText(`Escala: ${pixelsPerMeter.toFixed(2)} píxeles/metro`, 20, 110);
    }
    
    // Indicador visual de posición en recorrido total (barra de progreso)
    const progressBarWidth = canvas.width - 40;
    const progressBarHeight = 15;
    const progressBarX = 20;
    const progressBarY = canvas.height - 30;
    
    // Fondo de la barra
    ctx.fillStyle = "#ddd";
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // Progreso
    const progress = Math.min(1, distanceTraveled / totalDistance);
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
    
    // Borde
    ctx.strokeStyle = "#999";
    ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // Marcador de objetivo en la barra de progreso
    if (targetDistance > 0 && targetDistance <= totalDistance) {
        const targetMarkerPos = progressBarX + (progressBarWidth * (targetDistance / totalDistance));
        ctx.fillStyle = targetReached ? "green" : "red";
        ctx.beginPath();
        ctx.moveTo(targetMarkerPos, progressBarY - 5);
        ctx.lineTo(targetMarkerPos - 5, progressBarY - 15);
        ctx.lineTo(targetMarkerPos + 5, progressBarY - 15);
        ctx.closePath();
        ctx.fill();
    }
}

function animate() {
    update();
    draw();
    if (isMoving) {
        animationFrame = requestAnimationFrame(animate);
    }
}

function calculateEstimatedTime() {
    const velocity = parseFloat(velocityInput.value); // Velocidad final
    const initialVelocity = parseFloat(velocityInput.value); // Velocidad inicial (puede ser 0)
    const acceleration = parseFloat(accelerationInput.value); // Aceleración
    const distance = parseFloat(distanceInput.value);

    if (!isNaN(velocity) && velocity > 0 && !isNaN(initialVelocity) && !isNaN(acceleration) && acceleration > 0 && !isNaN(distance) && distance > 0) {
        // Formula para tiempo en MRUA: t = (v - v0) / a
        const time = Math.sqrt((2 * distance) / acceleration); 
        const timeDisplay = document.getElementById('estimatedTime');
        
        if (timeDisplay) {
            timeDisplay.textContent = `Tiempo estimado: ${time.toFixed(2)} segundos`;
            timeDisplay.style.display = 'block';
        }
    }
}

totalDistanceInput.addEventListener("change", function() {
    const totalDist = parseFloat(totalDistanceInput.value);
    if (!isNaN(totalDist) && totalDist > 0) {
        if (isMoving) {
            // Si está en movimiento, detenerlo antes de cambiar
            cancelAnimationFrame(animationFrame);
            isMoving = false;
            stopButton.textContent = "Detener Movimiento";
        }
        setupCanvas();
    } else {
        alert("Ingresa una distancia total válida.");
        totalDistanceInput.value = totalDistance;
    }
});
//BUG FIXED
startButton.addEventListener("click", function () {
    if (isMoving) {
        stopAnimation(); // Detiene la animación antes de iniciar una nueva
    }

    const velocity = parseFloat(velocityInput.value);
    const distance = parseFloat(distanceInput.value);
    const acceleration = parseFloat(accelerationInput.value); // Obtener la aceleración

    if (!isNaN(velocity) && velocity > 0) {
        ball.velocityX = velocity;
        ball.accelerationX = !isNaN(acceleration) ? acceleration : 0; // Asignar aceleración si es válida

        if (!isNaN(distance) && distance > 0) {
            if (distance > totalDistance) {
                alert(`La distancia objetivo no puede ser mayor que la distancia total (${totalDistance}m).`);
                return;
            }
            targetDistance = distance;
        } else {
            targetDistance = 0;
        }

        resetBall();
        isMoving = true;
        animate();
        stopButton.textContent = "Detener Movimiento";
    } else {
        alert("Ingresa una velocidad válida.");
    }
});


// Función para detener la animación
function stopAnimation() {
    isMoving = false; // Detiene el estado de movimiento
    cancelAnimationFrame(animationFrame); // Detiene la animación
    resetBall(); // Reinicia la posición de la bola
}
stopButton.addEventListener("click", function () {
    if (isMoving) {
        cancelAnimationFrame(animationFrame);
        isMoving = false;
        pausedTime = elapsedTime; // Guardar el tiempo transcurrido
        stopButton.textContent = "Continuar Movimiento";
    } else {
        isMoving = true;
        startTime = null; // Importante: resetear para que se calcule correctamente con el tiempo pausado
        animate();
        stopButton.textContent = "Detener Movimiento";
    }
});

// Actualizar tiempo estimado cuando cambian los valores
velocityInput.addEventListener("input", calculateEstimatedTime);
distanceInput.addEventListener("input", calculateEstimatedTime);

// Crear modal dinámicamente si no existe
if (!document.getElementById("summaryModal")) {
    const modalHTML = `
    <div id="summaryModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Resumen del Movimiento</h2>
            <div id="summaryText"></div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

const summaryModal = document.getElementById("summaryModal");
const summaryText = document.getElementById("summaryText");
const closeModal = document.querySelector(".close");

summaryButton.addEventListener("click", function () {
    // Calcular velocidad promedio real
    const realVelocity = distanceTraveled / elapsedTime;
    
    let targetInfo = "";
    if (targetDistance > 0) {
        if (targetReached) {
            targetInfo = `
                <p><strong>Resultados del objetivo:</strong></p>
                <p>Distancia objetivo: ${targetDistance} m</p>
                <p>Tiempo para alcanzar objetivo: ${timeToTarget.toFixed(2)} s</p>
                <p>Velocidad media hasta el objetivo: ${(targetDistance/timeToTarget).toFixed(2)} m/s</p>
            `;
        } else {
            const estimatedTime = targetDistance / ball.velocityX;
            targetInfo = `
                <p><strong>Objetivo:</strong></p>
                <p>Distancia objetivo: ${targetDistance} m</p>
                <p>Tiempo estimado: ${estimatedTime.toFixed(2)} s</p>
                <p>Estado: No alcanzado</p>
            `;
        }
    }
    
    summaryText.innerHTML = `
        <p><strong>Parámetros iniciales:</strong></p>
        <p>Velocidad configurada: ${ball.velocityX} m/s</p>
        <p>Distancia total: ${totalDistance} m</p>
        <p><strong>Resultados actuales:</strong></p>
        <p>Tiempo transcurrido: ${elapsedTime.toFixed(2)} s</p>
        <p>Distancia recorrida: ${distanceTraveled.toFixed(2)} m 
(${totalDistance > 0 ? ((distanceTraveled / totalDistance) * 100).toFixed(1) : 0}%)</p>
        <p>Velocidad promedio: ${realVelocity.toFixed(2)} m/s</p>
        ${targetInfo}
    `;
    summaryModal.style.display = "block";
});

if (closeModal) {
    closeModal.addEventListener("click", function () {
        summaryModal.style.display = "none";
    });
}

// Cerrar modal si se hace clic fuera de él
window.addEventListener("click", function (event) {
    if (event.target === summaryModal) {
        summaryModal.style.display = "none";
    }
});

// Estilo para el modal y notificaciones
const additionalStyles = document.createElement("style");
additionalStyles.textContent = `
.modal {
    display: none;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    border-radius: 10px;
    width: 80%;
    max-width: 500px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.close:hover,
.close:focus {
    color: black;
    text-decoration: none;
}

.notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    opacity: 1;
    transition: opacity 0.5s;
}

#estimatedTime {
    margin-top: 10px;
    font-style: italic;
    color: #666;
    display: none;
}

.target-distance-container {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
}
`;
document.head.appendChild(additionalStyles);

// Inicializar canvas
setupCanvas();
draw();