const drawCanvas = document.getElementById('drawCanvas');
const targetCanvas = document.getElementById('targetCanvas');
const drawCtx = drawCanvas.getContext('2d');
const targetCtx = targetCanvas.getContext('2d');
const feedback = document.getElementById('feedback');
const meter = document.getElementById('meterFill');
const volumeValue = document.getElementById('volumeValue');
const clearBtn = document.getElementById('clearBtn');
const audio = document.getElementById('mainAudio');
const shapeName = document.getElementById('shapeName');

let drawing = false;
let points = [];
let currentShape = null;
let shapeIndex = 0;

const shapes = [
    { name: 'Circle', type: 'circle' },
    { name: 'Square', type: 'square' },
    { name: 'Triangle', type: 'triangle' },
    { name: 'Star', type: 'star' },
    { name: 'Heart', type: 'heart' }
];

function drawTargetShape(ctx, shapeType) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 60;

    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 140, 0, 0.1)';

    if (shapeType === 'circle') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else if (shapeType === 'square') {
        ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.strokeRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    } else if (shapeType === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX + radius, centerY + radius * 0.8);
        ctx.lineTo(centerX - radius, centerY + radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (shapeType === 'star') {
        drawStar(ctx, centerX, centerY, 5, radius, radius * 0.4);
    } else if (shapeType === 'heart') {
        drawHeart(ctx, centerX, centerY, radius);
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawHeart(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.4);
    ctx.bezierCurveTo(cx - size, cy - size * 0.4, cx - size * 1.3, cy - size * 0.6, cx - size * 0.5, cy - size * 0.3);
    ctx.bezierCurveTo(cx - size * 0.7, cy - size * 0.7, cx - size * 0.4, cy - size * 0.9, cx, cy - size * 0.5);
    ctx.bezierCurveTo(cx + size * 0.4, cy - size * 0.9, cx + size * 0.7, cy - size * 0.7, cx + size * 0.5, cy - size * 0.3);
    ctx.bezierCurveTo(cx + size * 1.3, cy - size * 0.6, cx + size, cy - size * 0.4, cx, cy + size * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function selectRandomShape() {
    shapeIndex = Math.floor(Math.random() * shapes.length);
    currentShape = shapes[shapeIndex];
    shapeName.innerText = currentShape.name;
    drawTargetShape(targetCtx, currentShape.type);
}

function setVolume(percent) {
    const volume = Math.max(0, Math.min(1, percent / 100));
    audio.volume = volume;
    volumeValue.innerText = `Volume: ${Math.round(percent)}%`;
    meter.style.width = `${percent}%`;
}

function updateFeedback(score, shapeType) {
    if (score >= 90) {
        feedback.innerText = `Masterpiece! You nailed the ${shapeType}. Volume climbs to ${Math.round(score)}%.`;
    } else if (score >= 70) {
        feedback.innerText = `Pretty good! The ${shapeType} is recognizable. Volume is ${Math.round(score)}%.`;
    } else if (score >= 50) {
        feedback.innerText = `Not bad, but your ${shapeType} is warped. Volume is ${Math.round(score)}%.`;
    } else if (score > 20) {
        feedback.innerText = `That's... abstract. The system barely recognizes the ${shapeType}. Volume is ${Math.round(score)}%.`;
    } else {
        feedback.innerText = `What is that? Draw a better ${shapeType}.`;
    }
}

function clearCanvas() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    points = [];
    setVolume(0);
    feedback.innerText = 'Draw the shape shown above. The system judges every wobble.';
    selectRandomShape();
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function computeShapeSimilarity(pts, targetType) {
    if (pts.length < 15) {
        return 0;
    }

    const first = pts[0];
    const last = pts[pts.length - 1];
    const closureError = Math.min(distance(first, last) / 100, 1);

    const avg = pts.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
    avg.x /= pts.length;
    avg.y /= pts.length;

    let score = 100;

    if (targetType === 'circle') {
        const radii = pts.map(pt => distance(pt, avg));
        const avgRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length;
        const radiusDeviation = Math.sqrt(radii.reduce((sum, r) => sum + Math.pow(r - avgRadius, 2), 0) / radii.length);
        const radiusScore = Math.max(0, 1 - (radiusDeviation / avgRadius));
        score = radiusScore * 100 - closureError * 30;
    } else if (targetType === 'square') {
        const xs = pts.map(p => p.x).sort((a, b) => a - b);
        const ys = pts.map(p => p.y).sort((a, b) => a - b);
        const rangeX = xs[xs.length - 1] - xs[0];
        const rangeY = ys[ys.length - 1] - ys[0];
        const aspectRatio = Math.max(rangeX, rangeY) / (Math.min(rangeX, rangeY) + 1);
        const squareness = Math.max(0, 1 - Math.abs(aspectRatio - 1) / 2);
        score = squareness * 100 - closureError * 30;
    } else if (targetType === 'triangle') {
        const xs = pts.map(p => p.x).sort((a, b) => a - b);
        const ys = pts.map(p => p.y).sort((a, b) => a - b);
        const rangeX = xs[xs.length - 1] - xs[0];
        const rangeY = ys[ys.length - 1] - ys[0];
        const aspectRatio = rangeY / (rangeX + 1);
        const triangularity = Math.max(0, 1 - Math.abs(aspectRatio - 1.2) / 1.5);
        score = triangularity * 100 - closureError * 30;
    } else if (targetType === 'star') {
        const radii = pts.map(pt => distance(pt, avg));
        const avgRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length;
        const radiusVariance = Math.sqrt(radii.reduce((sum, r) => sum + Math.pow(r - avgRadius, 2), 0) / radii.length);
        const pointiness = (radiusVariance / avgRadius);
        const starScore = Math.min(1, pointiness / 0.5);
        score = starScore * 100 - closureError * 20;
    } else if (targetType === 'heart') {
        const radii = pts.map(pt => distance(pt, avg));
        const avgRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length;
        score = 70 - closureError * 30;
    }

    return Math.max(0, Math.min(100, score));
}

function finishDrawing() {
    if (points.length === 0) {
        return;
    }
    const score = computeShapeSimilarity(points, currentShape.type);
    const noisyScore = Math.max(0, Math.min(100, score - Math.abs(Math.sin(score / 7) * 5 - 2)));
    const finalScore = Math.round(noisyScore * 10) / 10;
    setVolume(finalScore);
    updateFeedback(finalScore, currentShape.name);
}

function getDrawingCoordinates(event) {
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;

    if (event.touches && event.touches.length > 0) {
        return {
            x: (event.touches[0].clientX - rect.left) * scaleX,
            y: (event.touches[0].clientY - rect.top) * scaleY
        };
    } else if (event.clientX !== undefined) {
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
    return null;
}

drawCanvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    drawing = true;
    points = [];
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawCtx.lineWidth = 14;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.strokeStyle = 'rgba(255, 0, 85, 0.95)';

    const coords = getDrawingCoordinates(event);
    if (coords) {
        drawCtx.beginPath();
        drawCtx.moveTo(coords.x, coords.y);
        points.push({ x: coords.x, y: coords.y, t: performance.now() });
    }
});

drawCanvas.addEventListener('pointermove', (event) => {
    if (!drawing) return;
    event.preventDefault();

    const coords = getDrawingCoordinates(event);
    if (coords) {
        drawCtx.lineTo(coords.x, coords.y);
        drawCtx.stroke();
        points.push({ x: coords.x, y: coords.y, t: performance.now() });
    }
});

drawCanvas.addEventListener('pointerup', (event) => {
    if (!drawing) return;
    event.preventDefault();
    drawing = false;
    finishDrawing();
});

drawCanvas.addEventListener('pointerleave', (event) => {
    if (drawing) {
        drawing = false;
    }
});

drawCanvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
}, false);

drawCanvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
}, false);

drawCanvas.addEventListener('touchend', (event) => {
    event.preventDefault();
}, false);

clearBtn.addEventListener('click', clearCanvas);

clearCanvas();
