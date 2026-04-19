const canvas = document.getElementById('regCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const valMae = document.getElementById('val-mae');
const valMse = document.getElementById('val-mse');
const valRmse = document.getElementById('val-rmse');
const showSquaresCb = document.getElementById('showSquares');
const btnAddOutlier = document.getElementById('btnAddOutlier');
const btnReset = document.getElementById('btnReset');

// State
let points = [];
const POINT_RADIUS = 6;
let isDragging = false;
let draggedPointIndex = -1;

// Initial points setup (linear pattern)
function initPoints() {
    points = [
        {x: 100, y: 300},
        {x: 200, y: 260},
        {x: 300, y: 200},
        {x: 400, y: 150},
        {x: 500, y: 120}
    ];
    updateAndDraw();
}

// Линейная регрессия (Метод наименьших квадратов)
function calculateRegression() {
    if (points.length < 2) return null;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = points.length;

    for (let p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
    }

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null; // Вертикальная линия

    const m = (n * sumXY - sumX * sumY) / denominator;
    const b = (sumY - m * sumX) / n;

    return { m, b };
}

// Пересчет метрик и отрисовка
function updateAndDraw() {
    // 1. Считаем регрессию
    const reg = calculateRegression();
    
    // 2. Считаем метрики
    let mae = 0;
    let mse = 0;
    
    if (reg !== null && points.length > 0) {
        for (let p of points) {
            const predY = reg.m * p.x + reg.b;
            const error = p.y - predY;
            mae += Math.abs(error);
            mse += error * error;
        }
        mae = mae / points.length;
        mse = mse / points.length;
    }

    const rmse = Math.sqrt(mse);

    // Обновляем HTML (масштабируем числа для красоты отображения, делим на 10)
    valMae.innerText = (mae / 10).toFixed(1);
    valMse.innerText = (mse / 100).toFixed(1);
    valRmse.innerText = (rmse / 10).toFixed(1);

    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    if (reg === null) {
        drawPoints();
        return; // Мало точек
    }

    // Отрисовка линии регрессии
    ctx.beginPath();
    ctx.moveTo(0, reg.b);
    ctx.lineTo(canvas.width, reg.m * canvas.width + reg.b);
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Отрисовка ошибок (ОБЯЗАТЕЛЬНО ПОКАЖИ ЭТО НА УРОКЕ!)
    for (let p of points) {
        const predY = reg.m * p.x + reg.b;
        const error = p.y - predY;
        
        // Рисуем квадрат для MSE (полупрозрачный красный)
        if (showSquaresCb.checked) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.4)';
            ctx.lineWidth = 1;
            const size = Math.abs(error);
            // Чтобы квадрат не уходил за точку, рисуем его вправо
            ctx.fillRect(p.x, Math.min(p.y, predY), size, size);
            ctx.strokeRect(p.x, Math.min(p.y, predY), size, size);
        }

        // Рисуем линию (абсолютная ошибка для MAE)
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, predY);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]); // Сброс
    }

    drawPoints();
}

function drawPoints() {
    for (let p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawGrid() {
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
}

// --- Обработка мыши ---
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', (evt) => {
    const pos = getMousePos(evt);
    // Ищем, кликнули ли мы по точке
    draggedPointIndex = points.findIndex(p => Math.hypot(p.x - pos.x, p.y - pos.y) <= POINT_RADIUS + 5);
    
    if (draggedPointIndex !== -1) {
        isDragging = true;
    } else {
        // Добавляем новую точку
        points.push({x: pos.x, y: pos.y});
        updateAndDraw();
    }
});

canvas.addEventListener('mousemove', (evt) => {
    if (isDragging && draggedPointIndex !== -1) {
        const pos = getMousePos(evt);
        points[draggedPointIndex].x = pos.x;
        points[draggedPointIndex].y = pos.y;
        updateAndDraw();
    }
});

canvas.addEventListener('mouseup', () => { isDragging = false; draggedPointIndex = -1; });
canvas.addEventListener('mouseleave', () => { isDragging = false; draggedPointIndex = -1; });

canvas.addEventListener('dblclick', (evt) => {
    const pos = getMousePos(evt);
    const idx = points.findIndex(p => Math.hypot(p.x - pos.x, p.y - pos.y) <= POINT_RADIUS + 5);
    if (idx !== -1) {
        points.splice(idx, 1);
        updateAndDraw();
    }
});

// Кнопки
showSquaresCb.addEventListener('change', updateAndDraw);
btnReset.addEventListener('click', initPoints);

btnAddOutlier.addEventListener('click', () => {
    // Добавляем точку максимально далеко от нормальной линии
    points.push({x: 550, y: 350}); // Правый нижний угол (огромная ошибка)
    updateAndDraw();
});

// Запуск
initPoints();