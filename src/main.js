import './style.css';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.1, 2); // Fixed camera position

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Set pixel ratio (max 2)
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// Textures for spheres
const textures = [
  "./mercury/mercury.webp",
  "./venus/map.webp",
  "./earth/map.webp",
  "./mars/mars.webp",
  "./jupiter/jupiter.webp",
  "./saturn/saturn.webp",
  "./uranus/uranus.webp",
  "./neptune/neptune.webp"
];

const planetNames = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune"
];
const planetDescriptions = [
  "The smallest planet in our solar system, known for its extreme temperatures and lack of atmosphere.",
  "Known as Earth's twin due to its similar size, but with a toxic atmosphere and intense surface heat.",
  "Our home planet, the only known world teeming with diverse life and vast oceans.",
  "The red planet, with its dusty terrain and polar ice caps, is a potential second home for humanity.",
  "The largest planet, famous for its Great Red Spot, a massive storm persisting for centuries.",
  "Renowned for its stunning ring system, this gas giant has dozens of moons, including Titan.",
  "An ice giant with a unique sideways rotation, characterized by its pale blue-green hue.",
  "The farthest planet, a deep blue ice giant with the fastest winds in the solar system."
];

const centralHeading = document.querySelector('.head');
const descriptionElement = document.querySelector('.desc');
function updateCentralHeading(index, direction) {
  // Determine the direction of the scroll
  const offset = direction > 0 ? 50 : -50; // Positive for scroll in, negative for scroll out

  // Fade out and move the heading
  gsap.to([centralHeading, descriptionElement], {
    duration: 0.5,
    y: 0, // Move up or down based on scroll direction
    opacity: 0,
    onComplete: () => {
      // Update the text after fade-out
      centralHeading.textContent = planetNames[index];
      centralHeading.style.transform = `translateY(${offset}px)`; // Reset position off-screen

      descriptionElement.textContent = planetDescriptions[index];
      descriptionElement.style.transform = `translateY(${offset}px)`; // Reset position off-screen

      // Fade in and move the heading back into view
      gsap.to([centralHeading, descriptionElement], {
        duration: 0.5,
        y: 450, // Reset to original position
        opacity: 1,
        ease: "power1.inOut"
      });
    }
  });
}


// Sphere setup
const sphereRadius = 1.0;
const sphereSegments = 32;
const sphereCount = 8;
const sphereSpacing = 4;
const spheres = [];
const group = new THREE.Group(); // Group to manage spheres
let saturnRings=new THREE.Mesh();
textures.forEach((texturePath, index) => {
  const geometry = new THREE.SphereGeometry(sphereRadius, sphereSegments, sphereSegments);
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.1,
    roughness: 0.6
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.z = -index * sphereSpacing; // Arrange along -Z axis
  sphere.position.y = -1; // Shift spheres downward

  if (index === 5) { // Add rings to Saturn
    const ringGeometry = new THREE.RingGeometry(1.2, 2.0, 64);
    const ringTexture = textureLoader.load('./saturn/rings2.webp'); // Ensure transparency
    ringTexture.colorSpace = THREE.SRGBColorSpace;
    ringTexture.wrapS = THREE.RepeatWrapping; // Horizontal wrapping
    ringTexture.wrapT = THREE.RepeatWrapping; // Vertical wrapping
    ringTexture.repeat.set(1, 1); // Ensure no tiling

    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide, // Ensure visibility from both sides
      transparent: true,
    });

    saturnRings = new THREE.Mesh(ringGeometry, ringMaterial);
    saturnRings.rotation.x = Math.PI / 2; // Align with equatorial plane
    saturnRings.position.copy(sphere.position); // Match Saturn's position
    group.add(saturnRings);
  }

  group.add(sphere);
  spheres.push(sphere);
});

scene.add(group);

// Animate spheres into position
const tl = gsap.timeline();

spheres.forEach((sphere, index) => {
  sphere.position.y = -4; // Start below the scene

  // Add to GSAP timeline
  tl.to(sphere.position, {
    duration: 1,
    y: -1, // Final position
    ease: "power2.out",
    delay: index * 0.15, // Stagger delay for each sphere
  }, index * 0.15 ,); // Start times staggered

});
saturnRings.position.y = -4; 
// Animate Saturn's rings with a staggered delay
tl.to(saturnRings.position, {
  duration: 1,
  y: -1, // Final position of Saturn's rings
  ease: "power2.out" // Delay after all spheres are animated
},0.15*7);


// Environment setup (HDR background)
new RGBELoader().load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

// Starfield background
const starGeometry = new THREE.SphereGeometry(50, 64, 64);
const starTextureLoader = new THREE.TextureLoader();
const starTexture = starTextureLoader.load('./public/stars.webp');
starTexture.colorSpace = THREE.SRGBColorSpace;

const starMaterial = new THREE.MeshBasicMaterial({
  map: starTexture,
  side: THREE.BackSide, // Render inside of sphere
  transparent: true,
  opacity: 0.5
});

const starSphere = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starSphere);

// Group rotation
group.rotation.x = Math.PI / 20; // Rotate group along X-axis

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Scroll functionality
let currentSphereIndex = 0;
const scrollDelay = 1000; // 1 second delay between scrolls
let lastScrollTime = 0;

function handleScroll(event) {
  const currentTime = Date.now();
  if (currentTime - lastScrollTime < scrollDelay) return; // Throttle scroll events
  lastScrollTime = currentTime;

  const direction = event.deltaY > 0 ? 1 : -1; // Determine scroll direction
  const nextIndex = currentSphereIndex + direction;

  // Prevent scrolling beyond bounds
  if (nextIndex < 0 || nextIndex >= sphereCount) return;

  currentSphereIndex = nextIndex;
  const newZPosition = group.position.z + direction * sphereSpacing;
  const newYPosition = group.position.y - direction * 0.65;

  // Animate group movement
  gsap.to(group.position, {
    duration: 1,
    z: newZPosition,
    y: newYPosition,
    ease: 'power2.inOut'
  });

  updateCentralHeading(currentSphereIndex); // Update the central heading
}

window.addEventListener('wheel', handleScroll);

// Planet selection functionality
const planetDivs = document.querySelectorAll('.left div');
planetDivs.forEach((div, index) => {
  div.addEventListener('click', () => {
    const move = index - currentSphereIndex;
    const newZPosition = group.position.z + move * sphereSpacing;
    const newYPosition = group.position.y - move * 0.65;

    // Animate group movement to the selected sphere
    gsap.to(group.position, {
      duration: 1,
      z: newZPosition,
      y: newYPosition,
      ease: 'power2.inOut'
    });

    currentSphereIndex = index; // Update current sphere index
    updateCentralHeading(currentSphereIndex); // Update the central heading
  });
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Rotate each sphere around its Y axis
  const planetData = [
    { name: 'Mercury', rotationSpeed: 0.5 },
    { name: 'Venus', rotationSpeed: -0.1 },
    { name: 'Earth', rotationSpeed: 0.5 },
    { name: 'Mars', rotationSpeed: 0.4 },
    { name: 'Jupiter', rotationSpeed: 1.0 },
    { name: 'Saturn', rotationSpeed: 0.9 },
    { name: 'Uranus', rotationSpeed: -0.3 },
    { name: 'Neptune', rotationSpeed: 0.6 }
  ];
  
  spheres.forEach((sphere, index) => {
    sphere.rotation.y += delta * planetData[index].rotationSpeed;
  });
  starSphere.rotation.y += delta * 0.01;

  renderer.render(scene, camera);
}

animate();

// Toggle menu visibility on mobile (if needed)
document.addEventListener('DOMContentLoaded', function() {
  const tl = gsap.timeline();

  tl.to(".left", {
    delay:2,
    duration: 1,        
    opacity: 1,
    ease: "power2.inOut" // Apply smooth easing
  },'b');
 tl.to("nav h1", {
    delay:2,
    duration: 1,        
    opacity: 1,
    ease: "power2.inOut" // Apply smooth easing
  },'b');
  tl.to(".head", {
    y: 450,
    duration: 1,
    opacity: 1,
    ease: "power2.inOut" // Apply smooth easing
  },'a');
  tl.to(".desc", {
    y: 450,
    duration: 1,
    opacity: 1,
    ease: "power2.inOut" // Apply smooth easing
  },'a');
});
