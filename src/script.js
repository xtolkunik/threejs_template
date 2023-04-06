import './style.css'
import * as THREE from 'three';
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

gsap.registerPlugin(ScrollTrigger);

const COLORS = {
    background: 'white',
    light: "#ffffff",
    sky: '#aaaaff',
    ground: '#111111'
}

const PI = Math.PI;

// --- SCENE 
let size = { width: 0, height: 0 };

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.background);
scene.fog = new THREE.Fog(COLORS.background, 15, 20);


// --- RENDERER 
const renderer = new THREE.WebGLRenderer({ antialias: true });

/* renderer settings */
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* renderer автоматически создает canvas, если мы не указали его явно. Остается добавить его в наш html */
const container = document.querySelector('.canvas-container');
container.appendChild(renderer.domElement);

// -- CAMERA 
const camera = new THREE.PerspectiveCamera(40, size.width / size.height, 0.1, 100);
camera.position.set(0, 1, 3);
let cameraTarget = new THREE.Vector3(0, 0.5, 0);

scene.add(camera);

// -- LIGHTS 
const directonalLight = new THREE.DirectionalLight(COLORS.light, 2);
directonalLight.castShadow = true;
directonalLight.shadow.camera.far = 10;
directonalLight.shadow.mapSize.set(1024, 1024);
directonalLight.shadow.normalBias = 0.05;
directonalLight.position.set(2, 5, 3);

scene.add(directonalLight);

const hemisphereLight = new THREE.HemisphereLight(COLORS.sky, COLORS.ground, 0.5);
scene.add(hemisphereLight);




// --- FLOOR
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: COLORS.ground })
);
floor.receiveShadow = true;
floor.rotateX(-PI * 0.5);

scene.add(floor);

// --- ON RESIZE 
const onResize = () => {
    size.width = container.clientWidth;
    size.height = container.clientHeight;

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    renderer.setSize(size.width, size.height);
    // можно поставить один раз, но если мы перетащим на соседний монитор с другим pixel ratio, то он подгонит под него
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onResize);
onResize();

// --- TICK 
const tick = () => {
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    window.requestAnimationFrame(() => tick());
}

tick();


// -- GLTF LOADER 
const models = {}
/* set items to load, sources */
let toLoad = [
    { name: "box", path: "box.gltf" },
    { name: "shoes", path: "air.gltf" }
]
const setupAnimation = () => {
    models.box.position.set(-6, 0.1, 0);

    models.shoes.position.set(-5, 0.2, 0);
    //models.shoes.rotateY(PI * -0.5)


    const tl = gsap.timeline({
        default: {
            duration: 1,
        },
        scrollTrigger: {
            trigger: ".page",
            start: "top top",
            end: "bottom bottom",
            ease: "power2.out",
            scrub: 0.1,
            markers: true
        }
    });

    let section = 0;

    // section 1
    tl.to(models.box.position, { x: 0.8 }, section)
    tl.to(models.box.rotation, { y: 7.85 }, section)

    // section 2
    section += 1;
    tl.to(models.box.position, { x: 0, y: 0.7, z: 1.5 }, section)
    // tl.to(models.box.position, { z: 1 }, section)


    // section 3
    section += 1;
    tl.to(models.box.position, { x: 3 }, section)
    tl.to(models.shoes.position, { x: 0.3 }, section)
    tl.to(models.shoes.rotation, { y: 7.85 }, section)

}


const loadingManager = new THREE.LoadingManager(() => {
    setupAnimation();
})
const gltfLoader = new GLTFLoader(loadingManager);



/*start load models*/
toLoad.forEach(item => {
    gltfLoader.load(item.path, (model) => {
        model.scene.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.receiveShadow = true;
                child.castShadow = true;
            }
        })
        models[item.name] = model.scene;
        scene.add(models[item.name]);
    });
})

// --