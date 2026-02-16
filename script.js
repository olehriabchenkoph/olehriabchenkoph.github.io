
// Menu State: 0 = Intro, 1 = Docked, 2 = Open
let menuState = 0;
const EXPLOSION_RADIUS = 150;

// DOM Elements
const canvas = document.getElementById('canvas');
const container = document.getElementById('canvas-container');
const introBtn = document.getElementById('intro-btn');
const aboutBubble = document.getElementById('about-bubble');
const cursorDot = document.getElementById('cursor-dot');
const cursorCanvas = document.getElementById('cursor-canvas');
const ctx = cursorCanvas.getContext('2d');

// Physics Configuration
const FRICTION = 0.90;
const REPULSION_FORCE = 0.04;
const REPULSION_RADIUS = 350;
const MOUSE_THROW_FORCE = 0.3;

// Initial Burst Count
const INITIAL_BURST_COUNT = 15;
const STAGGER_DELAY = 100;

// Objects Array
let photos = [];
let staggerInterval = null;

// Z-Index Counter
let globalZ = 1000;

// --- INITIALIZATION ---
async function init() {
    // Resize cursor canvas
    resizeCursorCanvas();
    window.addEventListener('resize', resizeCursorCanvas);

    // Disable button initially
    introBtn.innerText = "Loading...";
    introBtn.style.pointerEvents = "none";
    introBtn.style.opacity = "0.5";

    if (typeof allImages !== 'undefined' && Array.isArray(allImages)) {
        allImages.forEach((src, index) => {
            createPhotoItem(src, index);
        });

        try {
            const decodePromises = photos.map(p => {
                const img = p.element.querySelector('img');
                return img.decode().catch(err => console.log('Decode error', err));
            });
            await Promise.all(decodePromises);
        } catch (e) {
            console.warn("Image decoding warning", e);
        }
    }

    // Enable button
    introBtn.innerText = "Click on me";
    introBtn.style.pointerEvents = "auto";
    introBtn.style.opacity = "1";

    // Initial transform
    scale = 2.5;
    updateCanvasTransform();

    requestAnimationFrame(physicsLoop);
    requestAnimationFrame(loopCursor); // Start loop for canvas trail

    // Intro Button Logic
    introBtn.addEventListener('click', handleMenuClick);

    // Cursor Listeners
    window.addEventListener('mousemove', updateCursor);
}

function createPhotoItem(src, index) {
    const div = document.createElement('div');
    div.classList.add('photo-item');
    div.classList.add('hidden-photo');
    div.style.transform = `translate(0px, 0px) rotate(0deg)`;

    const img = document.createElement('img');
    img.src = src;
    img.ondragstart = () => false;

    div.appendChild(img);
    canvas.appendChild(div);

    const photoObj = {
        element: div,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: (Math.random() - 0.5) * 10,
        width: 350, // Matches CSS
        height: 450,
        isDragging: false,
        isVisible: false
    };

    photos.push(photoObj);

    makeDraggable(div, photoObj);
}


// --- CURSOR LOGIC (CANVAS TRAIL) ---

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let points = [];

function resizeCursorCanvas() {
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
}

function updateCursor(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Move dot
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';

    // Add point for trail
    points.push({
        x: mouseX,
        y: mouseY,
        age: 0
    });
}

function loopCursor() {
    // Clear with fade effect? No, just clear and redraw all points with age
    ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    // Draw trail
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length > 1) {
        // Draw one continuous path? 
        // No, opacity changes per segment.
        // Let's iterate.

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            const opacity = 1 - (p1.age / 20); // Life of 20 frames
            if (opacity > 0) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                // Thickness tapers too?
                ctx.lineWidth = 4 * opacity;
                ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
                ctx.stroke();
            }
        }
    }

    // Age points
    for (let i = points.length - 1; i >= 0; i--) {
        points[i].age++;
        if (points[i].age > 20) {
            points.splice(i, 1);
        }
    }

    requestAnimationFrame(loopCursor);
}


// --- MENU STATE MACHINE ---

function handleMenuClick(e) {
    e.stopPropagation();

    if (menuState === 0) {
        canvas.classList.add('visible');
        startStaggeredExplosion();

        // ZOOM OUT MUCH MORE: 0.6 -> 0.25
        animateScale(0.25, 2500);

        introBtn.classList.add('docked');
        introBtn.innerText = "";
        menuState = 1;
    }
    else if (menuState === 1) {
        introBtn.classList.remove('docked');
        introBtn.classList.add('menu-open');
        introBtn.innerText = "Click on me";
        aboutBubble.classList.add('visible');
        menuState = 2;
    }
    else if (menuState === 2) {
        introBtn.classList.remove('menu-open');
        introBtn.classList.add('docked');
        introBtn.innerText = "";
        aboutBubble.classList.remove('visible');
        menuState = 1;
    }
}

function startStaggeredExplosion() {
    shuffleArray(photos);
    let visibleCount = 0;

    for (let i = 0; i < INITIAL_BURST_COUNT && i < photos.length; i++) {
        revealPhoto(photos[i]);
        visibleCount++;
    }

    if (visibleCount < photos.length) {
        staggerInterval = setInterval(() => {
            if (visibleCount >= photos.length && staggerInterval) {
                clearInterval(staggerInterval);
                return;
            }
            revealPhoto(photos[visibleCount]);
            visibleCount++;
        }, STAGGER_DELAY);
    }
}

function revealPhoto(p) {
    p.isVisible = true;
    p.element.classList.remove('hidden-photo');
    p.element.classList.add('visible-photo');

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * EXPLOSION_RADIUS;

    const tx = Math.cos(angle) * radius;
    const ty = Math.sin(angle) * radius;

    p.x = tx * 0.5;
    p.y = ty * 0.5;

    p.vx = (tx - p.x) * 0.05;
    p.vy = (ty - p.y) * 0.05;

    p.rotation = (Math.random() - 0.5) * 20;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function animateScale(target, duration) {
    const start = scale;
    const startTime = Date.now();

    function loop() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        scale = start + (target - start) * ease;
        updateCanvasTransform();

        if (progress < 1) requestAnimationFrame(loop);
    }
    loop();
}


// --- PHYSICS LOOP ---

function physicsLoop() {
    photos.forEach((p, i) => {
        if (!p.isVisible || p.isDragging) return;

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= FRICTION;
        p.vy *= FRICTION;

        const velocity = Math.abs(p.vx) + Math.abs(p.vy);
        if (velocity < 0.01) {
            p.vx = 0; p.vy = 0;
        }
    });

    for (let i = 0; i < photos.length; i++) {
        const p1 = photos[i];
        if (!p1.isVisible || p1.isDragging) continue;

        for (let j = i + 1; j < photos.length; j++) {
            const p2 = photos[j];
            if (!p2.isVisible) continue;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            if (Math.abs(dx) > REPULSION_RADIUS || Math.abs(dy) > REPULSION_RADIUS) continue;

            const distSq = dx * dx + dy * dy;
            const minDistSq = REPULSION_RADIUS * REPULSION_RADIUS;

            if (distSq < minDistSq && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = REPULSION_RADIUS - dist;
                const force = overlap * 0.02 * REPULSION_FORCE;

                if (!p1.isDragging) {
                    p1.vx -= nx * force;
                    p1.vy -= ny * force;
                }
                if (!p2.isDragging) {
                    p2.vx += nx * force;
                    p2.vy += ny * force;
                }
            }
        }
    }

    photos.forEach(p => {
        if (p.isVisible) {
            p.element.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
        }
    });

    requestAnimationFrame(physicsLoop);
}


// --- INTERACTION ---
let scale = 1;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

function makeDraggable(el, p) {
    let startX, startY;
    let lastX, lastY;
    let lastTime;

    el.addEventListener('mousedown', (e) => {
        e.stopPropagation();

        // BRING TO FRONT logic
        globalZ++;
        el.style.zIndex = globalZ;

        p.isDragging = true;
        el.classList.add('dragging');

        startX = e.clientX;
        startY = e.clientY;
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = Date.now();

        p.vx = 0;
        p.vy = 0;

        const onMouseMove = (moveEvent) => {
            if (!p.isDragging) return;
            moveEvent.preventDefault();

            const cx = moveEvent.clientX;
            const cy = moveEvent.clientY;

            // Adjust for scale
            const dx = (cx - startX) / scale;
            const dy = (cy - startY) / scale;

            p.x += dx;
            p.y += dy;

            const now = Date.now();
            const dt = now - lastTime;

            if (dt > 0) {
                const dragVx = ((cx - lastX) / scale) * MOUSE_THROW_FORCE;
                const dragVy = ((cy - lastY) / scale) * MOUSE_THROW_FORCE;

                p.vx = dragVx * 5;
                p.vy = dragVy * 5;
            }

            startX = cx;
            startY = cy;
            lastX = cx;
            lastY = cy;
            lastTime = now;

            el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
        };

        const onMouseUp = () => {
            p.isDragging = false;
            el.classList.remove('dragging');
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}

// --- CANVAS PAN & ZOOM ---

container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left - centerX;
    const mouseY = e.clientY - rect.top - centerY;

    // Zoom to point logic
    // World point before zoom
    const pointWorldX = (mouseX - translateX) / scale;
    const pointWorldY = (mouseY - translateY) / scale;

    scale += delta;
    scale = Math.max(0.1, Math.min(scale, 5));

    // Calculate new translate to keep World point at same screen pos
    // mouseX = pointWorldX * scale + newTranslate
    // newTranslate = mouseX - pointWorldX * scale

    translateX = mouseX - pointWorldX * scale;
    translateY = mouseY - pointWorldY * scale;

    updateCanvasTransform();
}, { passive: false });

container.addEventListener('mousedown', (e) => {
    if (e.target === container || e.target === canvas) {
        isPanning = true;
        startPanX = e.clientX - translateX;
        startPanY = e.clientY - translateY;
        container.style.cursor = 'none';
    }
});

window.addEventListener('mousemove', (e) => {
    if (isPanning) {
        e.preventDefault();
        translateX = e.clientX - startPanX;
        translateY = e.clientY - startPanY;
        updateCanvasTransform();
    }
});

window.addEventListener('mouseup', () => {
    isPanning = false;
});

function updateCanvasTransform() {
    canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Start
init();
