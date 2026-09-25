import * as THREE from 'three';
import { AntiqueItem } from '../types/game';
import { soundManager } from '../audio/soundManager';

export type RestorationTool = 'inspect' | 'cleaner' | 'polisher' | 'gear_tuner' | 'gold_inlay';

export class ThreeRestorationScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private currentItemMesh: THREE.Group | null = null;
  private currentItem: AntiqueItem | null = null;
  private activeTool: RestorationTool = 'inspect';

  // Rotation & touch tracking
  private isPointerDown = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private targetRotation = { x: 0.2, y: -0.4 };
  private currentRotation = { x: 0.2, y: -0.4 };

  // Particles
  private sparkParticles: THREE.Points | null = null;
  private sparkVelocities: Float32Array | null = null;
  private sparkCount = 80;

  // Gold dust particles
  private goldParticles: THREE.Points | null = null;

  // Raycaster for surface cleaning
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  // Callbacks
  public onProgressUpdate?: (item: AntiqueItem) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1412); // Deep rich studio dark green/black

    // Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 4.2);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupParticles();
    this.setupEvents();
    this.animate();
  }

  private setupLighting() {
    // Warm ambient light
    const ambient = new THREE.AmbientLight(0xf4e8d0, 0.9);
    this.scene.add(ambient);

    // Key Light (warm gold antique spotlight)
    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    // Fill Light (soft warm brass bounce)
    const fillLight = new THREE.DirectionalLight(0xd4af37, 1.0);
    fillLight.position.set(-3, 1, 2);
    this.scene.add(fillLight);

    // Rim Light (cool teal rim light for dramatic antique contrast)
    const rimLight = new THREE.DirectionalLight(0x7ed0b0, 1.8);
    rimLight.position.set(0, -3, -3);
    this.scene.add(rimLight);

    // Floor pedestal shadow receiver
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.25, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x141b18,
      roughness: 0.8,
      metalness: 0.2
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.35;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Velvet top ring on pedestal
    const velvetGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 48);
    const velvetMat = new THREE.MeshStandardMaterial({
      color: 0x4a121a, // Dark burgundy velvet
      roughness: 0.95,
      metalness: 0.05
    });
    const velvet = new THREE.Mesh(velvetGeo, velvetMat);
    velvet.position.y = -1.2;
    velvet.receiveShadow = true;
    this.scene.add(velvet);
  }

  private setupParticles() {
    // Spark particles for laser cleaning
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sparkCount * 3);
    this.sparkVelocities = new Float32Array(this.sparkCount * 3);

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 0.08;
      this.sparkVelocities[i * 3 + 1] = Math.random() * 0.08 + 0.02;
      this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0xffbb33,
      size: 0.08,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    this.sparkParticles = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(this.sparkParticles);

    // Gold sparkles
    const goldGeo = new THREE.BufferGeometry();
    const goldPos = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      goldPos[i * 3] = (Math.random() - 0.5) * 2;
      goldPos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      goldPos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    goldGeo.setAttribute('position', new THREE.BufferAttribute(goldPos, 3));
    const goldMat = new THREE.PointsMaterial({
      color: 0xf5cf6d,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    this.goldParticles = new THREE.Points(goldGeo, goldMat);
    this.scene.add(this.goldParticles);
  }

  public setTool(tool: RestorationTool) {
    this.activeTool = tool;
  }

  public loadItem(item: AntiqueItem) {
    this.currentItem = item;
    if (this.currentItemMesh) {
      this.scene.remove(this.currentItemMesh);
      this.currentItemMesh = null;
    }

    this.currentItemMesh = this.createItemModel(item);
    this.scene.add(this.currentItemMesh);
    this.applyRestorationVisuals();
  }

  private createItemModel(item: AntiqueItem): THREE.Group {
    const group = new THREE.Group();
    group.castShadow = true;
    group.receiveShadow = true;

    // Build procedural 3D model according to item.modelKey
    switch (item.modelKey) {
      case 'pocket_watch':
        this.buildPocketWatch(group);
        break;
      case 'spyglass':
        this.buildSpyglass(group);
        break;
      case 'lamp':
        this.buildLamp(group);
        break;
      case 'coffee_grinder':
        this.buildCoffeeGrinder(group);
        break;
      case 'dagger':
        this.buildDagger(group);
        break;
      case 'radio':
        this.buildRadio(group);
        break;
      case 'roman_coin':
        this.buildRomanCoin(group);
        break;
      case 'camera':
        this.buildCamera(group);
        break;
      default:
        this.buildPocketWatch(group);
    }

    group.position.set(0, 0, 0);
    return group;
  }

  // --- Procedural 3D Item Builders ---

  private buildPocketWatch(group: THREE.Group) {
    // Outer casing (Torus + back plate)
    const rimGeo = new THREE.TorusGeometry(0.85, 0.16, 24, 48);
    const rimMesh = new THREE.Mesh(rimGeo, this.createMetalMaterial('brass'));
    rimMesh.castShadow = true;
    rimMesh.name = 'brass_metal';
    group.add(rimMesh);

    const backGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.18, 36);
    backGeo.rotateX(Math.PI / 2);
    const backMesh = new THREE.Mesh(backGeo, this.createMetalMaterial('brass'));
    backMesh.position.z = -0.06;
    backMesh.castShadow = true;
    backMesh.name = 'brass_metal';
    group.add(backMesh);

    // Watch face dial
    const dialGeo = new THREE.CircleGeometry(0.8, 36);
    const dialMat = new THREE.MeshStandardMaterial({
      color: 0xfdfbf7, // Vintage ivory
      roughness: 0.5,
      metalness: 0.1
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.z = 0.06;
    dialMesh.name = 'dial_face';
    group.add(dialMesh);

    // Inner gears
    for (let i = 0; i < 3; i++) {
      const gearGeo = new THREE.CylinderGeometry(0.25 - i * 0.05, 0.25 - i * 0.05, 0.04, 16);
      gearGeo.rotateX(Math.PI / 2);
      const gearMesh = new THREE.Mesh(gearGeo, this.createMetalMaterial('brass'));
      gearMesh.position.set(0.18 * (i === 1 ? -1 : 1), 0.12 * (i - 1), 0.08);
      gearMesh.name = 'gear_mesh';
      group.add(gearMesh);
    }

    // Top loop & crown
    const loopGeo = new THREE.TorusGeometry(0.24, 0.05, 16, 24);
    const loopMesh = new THREE.Mesh(loopGeo, this.createMetalMaterial('brass'));
    loopMesh.position.set(0, 1.05, 0);
    loopMesh.name = 'brass_metal';
    group.add(loopMesh);
  }

  private buildSpyglass(group: THREE.Group) {
    // 3 Telescopic tubes
    const tube1 = new THREE.CylinderGeometry(0.28, 0.32, 1.2, 32);
    tube1.rotateZ(Math.PI / 4);
    const mesh1 = new THREE.Mesh(tube1, this.createMetalMaterial('brass'));
    mesh1.castShadow = true;
    mesh1.name = 'brass_metal';
    group.add(mesh1);

    const tube2 = new THREE.CylinderGeometry(0.22, 0.26, 1.0, 32);
    tube2.rotateZ(Math.PI / 4);
    const mesh2 = new THREE.Mesh(tube2, this.createMetalMaterial('brass'));
    mesh2.position.set(0.65, 0.65, 0);
    mesh2.castShadow = true;
    mesh2.name = 'brass_metal';
    group.add(mesh2);

    const tube3 = new THREE.CylinderGeometry(0.16, 0.2, 0.8, 32);
    tube3.rotateZ(Math.PI / 4);
    const mesh3 = new THREE.Mesh(tube3, this.createMetalMaterial('brass'));
    mesh3.position.set(1.2, 1.2, 0);
    mesh3.castShadow = true;
    mesh3.name = 'brass_metal';
    group.add(mesh3);

    // Glass lens
    const lensGeo = new THREE.SphereGeometry(0.26, 24, 16);
    lensGeo.scale(1, 0.2, 1);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transmission: 0.9,
      roughness: 0.1,
      metalness: 0.1
    });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(-0.45, -0.45, 0);
    group.add(lensMesh);

    // Center spyglass in group
    group.position.set(-0.35, -0.35, 0);
  }

  private buildLamp(group: THREE.Group) {
    // Bronze ornate base
    const baseGeo = new THREE.CylinderGeometry(0.65, 0.85, 0.22, 28);
    const baseMesh = new THREE.Mesh(baseGeo, this.createMetalMaterial('bronze'));
    baseMesh.position.y = -0.9;
    baseMesh.castShadow = true;
    baseMesh.name = 'bronze_metal';
    group.add(baseMesh);

    // Curved stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 20);
    const stemMesh = new THREE.Mesh(stemGeo, this.createMetalMaterial('bronze'));
    stemMesh.position.y = -0.1;
    stemMesh.castShadow = true;
    stemMesh.name = 'bronze_metal';
    group.add(stemMesh);

    // Stained glass dome
    const domeGeo = new THREE.ConeGeometry(0.95, 0.75, 24, 1, true);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97724, // Amber art deco glass
      transmission: 0.6,
      roughness: 0.25,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.y = 0.7;
    domeMesh.castShadow = true;
    domeMesh.name = 'glass_dome';
    group.add(domeMesh);

    // Internal amber light
    const point = new THREE.PointLight(0xffaa44, 1.5, 3);
    point.position.set(0, 0.55, 0);
    group.add(point);
  }

  private buildCoffeeGrinder(group: THREE.Group) {
    // Walnut wood box
    const boxGeo = new THREE.BoxGeometry(1.2, 1.0, 1.2);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1b, // Dark walnut
      roughness: 0.75,
      metalness: 0.05
    });
    const boxMesh = new THREE.Mesh(boxGeo, woodMat);
    boxMesh.position.y = -0.4;
    boxMesh.castShadow = true;
    boxMesh.name = 'wood_body';
    group.add(boxMesh);

    // Brass hopper dome
    const hopperGeo = new THREE.ConeGeometry(0.5, 0.45, 24);
    hopperGeo.rotateX(Math.PI);
    const hopperMesh = new THREE.Mesh(hopperGeo, this.createMetalMaterial('brass'));
    hopperMesh.position.y = 0.35;
    hopperMesh.castShadow = true;
    hopperMesh.name = 'brass_metal';
    group.add(hopperMesh);

    // Crank handle
    const crankGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 12);
    crankGeo.rotateZ(Math.PI / 2);
    const crankMesh = new THREE.Mesh(crankGeo, this.createMetalMaterial('brass'));
    crankMesh.position.set(0.35, 0.65, 0);
    crankMesh.name = 'brass_metal';
    group.add(crankMesh);

    const knobGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const knobMesh = new THREE.Mesh(knobGeo, woodMat);
    knobMesh.position.set(0.72, 0.65, 0);
    group.add(knobMesh);
  }

  private buildDagger(group: THREE.Group) {
    // Damascus steel blade
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.18, 0.3);
    bladeShape.lineTo(0.12, 1.7);
    bladeShape.lineTo(0, 2.2); // sharp point
    bladeShape.lineTo(-0.12, 1.7);
    bladeShape.lineTo(-0.18, 0.3);
    bladeShape.closePath();

    const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    bladeGeo.center();
    const bladeMesh = new THREE.Mesh(bladeGeo, this.createMetalMaterial('steel'));
    bladeMesh.position.y = 0.45;
    bladeMesh.castShadow = true;
    bladeMesh.name = 'steel_blade';
    group.add(bladeMesh);

    // Golden crossguard
    const guardGeo = new THREE.BoxGeometry(0.9, 0.15, 0.22);
    const guardMesh = new THREE.Mesh(guardGeo, this.createMetalMaterial('gold'));
    guardMesh.position.y = -0.7;
    guardMesh.castShadow = true;
    guardMesh.name = 'gold_guard';
    group.add(guardMesh);

    // Wire-wrapped hilt
    const hiltGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 16);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const hiltMesh = new THREE.Mesh(hiltGeo, hiltMat);
    hiltMesh.position.y = -1.1;
    group.add(hiltMesh);

    // Pommel gem
    const pommelGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const pommelMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.2, metalness: 0.8 }); // Ruby
    const pommelMesh = new THREE.Mesh(pommelGeo, pommelMat);
    pommelMesh.position.y = -1.5;
    group.add(pommelMesh);
  }

  private buildRadio(group: THREE.Group) {
    // Rounded Bakelite cabinet
    const bodyGeo = new THREE.BoxGeometry(1.6, 1.1, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5c2b18, roughness: 0.65 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.name = 'wood_body';
    group.add(bodyMesh);

    // Speaker cloth
    const clothGeo = new THREE.PlaneGeometry(0.85, 0.85);
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xd2c0a5, roughness: 0.95 });
    const clothMesh = new THREE.Mesh(clothGeo, clothMat);
    clothMesh.position.set(-0.3, 0.05, 0.41);
    group.add(clothMesh);

    // Brass knobs
    for (let i = 0; i < 2; i++) {
      const knobGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
      knobGeo.rotateX(Math.PI / 2);
      const knobMesh = new THREE.Mesh(knobGeo, this.createMetalMaterial('brass'));
      knobMesh.position.set(0.45, -0.2 + i * 0.4, 0.44);
      knobMesh.name = 'brass_metal';
      group.add(knobMesh);
    }
  }

  private buildRomanCoin(group: THREE.Group) {
    const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.12, 36);
    coinGeo.rotateX(Math.PI / 2);
    const coinMesh = new THREE.Mesh(coinGeo, this.createMetalMaterial('gold'));
    coinMesh.castShadow = true;
    coinMesh.name = 'gold_coin';
    group.add(coinMesh);

    // Relief Emperor profile
    const reliefGeo = new THREE.SphereGeometry(0.42, 20, 16);
    reliefGeo.scale(1, 1.2, 0.2);
    const reliefMesh = new THREE.Mesh(reliefGeo, this.createMetalMaterial('gold'));
    reliefMesh.position.z = 0.07;
    reliefMesh.name = 'gold_coin';
    group.add(reliefMesh);
  }

  private buildCamera(group: THREE.Group) {
    // Wooden / leather camera box
    const boxGeo = new THREE.BoxGeometry(1.1, 1.3, 0.5);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.85 });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    group.add(boxMesh);

    // Accordion Bellows
    const bellowsGeo = new THREE.ConeGeometry(0.5, 0.8, 4, 6, true);
    bellowsGeo.rotateX(-Math.PI / 2);
    const bellowsMat = new THREE.MeshStandardMaterial({ color: 0x8b2525, roughness: 0.9, side: THREE.DoubleSide });
    const bellowsMesh = new THREE.Mesh(bellowsGeo, bellowsMat);
    bellowsMesh.position.z = 0.45;
    group.add(bellowsMesh);

    // Brass lens barrel
    const lensGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.35, 24);
    lensGeo.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeo, this.createMetalMaterial('brass'));
    lensMesh.position.z = 0.95;
    lensMesh.name = 'brass_metal';
    group.add(lensMesh);
  }

  private createMetalMaterial(type: 'brass' | 'bronze' | 'steel' | 'gold'): THREE.MeshStandardMaterial {
    const palette = {
      brass: { base: 0xd4af37, rust: 0x2d4436 }, // Brass with green verdigris oxidation
      bronze: { base: 0xcd7f32, rust: 0x33261a }, // Bronze with dark patina
      steel: { base: 0xcccccc, rust: 0x5a2d1d },  // Steel with red rust
      gold: { base: 0xfacc15, rust: 0x594a28 }    // Gold with mud/crust
    };

    const colors = palette[type] || palette.brass;

    return new THREE.MeshStandardMaterial({
      color: colors.base,
      roughness: 0.35,
      metalness: 0.85
    });
  }

  // Visual appearance updates as player restores
  public applyRestorationVisuals() {
    if (!this.currentItem || !this.currentItemMesh) return;

    const cleanedRatio = this.currentItem.cleanedPercent / 100;
    const polishedRatio = this.currentItem.polishedPercent / 100;
    const goldInlaid = this.currentItem.goldInlaid;

    this.currentItemMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        // As it's cleaned, darken rust disappears and true metal color pops
        const mat = child.material;

        // Base color saturation & brightness
        if (child.name.includes('brass')) {
          const rustColor = new THREE.Color(0x354b3c); // Verdigris oxidation
          const shinyColor = new THREE.Color(goldInlaid ? 0xffdf6d : 0xd4af37);
          mat.color.copy(rustColor).lerp(shinyColor, cleanedRatio);
          mat.roughness = THREE.MathUtils.lerp(0.85, 0.18, polishedRatio);
          mat.metalness = THREE.MathUtils.lerp(0.3, 0.95, cleanedRatio);
        } else if (child.name.includes('steel')) {
          const rustColor = new THREE.Color(0x6a3828); // Brown rust
          const shinyColor = new THREE.Color(0xdde3ea);
          mat.color.copy(rustColor).lerp(shinyColor, cleanedRatio);
          mat.roughness = THREE.MathUtils.lerp(0.9, 0.12, polishedRatio);
          mat.metalness = THREE.MathUtils.lerp(0.2, 0.98, cleanedRatio);
        } else if (child.name.includes('gold')) {
          const mudColor = new THREE.Color(0x4a4030); // Clay mud
          const goldColor = new THREE.Color(0xfacc15);
          mat.color.copy(mudColor).lerp(goldColor, cleanedRatio);
          mat.roughness = THREE.MathUtils.lerp(0.95, 0.15, polishedRatio);
          mat.metalness = THREE.MathUtils.lerp(0.1, 0.95, cleanedRatio);
        }
      }
    });
  }

  // --- Interaction & Tool Actions ---

  private setupEvents() {
    const el = this.renderer.domElement;

    // Pointer Down
    el.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      this.updatePointerCoords(e);
      this.applyToolAction();
    });

    // Pointer Move
    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      this.updatePointerCoords(e);

      const deltaX = e.clientX - this.previousPointerPosition.x;
      const deltaY = e.clientY - this.previousPointerPosition.y;

      if (this.activeTool === 'inspect') {
        // Smooth 3D rotation
        this.targetRotation.y += deltaX * 0.008;
        this.targetRotation.x += deltaY * 0.008;
        // Clamp vertical pitch to prevent flipping
        this.targetRotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.targetRotation.x));
      } else {
        // While using tools, slow gentle rotation plus tool application
        this.targetRotation.y += deltaX * 0.002;
        this.targetRotation.x += deltaY * 0.002;
        this.applyToolAction();
      }

      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
    });

    // Pointer Up
    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
      this.hideSparks();
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight || 1;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  private updatePointerCoords(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private applyToolAction() {
    if (!this.currentItem || !this.currentItemMesh) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.currentItemMesh.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];

      if (this.activeTool === 'cleaner') {
        // Rust laser cleaner
        if (this.currentItem.cleanedPercent < 100) {
          this.currentItem.cleanedPercent = Math.min(100, this.currentItem.cleanedPercent + 2.5);
          soundManager.playLaserHiss();
          this.emitSparksAt(hit.point);
          this.recalculateGradeAndValue();
          this.applyRestorationVisuals();
          this.onProgressUpdate?.(this.currentItem);
        }
      } else if (this.activeTool === 'polisher') {
        // High gloss buffing
        if (this.currentItem.cleanedPercent >= 50 && this.currentItem.polishedPercent < 100) {
          this.currentItem.polishedPercent = Math.min(100, this.currentItem.polishedPercent + 2.5);
          soundManager.playBuff();
          this.emitSparksAt(hit.point, 0xffe082);
          this.recalculateGradeAndValue();
          this.applyRestorationVisuals();
          this.onProgressUpdate?.(this.currentItem);
        }
      } else if (this.activeTool === 'gear_tuner') {
        // Mechanical clockwork tuning
        if (!this.currentItem.mechanismFixed) {
          this.currentItem.mechanismFixed = true;
          soundManager.playGearClick();
          soundManager.playGradeUpgrade();
          this.recalculateGradeAndValue();
          this.onProgressUpdate?.(this.currentItem);
        }
      } else if (this.activeTool === 'gold_inlay') {
        // Gold filigree leaf embellishment
        if (this.currentItem.polishedPercent >= 70 && !this.currentItem.goldInlaid) {
          this.currentItem.goldInlaid = true;
          soundManager.playGradeUpgrade();
          soundManager.playCashRegister();
          this.recalculateGradeAndValue();
          this.applyRestorationVisuals();
          this.onProgressUpdate?.(this.currentItem);
        }
      }
    }
  }

  private recalculateGradeAndValue() {
    if (!this.currentItem) return;

    // Grade logic: D -> C -> B -> A -> S
    let multiplier = 1.0;
    let grade: 'D' | 'C' | 'B' | 'A' | 'S' = 'D';

    if (this.currentItem.cleanedPercent >= 30) {
      grade = 'C';
      multiplier = 1.5;
    }
    if (this.currentItem.cleanedPercent >= 90 && this.currentItem.polishedPercent >= 40) {
      grade = 'B';
      multiplier = 2.2;
    }
    if (this.currentItem.polishedPercent >= 90 && this.currentItem.mechanismFixed) {
      grade = 'A';
      multiplier = 3.5;
    }
    if (this.currentItem.polishedPercent >= 95 && this.currentItem.mechanismFixed && this.currentItem.goldInlaid) {
      grade = 'S';
      multiplier = 5.5;
    }

    if (this.currentItem.grade !== grade) {
      this.currentItem.grade = grade;
      soundManager.playGradeUpgrade();
    }

    this.currentItem.currentValue = Math.round(this.currentItem.baseValue * multiplier);
  }

  private emitSparksAt(point: THREE.Vector3, colorHex = 0xffaa22) {
    if (!this.sparkParticles || !this.sparkVelocities) return;

    const positions = this.sparkParticles.geometry.attributes.position.array as Float32Array;
    const mat = this.sparkParticles.material as THREE.PointsMaterial;
    mat.color.setHex(colorHex);
    mat.opacity = 0.9;

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = point.x + (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.15;

      this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 0.05;
      this.sparkVelocities[i * 3 + 1] = Math.random() * 0.06 + 0.01;
      this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    this.sparkParticles.geometry.attributes.position.needsUpdate = true;
  }

  private hideSparks() {
    if (this.sparkParticles) {
      (this.sparkParticles.material as THREE.PointsMaterial).opacity = 0;
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    // Smooth inertia interpolation for rotation
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;

    if (this.currentItemMesh) {
      this.currentItemMesh.rotation.x = this.currentRotation.x;
      this.currentItemMesh.rotation.y = this.currentRotation.y;
    }

    // Update sparks
    if (this.sparkParticles && (this.sparkParticles.material as THREE.PointsMaterial).opacity > 0.01) {
      const pos = this.sparkParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.sparkCount; i++) {
        pos[i * 3] += this.sparkVelocities![i * 3];
        pos[i * 3 + 1] += this.sparkVelocities![i * 3 + 1];
        pos[i * 3 + 2] += this.sparkVelocities![i * 3 + 2];
      }
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
      (this.sparkParticles.material as THREE.PointsMaterial).opacity *= 0.92;
    }

    // Gold sparkles idle rotation
    if (this.goldParticles) {
      this.goldParticles.rotation.y += 0.002;
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.renderer.dispose();
  }
}
