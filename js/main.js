import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const INTRO_CONFIG = { startZ: -20, endZ: 2, startScale: 0.2, endScale: 1.8, rotationY: 0 };
const ECOSYSTEM_CONFIG = { startX: 0, endX: -5, startY: 0, endY: 0.2, startZ: 2, endZ: -3, startScale: 1.8, endScale: 0.7, startRotY: 0, endRotY: Math.PI/2 + 0.2, startRotX: 0, endRotX: 0.03, startRotZ: 0, endRotZ: 0.08 };
const ECOSYSTEM_START_SCENE = 5;
const ECOSYSTEM_END_SCENE = 7;

const SWIM_SCENES = {
    8: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    9: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    10: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    11: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    12: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    13: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    14: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    15: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    16: { pos: { x: -5, y: 0.2, z: -3 }, rot: { x: 0.03, y: Math.PI/2 + 0.2, z: 0.08 }, scale: 0.7 },
    17: { pos: { x: -2, y: 0, z: 0 }, rot: { x: -0.3, y: Math.PI/4, z: 0.1 }, scale: 1.2, showBoat: true },
    18: { pos: { x: -1, y: 1.5, z: 1 }, rot: { x: -0.4, y: 0.2, z: 0.05 }, scale: 1.3, showBoat: true },
    19: { pos: { x: 0, y: 2.5, z: 2 }, rot: { x: -0.5, y: 0, z: 0 }, scale: 1.4, showBoat: true },
    20: { pos: { x: 0.5, y: 3, z: 2.5 }, rot: { x: -0.4, y: -0.1, z: 0.05 }, scale: 1.5, showBoat: true },
    21: { pos: { x: 1, y: 3.5, z: 3 }, rot: { x: -0.3, y: -0.2, z: 0.08 }, scale: 1.4, showBoat: true },
    22: { pos: { x: 1.5, y: 3, z: 2.5 }, rot: { x: -0.2, y: -0.3, z: 0.05 }, scale: 1.3, showBoat: true },
    23: { pos: { x: -3, y: 2, z: 2 }, rot: { x: -0.1, y: -Math.PI/2, z: 0.05 }, scale: 1.0 },
    24: { pos: { x: -4, y: 1, z: 1 }, rot: { x: 0, y: -Math.PI/2 - 0.2, z: 0.08 }, scale: 0.9 },
    25: { pos: { x: -3.5, y: 0.8, z: 0.5 }, rot: { x: -0.02, y: -Math.PI/2 - 0.1, z: 0.04 }, scale: 0.95 },
    26: { pos: { x: -3.5, y: 0.8, z: 0.5 }, rot: { x: -0.02, y: -Math.PI/2 - 0.1, z: 0.04 }, scale: 0.95 },
    27: { pos: { x: -4, y: 0.6, z: 0.3 }, rot: { x: -0.03, y: -Math.PI/2 - 0.15, z: 0.03 }, scale: 0.9 },
    28: { pos: { x: -4, y: 0.6, z: 0.3 }, rot: { x: -0.03, y: -Math.PI/2 - 0.15, z: 0.03 }, scale: 0.9 },
    29: { pos: { x: -4.5, y: 0.5, z: 0 }, rot: { x: 0.05, y: -Math.PI/2 - 0.1, z: 0.05 }, scale: 0.85 },
    30: { pos: { x: -4.5, y: 0.5, z: 0 }, rot: { x: 0.05, y: -Math.PI/2 - 0.1, z: 0.05 }, scale: 0.85 },
    31: { pos: { x: -5, y: 0, z: -1 }, rot: { x: 0.1, y: -Math.PI/2, z: 0 }, scale: 0.8 },
    32: { pos: { x: -3, y: -2, z: -2 }, rot: { x: 0.3, y: -Math.PI/2 + 0.3, z: 0.1 }, scale: 0.9, darken: 0.4 },
    33: { pos: { x: -2, y: -3, z: -3 }, rot: { x: 0.4, y: -Math.PI/2, z: 0.05 }, scale: 0.85, darken: 0.5 },
    34: { pos: { x: -1, y: -1, z: -1 }, rot: { x: -0.3, y: -Math.PI/2 - 0.2, z: 0 }, scale: 0.9, darken: 0.3 },
    35: { pos: { x: 0, y: 1, z: 0 }, rot: { x: -0.4, y: -Math.PI/3, z: 0.05 }, scale: 1.0, darken: 0.2 },
    36: { pos: { x: 1, y: 2, z: 1 }, rot: { x: -0.3, y: -Math.PI/4, z: 0 }, scale: 1.1, darken: 0.1 },
    37: { pos: { x: 2, y: 1, z: 2 }, rot: { x: -0.1, y: 0, z: 0 }, scale: 1.2 },
    38: { pos: { x: 1, y: 0, z: 3 }, rot: { x: 0, y: 0.2, z: 0.1 }, scale: 1.4 },
    39: { pos: { x: 0, y: -0.5, z: 3 }, rot: { x: 0.2, y: 0.3, z: 0.2 }, scale: 1.3, showNet: true, struggle: true },
    40: { pos: { x: -0.5, y: -1, z: 2.5 }, rot: { x: 0.3, y: 0.4, z: 0.3 }, scale: 1.2, showNet: true, struggle: true },
    41: { pos: { x: -1, y: -1.5, z: 2 }, rot: { x: 0.4, y: 0.2, z: 0.2 }, scale: 1.1, showNet: false },
    42: { pos: { x: -2, y: -0.5, z: 0 }, rot: { x: 0.1, y: -Math.PI/2, z: 0 }, scale: 0.9 },
    43: { pos: { x: -3, y: -1, z: -1 }, rot: { x: 0.15, y: -Math.PI/2 + 0.1, z: -0.05 }, scale: 0.8 },
    44: { pos: { x: -2.5, y: -0.8, z: -0.5 }, rot: { x: 0.12, y: -Math.PI/2 + 0.15, z: -0.03 }, scale: 0.82 },
    45: { pos: { x: -2.5, y: -0.8, z: -0.5 }, rot: { x: 0.12, y: -Math.PI/2 + 0.15, z: -0.03 }, scale: 0.82 },
    46: { pos: { x: -2.2, y: -0.6, z: -0.3 }, rot: { x: 0.1, y: -Math.PI/2 + 0.2, z: 0 }, scale: 0.85 },
    47: { pos: { x: -2.2, y: -0.6, z: -0.3 }, rot: { x: 0.1, y: -Math.PI/2 + 0.2, z: 0 }, scale: 0.85 },
    48: { pos: { x: 2, y: 0, z: 0 }, rot: { x: -0.05, y: 0.3, z: 0.05 }, scale: 1.3 },
    49: { pos: { x: 0, y: 0.2, z: 2 }, rot: { x: -0.03, y: 0, z: 0 }, scale: 1.6 },
    50: { pos: { x: 0, y: 0, z: 3 }, rot: { x: 0, y: 0, z: 0 }, scale: 1.8 }
};

const INTRO_SCENE_COUNT = 5;

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x4a6fa5, 0.6));
const topLight = new THREE.DirectionalLight(0xfffbe3, 1.0);
topLight.position.set(0, 10, 5);
scene.add(topLight);
const fillLight = new THREE.DirectionalLight(0x6ab7ff, 0.4);
fillLight.position.set(-5, -3, 2);
scene.add(fillLight);

const sharkGroup = new THREE.Group();
const boatGroup = new THREE.Group();
const diverGroup = new THREE.Group();
scene.add(sharkGroup);
scene.add(boatGroup);
scene.add(diverGroup);
boatGroup.visible = false;
diverGroup.visible = false;

let sharkMixer = null;
let diverMixer = null;
let targetRotation = { x: 0, y: 0, z: 0 };
let currentScene = 0;
let isStruggling = false;

const particleCount = 150;
const particleGeom = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
}
particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(particleGeom, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 }));
scene.add(particles);

const loader = new GLTFLoader();

loader.load('assets/models/shark.glb', (gltf) => {
    const shark = gltf.scene;
    shark.scale.set(1, 1, 1);
    sharkGroup.add(shark);
    sharkGroup.position.set(0, 0, INTRO_CONFIG.startZ);
    sharkGroup.scale.setScalar(INTRO_CONFIG.startScale);
    if (gltf.animations.length > 0) {
        sharkMixer = new THREE.AnimationMixer(shark);
        const action = sharkMixer.clipAction(gltf.animations[0]);
        action.play();
    }
    document.getElementById('loading').classList.add('hidden');
}, undefined, (error) => { console.error('Error loading shark:', error); });

loader.load('assets/models/boat.glb', (gltf) => {
    const boat = gltf.scene;
    boat.scale.set(0.8, 0.8, 0.8);
    boat.rotation.y = Math.PI / 2;
    boatGroup.add(boat);
    boatGroup.position.set(0, 14, 5);
}, undefined, (error) => { console.error('Error loading boat:', error); });

loader.load('assets/models/diver.glb', (gltf) => {
    const diver = gltf.scene;
    diver.scale.set(0.5, 0.5, 0.5);
    diverGroup.add(diver);
    diverGroup.position.set(2, 0, 1);
    if (gltf.animations.length > 0) {
        diverMixer = new THREE.AnimationMixer(diver);
        const action = diverMixer.clipAction(gltf.animations[0]);
        action.play();
    }
}, undefined, (error) => { console.error('Error loading diver:', error); });

function setBoatOpacity(opacity) {
    boatGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = opacity;
        }
    });
}

function showDiver() {
    diverGroup.visible = true;
    diverGroup.position.set(2, 0, 1);
    gsap.to(diverGroup.position, { y: 0.5, duration: 1.5, ease: "power2.out" });
}

function hideDiver() {
    gsap.to(diverGroup.position, { y: -2, duration: 1, ease: "power2.in", onComplete: () => diverGroup.visible = false });
}

function animateBoat(time) {
    if (boatGroup.visible) {
        boatGroup.position.y += Math.sin(time * 0.5) * 0.002;
        boatGroup.rotation.z = Math.sin(time * 0.3) * 0.02;
        boatGroup.rotation.x = Math.sin(time * 0.4) * 0.01;
    }
}

gsap.registerPlugin(ScrollTrigger);

const scenes = document.querySelectorAll('.scene');
const introScenes = Array.from(scenes).slice(0, INTRO_SCENE_COUNT);
const ecosystemScenes = Array.from(scenes).slice(ECOSYSTEM_START_SCENE, ECOSYSTEM_END_SCENE + 1);

ScrollTrigger.create({
    trigger: introScenes[0],
    start: "top top",
    endTrigger: introScenes[introScenes.length - 1],
    end: "bottom bottom",
    scrub: 1.5,
    onUpdate: (self) => {
        const progress = self.progress;
        sharkGroup.position.z = INTRO_CONFIG.startZ + (INTRO_CONFIG.endZ - INTRO_CONFIG.startZ) * progress;
        sharkGroup.scale.setScalar(INTRO_CONFIG.startScale + (INTRO_CONFIG.endScale - INTRO_CONFIG.startScale) * progress);
        sharkGroup.position.x = 0;
        sharkGroup.position.y = 0;
        sharkGroup.rotation.set(0, 0, 0);
        targetRotation = { x: 0, y: 0, z: 0 };
    }
});

ScrollTrigger.create({
    trigger: ecosystemScenes[0],
    start: "top top",
    endTrigger: ecosystemScenes[ecosystemScenes.length - 1],
    end: "bottom bottom",
    scrub: 0.5,
    onUpdate: (self) => {
        const p = self.progress;
        const cfg = ECOSYSTEM_CONFIG;
        sharkGroup.position.x = cfg.startX + (cfg.endX - cfg.startX) * p;
        sharkGroup.position.y = cfg.startY + (cfg.endY - cfg.startY) * p;
        sharkGroup.position.z = cfg.startZ + (cfg.endZ - cfg.startZ) * p;
        sharkGroup.scale.setScalar(cfg.startScale + (cfg.endScale - cfg.startScale) * p);
        sharkGroup.rotation.x = cfg.startRotX + (cfg.endRotX - cfg.startRotX) * p;
        sharkGroup.rotation.y = cfg.startRotY + (cfg.endRotY - cfg.startRotY) * p;
        sharkGroup.rotation.z = cfg.startRotZ + (cfg.endRotZ - cfg.startRotZ) * p;
        targetRotation = { x: sharkGroup.rotation.x, y: sharkGroup.rotation.y, z: sharkGroup.rotation.z };
    }
});

scenes.forEach((sceneEl, index) => {
    const text = sceneEl.querySelector('.scene-text');
    ScrollTrigger.create({
        trigger: sceneEl,
        start: "top 70%",
        end: "bottom 30%",
        onEnter: () => showText(text, index, sceneEl),
        onEnterBack: () => showText(text, index, sceneEl),
        onLeave: () => hideText(text, sceneEl, index),
        onLeaveBack: () => hideText(text, sceneEl, index),
    });
});

function showText(textEl, sceneIndex, sceneEl) {
    document.querySelectorAll('.scene-text').forEach(t => t.classList.remove('visible'));
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    
    if (textEl) textEl.classList.add('visible');
    sceneEl.classList.add('active');
    currentScene = sceneIndex;
    
    if (sceneIndex > ECOSYSTEM_END_SCENE && SWIM_SCENES[sceneIndex]) {
        moveSharkTo(SWIM_SCENES[sceneIndex]);
    }
    
    createBubbles();
}

function hideText(textEl, sceneEl, sceneIndex) {
    if (textEl) textEl.classList.remove('visible');
    sceneEl.classList.remove('active');
}

function moveSharkTo(config) {
    gsap.to(sharkGroup.position, { x: config.pos.x, y: config.pos.y, z: config.pos.z, duration: 3, ease: "power1.inOut" });
    gsap.to(sharkGroup.scale, { x: config.scale, y: config.scale, z: config.scale, duration: 3, ease: "power1.inOut" });
    targetRotation = { ...config.rot };
    
    const darkOverlay = document.getElementById('dark-overlay');
    if (config.darken) {
        gsap.to(darkOverlay, { backgroundColor: `rgba(0, 0, 0, ${config.darken})`, duration: 1 });
    } else {
        gsap.to(darkOverlay, { backgroundColor: 'rgba(0, 0, 0, 0)', duration: 1 });
    }
    
    isStruggling = config.struggle || false;
    
    const net = document.getElementById('fishing-net');
    if (net) gsap.to(net, { opacity: config.showNet ? 1 : 0, duration: 0.8 });
    
    if (config.showBoat) {
        boatGroup.visible = true;
        setBoatOpacity(0.7);
        gsap.to(boatGroup.position, { y: 8, duration: 1, ease: "power2.out" });
    } else if (boatGroup.visible) {
        gsap.to(boatGroup.position, { y: 14, duration: 1.4, ease: "power2.in", onComplete: () => boatGroup.visible = false });
    }

    if (config.showDiver) showDiver();
    else if (diverGroup.visible) hideDiver();
}

ScrollTrigger.create({
    trigger: scenes[0],
    start: "top top-=50",
    onEnter: () => document.querySelector('.scroll-indicator').classList.add('hidden'),
    onLeaveBack: () => document.querySelector('.scroll-indicator').classList.remove('hidden'),
});

function createBubbles() {
    const container = document.getElementById('bubbles');
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.className = 'bubble-effect';
            const size = Math.random() * 15 + 8;
            bubble.style.cssText = `width: ${size}px; height: ${size}px; left: ${Math.random() * window.innerWidth}px; top: ${Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.3}px;`;
            container.appendChild(bubble);
            setTimeout(() => bubble.remove(), 4000);
        }, i * 150);
    }
}

const clock = new THREE.Clock();
let time = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    time += delta;
    if (sharkMixer) sharkMixer.update(delta);
    if (diverMixer) diverMixer.update(delta);
    
    if (currentScene > ECOSYSTEM_END_SCENE) {
        const lerpSpeed = 0.04;
        sharkGroup.rotation.x += (targetRotation.x - sharkGroup.rotation.x) * lerpSpeed;
        sharkGroup.rotation.y += (targetRotation.y - sharkGroup.rotation.y) * lerpSpeed;
        sharkGroup.rotation.z += (targetRotation.z - sharkGroup.rotation.z) * lerpSpeed;
        
        if (isStruggling) {
            sharkGroup.rotation.z += Math.sin(time * 8) * 0.05;
            sharkGroup.rotation.x += Math.sin(time * 6) * 0.03;
            sharkGroup.position.x += Math.sin(time * 5) * 0.01;
        } else {
            sharkGroup.rotation.z += Math.sin(time * 1.5) * 0.01;
            sharkGroup.rotation.x += Math.sin(time * 0.8) * 0.005;
        }
    }
    
    const pos = particleGeom.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += 0.006;
        if (pos[i * 3 + 1] > 12) {
            pos[i * 3 + 1] = -12;
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        pos[i * 3] += Math.sin(time * 0.5 + i * 0.1) * 0.002;
    }
    particleGeom.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.0002;
    
    animateBoat(time);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let sightingsChartInitialized = false;
let bodymapInitialized = false;
let bubbleChartInitialized = false;
let mortalityChartInitialized = false;
let choroplethInitialized = false;
let radialChartInitialized = false;

const chartObserver = new MutationObserver(() => {
    const activeScene = document.querySelector('.scene.active');
    if (activeScene) {
        if (!sightingsChartInitialized && activeScene.querySelector('#sightings-chart') && typeof window.renderSightingsOverTimeSharkbase === 'function') {
            window.renderSightingsOverTimeSharkbase({ containerId: "#sightings-chart", dataPath: "data/sharkbase.csv", width: 720, height: 420 });
            sightingsChartInitialized = true;
        }
        if (!bodymapInitialized && activeScene.querySelector('#bodymap-root') && typeof window.initBodyMap === 'function') {
            window.initBodyMap();
            bodymapInitialized = true;
        }
        if (!bubbleChartInitialized && activeScene.querySelector('#bubble-chart') && typeof window.loadBubbleData === 'function') {
            window.loadBubbleData();
            bubbleChartInitialized = true;
        }
        if (!mortalityChartInitialized && activeScene.querySelector('#GlobalMortChart') && typeof window.loadMortalityData === 'function') {
            window.loadMortalityData();
            window.createMortalityLegend('chart-container');
            mortalityChartInitialized = true;
        }
        if (!choroplethInitialized && activeScene.querySelector('#choropleth-map') && typeof window.ChoroplethMap === 'function') {
            window.choroplethMap = new window.ChoroplethMap('choropleth-map');
            window.choroplethMap.loadData('data/world-110m.json', 'data/total_mortality_estimate_eez.csv');
            choroplethInitialized = true;
        }
        if (!radialChartInitialized && activeScene.querySelector('#vis6-container') && typeof window.initRadialChart === 'function') {
            window.initRadialChart();
            radialChartInitialized = true;
        }
    }
});
chartObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

animate();
