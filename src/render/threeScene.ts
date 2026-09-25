import * as THREE from 'three';
import { AntiqueItem } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { ProceduralTextureGenerator } from './textures';

export type RestorationTool = 'inspect' | 'cleaner' | 'polisher' | 'gear_tuner' | 'gold_inlay';

export class ThreeRestorationScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private currentItemMesh: THREE.Group | null = null;
  private currentItem: AntiqueItem | null = null;
  private activeTool: RestorationTool = 'inspect';

  // Environment & Textures
  private envMap: THREE.CubeTexture | null = null;
  private woodTexture: THREE.CanvasTexture;
  private rustTexture: THREE.CanvasTexture;
  private damascusTexture: THREE.CanvasTexture;
  private filigreeTexture: THREE.CanvasTexture;

  // Active 3D Handheld Tool Mesh
  private toolHolder: THREE.Group;
  private laserBeamMesh: THREE.Line | null = null;

  // Rotation & touch tracking
  private isPointerDown = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private targetRotation = { x: 0.15, y: -0.35 };
  private currentRotation = { x: 0.15, y: -0.35 };

  // Particles
  private sparkParticles: THREE.Points;
  private sparkVelocities: Float32Array;
  private sparkCount = 120;
  private dustMotes: THREE.Points;

  // Raycaster for surface cleaning
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  // Callbacks
  public onProgressUpdate?: (item: AntiqueItem) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080e0b); // Deep vintage dark green studio

    // Calculate initial width and height with fallback to window
    const width = container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
    const height = container.clientHeight > 0 ? container.clientHeight : Math.max(300, window.innerHeight - 80);
    const aspect = width / Math.max(1, height);

    // Camera
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.set(0, 0.25, 4.0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.style.touchAction = 'none';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    // ResizeObserver to automatically resize when tab becomes visible
    try {
      const ro = new ResizeObserver(() => {
        this.resize();
      });
      ro.observe(container);
    } catch (_) {}

    // Generate procedural PBR textures
    this.envMap = ProceduralTextureGenerator.createStudioEnvMap(this.renderer);
    if (this.envMap) {
      this.scene.environment = this.envMap;
    }
    this.woodTexture = ProceduralTextureGenerator.createWoodGrainTexture();
    this.rustTexture = ProceduralTextureGenerator.createRustTexture();
    this.damascusTexture = ProceduralTextureGenerator.createDamascusTexture();
    this.filigreeTexture = ProceduralTextureGenerator.createFiligreeGoldTexture();

    // 3D Tool Holder
    this.toolHolder = new THREE.Group();
    this.scene.add(this.toolHolder);

    this.setupWorkbenchStudio();
    const sparks = this.setupSparkParticles();
    this.sparkParticles = sparks.points;
    this.sparkVelocities = sparks.velocities;
    this.dustMotes = this.setupDustMotes();

    this.setupEvents();
    this.animate();
  }

  public resize() {
    const width = this.container.clientWidth > 0 ? this.container.clientWidth : window.innerWidth;
    const height = this.container.clientHeight > 0 ? this.container.clientHeight : Math.max(300, window.innerHeight - 80);
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private setupWorkbenchStudio() {
    // Warm key spotlight (Antique Brass Desk Lamp)
    const deskSpotlight = new THREE.SpotLight(0xffeedd, 3.2);
    deskSpotlight.position.set(1.8, 3.6, 2.2);
    deskSpotlight.angle = Math.PI / 4.2;
    deskSpotlight.penumbra = 0.65;
    deskSpotlight.castShadow = true;
    deskSpotlight.shadow.mapSize.width = 1024;
    deskSpotlight.shadow.mapSize.height = 1024;
    this.scene.add(deskSpotlight);

    // Fill bounce light (warm golden reflection)
    const fillLight = new THREE.DirectionalLight(0xd4af37, 0.85);
    fillLight.position.set(-2.5, 1.2, 1.8);
    this.scene.add(fillLight);

    // Cool rim light (teal vintage ambient)
    const rimLight = new THREE.DirectionalLight(0x4ade80, 1.2);
    rimLight.position.set(0, -2, -3.5);
    this.scene.add(rimLight);

    // Soft ambient
    const ambient = new THREE.AmbientLight(0xfef3c7, 0.7);
    this.scene.add(ambient);

    // --- 3D WORKBENCH TABLE ---
    const tableTopGeo = new THREE.BoxGeometry(6.5, 0.35, 4.5);
    const tableTopMat = new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      roughness: 0.65,
      metalness: 0.1,
      color: 0x4a2e18
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.set(0, -1.35, 0);
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);

    // Green Leather Artisan Blotter Mat with Gold Rim
    const blotterGeo = new THREE.BoxGeometry(3.6, 0.04, 2.6);
    const blotterMat = new THREE.MeshStandardMaterial({
      color: 0x143424, // British racing green leather
      roughness: 0.85,
      metalness: 0.15
    });
    const blotter = new THREE.Mesh(blotterGeo, blotterMat);
    blotter.position.set(0, -1.16, 0.15);
    blotter.receiveShadow = true;
    this.scene.add(blotter);

    // Velvet turntable display pedestal in center
    const turntableGeo = new THREE.CylinderGeometry(1.35, 1.45, 0.14, 48);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x3d0c14, // Royal burgundy velvet
      roughness: 0.95,
      metalness: 0.05
    });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.set(0, -1.08, 0);
    turntable.receiveShadow = true;
    this.scene.add(turntable);

    // Brass outer ring on turntable
    const brassRingGeo = new THREE.TorusGeometry(1.38, 0.04, 16, 48);
    brassRingGeo.rotateX(Math.PI / 2);
    const brassRingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.95,
      envMap: this.envMap || undefined
    });
    const brassRing = new THREE.Mesh(brassRingGeo, brassRingMat);
    brassRing.position.set(0, -1.06, 0);
    this.scene.add(brassRing);

    // --- WORKBENCH PROPS ---
    // 1. Antique Brass Calipers (Measuring tool on table)
    const caliperMat = brassRingMat;
    const caliperArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 1.2), caliperMat);
    caliperArm1.position.set(-1.8, -1.14, 0.5);
    caliperArm1.rotation.y = 0.35;
    this.scene.add(caliperArm1);

    // 2. Jeweler's Loupe / Magnifying Glass
    const loupeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 16), tableTopMat);
    loupeHandle.rotateZ(Math.PI / 2);
    loupeHandle.position.set(1.9, -1.14, 0.6);
    this.scene.add(loupeHandle);
    const loupeRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 16, 32), brassRingMat);
    loupeRing.rotateX(Math.PI / 2);
    loupeRing.position.set(1.5, -1.14, 0.6);
    this.scene.add(loupeRing);

    // 3. Amber Glass Oil Dropper Bottle
    const bottleGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 20);
    const bottleMat = new THREE.MeshPhysicalMaterial({
      color: 0x92400e, // Amber glass
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.85,
      thickness: 0.5
    });
    const bottle = new THREE.Mesh(bottleGeo, bottleMat);
    bottle.position.set(-1.9, -0.85, -0.6);
    this.scene.add(bottle);
  }

  private setupSparkParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sparkCount * 3);
    const velocities = new Float32Array(this.sparkCount * 3);

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities[i * 3] = (Math.random() - 0.5) * 0.12;
      velocities[i * 3 + 1] = Math.random() * 0.1 + 0.04;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffaa22,
      size: 0.1,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    return { points, velocities };
  }

  private setupDustMotes(): THREE.Points {
    const geo = new THREE.BufferGeometry();
    const count = 90;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 2.5 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffe6a3,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    return points;
  }

  public setTool(tool: RestorationTool) {
    this.activeTool = tool;
    this.update3DToolVisual(tool);
  }

  private update3DToolVisual(tool: RestorationTool) {
    // Clear old tool mesh
    while (this.toolHolder.children.length > 0) {
      this.toolHolder.remove(this.toolHolder.children[0]);
    }

    if (tool === 'inspect') {
      this.toolHolder.visible = false;
      return;
    }

    this.toolHolder.visible = true;

    if (tool === 'cleaner') {
      // Antique Brass Laser Stylus
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.3 })
      );
      body.rotateX(Math.PI / 4);
      this.toolHolder.add(body);

      // Glowing sapphire laser crystal tip
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.2, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      crystal.position.set(0, -0.45, 0);
      this.toolHolder.add(crystal);
    } else if (tool === 'polisher') {
      // Spinning Cotton Buffing Wheel
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.7, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
      );
      this.toolHolder.add(handle);

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.12, 24),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.95 })
      );
      wheel.position.set(0, 0.4, 0);
      wheel.name = 'buffing_wheel';
      this.toolHolder.add(wheel);
    } else if (tool === 'gear_tuner') {
      // Jeweler's Precision Tweezers
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.65, 0.04), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }));
      t1.position.x = -0.03;
      const t2 = t1.clone();
      t2.position.x = 0.03;
      this.toolHolder.add(t1);
      this.toolHolder.add(t2);
    } else if (tool === 'gold_inlay') {
      // Gold Leaf Feather Quill / Stylus
      const quill = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.9, 12),
        new THREE.MeshStandardMaterial({ color: 0xf5cf6d, metalness: 0.95, roughness: 0.15 })
      );
      quill.rotateX(Math.PI);
      this.toolHolder.add(quill);
    }
  }

  public loadItem(item: AntiqueItem) {
    if (this.currentItem && this.currentItem.id === item.id && this.currentItemMesh) {
      this.currentItem = item;
      this.applyRestorationVisuals();
      return;
    }

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

  // --- Highly Detailed 3D Antiques ---

  private buildPocketWatch(group: THREE.Group) {
    const brassMat = this.createMetalMaterial('brass');

    // Outer Case
    const rimGeo = new THREE.TorusGeometry(0.9, 0.18, 32, 64);
    const rimMesh = new THREE.Mesh(rimGeo, brassMat);
    rimMesh.castShadow = true;
    rimMesh.name = 'brass_metal';
    group.add(rimMesh);

    const backGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 48);
    backGeo.rotateX(Math.PI / 2);
    const backMesh = new THREE.Mesh(backGeo, brassMat);
    backMesh.position.z = -0.08;
    backMesh.castShadow = true;
    backMesh.name = 'brass_metal';
    group.add(backMesh);

    // Watch face dial with ivory texture
    const dialGeo = new THREE.CircleGeometry(0.84, 48);
    const dialMat = new THREE.MeshStandardMaterial({
      color: 0xfaf6ea,
      roughness: 0.45,
      metalness: 0.1
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.z = 0.05;
    group.add(dialMesh);

    // Hour markers (12 golden tick markers)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.12, 0.02),
        brassMat
      );
      tick.position.set(Math.sin(angle) * 0.72, Math.cos(angle) * 0.72, 0.07);
      tick.rotation.z = -angle;
      tick.name = 'brass_metal';
      group.add(tick);
    }

    // Hands
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.45, 0.02), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
    hourHand.position.set(0.12, 0.15, 0.08);
    hourHand.rotation.z = 0.65;
    group.add(hourHand);

    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.65, 0.02), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
    minuteHand.position.set(-0.15, 0.2, 0.09);
    minuteHand.rotation.z = -0.85;
    group.add(minuteHand);

    // Exposed gears
    for (let i = 0; i < 4; i++) {
      const gear = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24 - i * 0.04, 0.24 - i * 0.04, 0.05, 20),
        brassMat
      );
      gear.rotateX(Math.PI / 2);
      gear.position.set(0.25 * (i % 2 === 0 ? 1 : -1), 0.2 * (i > 1 ? -1 : 1), 0.08);
      gear.name = 'gear_mesh';
      group.add(gear);
    }

    // Top loop & crown
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.06, 16, 32), brassMat);
    loop.position.set(0, 1.15, 0);
    loop.name = 'brass_metal';
    group.add(loop);
  }

  private buildSpyglass(group: THREE.Group) {
    const brassMat = this.createMetalMaterial('brass');

    const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.3, 36), brassMat);
    tube1.rotateZ(Math.PI / 4);
    tube1.castShadow = true;
    tube1.name = 'brass_metal';
    group.add(tube1);

    const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 1.1, 36), brassMat);
    tube2.rotateZ(Math.PI / 4);
    tube2.position.set(0.72, 0.72, 0);
    tube2.castShadow = true;
    tube2.name = 'brass_metal';
    group.add(tube2);

    const tube3 = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.9, 36), brassMat);
    tube3.rotateZ(Math.PI / 4);
    tube3.position.set(1.35, 1.35, 0);
    tube3.castShadow = true;
    tube3.name = 'brass_metal';
    group.add(tube3);

    // Convex glass lens
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 16),
      new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transmission: 0.92, roughness: 0.08, thickness: 0.6 })
    );
    lens.scale.set(1, 0.22, 1);
    lens.position.set(-0.5, -0.5, 0);
    group.add(lens);

    group.position.set(-0.4, -0.4, 0);
  }

  private buildLamp(group: THREE.Group) {
    const bronzeMat = this.createMetalMaterial('bronze');

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.25, 32), bronzeMat);
    base.position.y = -0.95;
    base.name = 'bronze_metal';
    group.add(base);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.5, 24), bronzeMat);
    stem.position.y = -0.15;
    stem.name = 'bronze_metal';
    group.add(stem);

    // Geometric stained glass dome
    const dome = new THREE.Mesh(
      new THREE.ConeGeometry(1.05, 0.85, 28, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0xd97724, transmission: 0.7, roughness: 0.2, thickness: 0.5, side: THREE.DoubleSide })
    );
    dome.position.y = 0.75;
    group.add(dome);

    const light = new THREE.PointLight(0xffaa44, 2.2, 4);
    light.position.set(0, 0.6, 0);
    group.add(light);
  }

  private buildCoffeeGrinder(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      roughness: 0.65,
      metalness: 0.1,
      color: 0x4a2e18
    });
    const brassMat = this.createMetalMaterial('brass');

    const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.3), woodMat);
    box.position.y = -0.4;
    box.castShadow = true;
    group.add(box);

    const hopper = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 28), brassMat);
    hopper.rotateX(Math.PI);
    hopper.position.y = 0.4;
    hopper.name = 'brass_metal';
    group.add(hopper);

    const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 16), brassMat);
    crank.rotateZ(Math.PI / 2);
    crank.position.set(0.4, 0.72, 0);
    crank.name = 'brass_metal';
    group.add(crank);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), woodMat);
    knob.position.set(0.8, 0.72, 0);
    group.add(knob);
  }

  private buildDagger(group: THREE.Group) {
    const steelMat = new THREE.MeshStandardMaterial({
      map: this.damascusTexture,
      roughness: 0.2,
      metalness: 0.95,
      envMap: this.envMap || undefined
    });
    const goldMat = this.createMetalMaterial('gold');

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.2, 0.35);
    bladeShape.lineTo(0.14, 1.8);
    bladeShape.lineTo(0, 2.35);
    bladeShape.lineTo(-0.14, 1.8);
    bladeShape.lineTo(-0.2, 0.35);
    bladeShape.closePath();

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
    bladeGeo.center();
    const blade = new THREE.Mesh(bladeGeo, steelMat);
    blade.position.y = 0.5;
    blade.name = 'steel_blade';
    group.add(blade);

    // Golden crossguard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 0.25), goldMat);
    guard.position.y = -0.75;
    guard.name = 'gold_guard';
    group.add(guard);

    // Grip
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.75, 16), new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.85 }));
    grip.position.y = -1.2;
    group.add(grip);

    // Ruby Pommel
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.15, metalness: 0.7 }));
    pommel.position.y = -1.65;
    group.add(pommel);
  }

  private buildRadio(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({ map: this.woodTexture, roughness: 0.6, color: 0x5a2e1c });
    const brassMat = this.createMetalMaterial('brass');

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 0.9), woodMat);
    body.castShadow = true;
    group.add(body);

    const speakerCloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0xd4c2a5, roughness: 0.95 }));
    speakerCloth.position.set(-0.32, 0.05, 0.46);
    group.add(speakerCloth);

    for (let i = 0; i < 2; i++) {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20), brassMat);
      knob.rotateX(Math.PI / 2);
      knob.position.set(0.48, -0.22 + i * 0.45, 0.5);
      knob.name = 'brass_metal';
      group.add(knob);
    }
  }

  private buildRomanCoin(group: THREE.Group) {
    const goldMat = this.createMetalMaterial('gold');

    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 48), goldMat);
    coin.rotateX(Math.PI / 2);
    coin.castShadow = true;
    coin.name = 'gold_coin';
    group.add(coin);

    const relief = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 20), goldMat);
    relief.scale.set(1, 1.25, 0.25);
    relief.position.z = 0.09;
    relief.name = 'gold_coin';
    group.add(relief);
  }

  private buildCamera(group: THREE.Group) {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.85 });
    const brassMat = this.createMetalMaterial('brass');

    const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.55), bodyMat);
    box.castShadow = true;
    group.add(box);

    const bellows = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.85, 4, 8, true),
      new THREE.MeshStandardMaterial({ color: 0x8b2525, roughness: 0.9, side: THREE.DoubleSide })
    );
    bellows.rotateX(-Math.PI / 2);
    bellows.position.z = 0.5;
    group.add(bellows);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.4, 28), brassMat);
    lens.rotateX(Math.PI / 2);
    lens.position.z = 1.05;
    lens.name = 'brass_metal';
    group.add(lens);
  }

  private createMetalMaterial(type: 'brass' | 'bronze' | 'steel' | 'gold'): THREE.MeshStandardMaterial {
    const palette = {
      brass: { base: 0xd4af37 },
      bronze: { base: 0xcd7f32 },
      steel: { base: 0xcccccc },
      gold: { base: 0xfacc15 }
    };
    const c = palette[type] || palette.brass;

    return new THREE.MeshStandardMaterial({
      color: c.base,
      roughness: 0.35,
      metalness: 0.9,
      envMap: this.envMap || undefined
    });
  }

  public applyRestorationVisuals() {
    if (!this.currentItem || !this.currentItemMesh) return;

    const cleanedRatio = this.currentItem.cleanedPercent / 100;
    const polishedRatio = this.currentItem.polishedPercent / 100;
    const goldInlaid = this.currentItem.goldInlaid;

    this.currentItemMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const mat = child.material;

        if (child.name.includes('brass')) {
          const rustColor = new THREE.Color(0x283d30); // Dark verdigris
          const shinyColor = new THREE.Color(goldInlaid ? 0xffea88 : 0xd4af37);
          mat.color.copy(rustColor).lerp(shinyColor, cleanedRatio);
          mat.roughness = THREE.MathUtils.lerp(0.9, 0.12, polishedRatio);
          mat.metalness = THREE.MathUtils.lerp(0.35, 0.98, cleanedRatio);
        } else if (child.name.includes('steel')) {
          const rustColor = new THREE.Color(0x5a2d1d); // Deep red iron rust
          const shinyColor = new THREE.Color(0xe2e8f0);
          mat.color.copy(rustColor).lerp(shinyColor, cleanedRatio);
          mat.roughness = THREE.MathUtils.lerp(0.92, 0.08, polishedRatio);
          mat.metalness = THREE.MathUtils.lerp(0.2, 0.99, cleanedRatio);
        } else if (child.name.includes('gold')) {
          const mudColor = new THREE.Color(0x3e3523);
          const goldColor = new THREE.Color(0xfacc15);
          mat.color.copy(mudColor).lerp(goldColor, cleanedRatio);
          mat.roughness = THREE.MathUtils.lerp(0.95, 0.1, polishedRatio);
          mat.metalness = THREE.MathUtils.lerp(0.15, 0.98, cleanedRatio);
        }
      }
    });
  }

  // --- Interaction & Tool Actions ---

  private setupEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      this.updatePointerCoords(e);
      this.applyToolAction();
    });

    window.addEventListener('pointermove', (e) => {
      this.updatePointerCoords(e);
      this.updateToolPosition();

      if (!this.isPointerDown) return;

      const deltaX = e.clientX - this.previousPointerPosition.x;
      const deltaY = e.clientY - this.previousPointerPosition.y;

      if (this.activeTool === 'inspect') {
        this.targetRotation.y += deltaX * 0.008;
        this.targetRotation.x += deltaY * 0.008;
        this.targetRotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.targetRotation.x));
      } else {
        this.targetRotation.y += deltaX * 0.003;
        this.targetRotation.x += deltaY * 0.003;
        this.applyToolAction();
      }

      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
      this.hideSparks();
    });

    window.addEventListener('pointercancel', () => {
      this.isPointerDown = false;
      this.hideSparks();
    });

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

  private updateToolPosition() {
    if (!this.toolHolder.visible) return;

    // Unproject pointer to 3D world position
    const vector = new THREE.Vector3(this.pointer.x, this.pointer.y, 0.7);
    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    const distance = 3.6;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

    // Smoothly lag tool to pointer
    this.toolHolder.position.lerp(pos, 0.25);
    this.toolHolder.lookAt(0, 0, 0);

    // Spin buffing wheel if polisher
    const wheel = this.toolHolder.getObjectByName('buffing_wheel');
    if (wheel) {
      wheel.rotation.y += 0.4;
    }
  }

  private applyToolAction() {
    if (!this.currentItem || !this.currentItemMesh) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.currentItemMesh.children, true);

    const closestPoint = new THREE.Vector3();
    this.raycaster.ray.closestPointToPoint(new THREE.Vector3(0, 0, 0), closestPoint);
    const distToCenter = closestPoint.distanceTo(new THREE.Vector3(0, 0, 0));

    // Valid if ray intersects mesh directly OR touch is in proximity
    if (intersects.length > 0 || distToCenter < 1.8) {
      const hitPoint = intersects.length > 0 ? intersects[0].point : closestPoint;

      // Haptic touch
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }

      if (this.activeTool === 'cleaner') {
        if (this.currentItem.cleanedPercent < 100) {
          this.currentItem.cleanedPercent = Math.min(100, this.currentItem.cleanedPercent + 3.0);
          soundManager.playLaserHiss();
          this.emitSparksAt(hitPoint, 0x38bdf8);
          this.recalculateGradeAndValue();
          this.applyRestorationVisuals();
          this.onProgressUpdate?.(this.currentItem);
        }
      } else if (this.activeTool === 'polisher') {
        if (this.currentItem.polishedPercent < 100) {
          this.currentItem.polishedPercent = Math.min(100, this.currentItem.polishedPercent + 3.0);
          if (this.currentItem.cleanedPercent < 100) {
            this.currentItem.cleanedPercent = Math.min(100, this.currentItem.cleanedPercent + 1.0);
          }
          soundManager.playBuff();
          this.emitSparksAt(hitPoint, 0xffd54f);
          this.recalculateGradeAndValue();
          this.applyRestorationVisuals();
          this.onProgressUpdate?.(this.currentItem);
        }
      } else if (this.activeTool === 'gear_tuner') {
        if (!this.currentItem.mechanismFixed) {
          this.currentItem.mechanismFixed = true;
          soundManager.playGearClick();
          soundManager.playGradeUpgrade();
          this.emitSparksAt(hitPoint, 0xa855f7);
          this.recalculateGradeAndValue();
          this.onProgressUpdate?.(this.currentItem);
        }
      } else if (this.activeTool === 'gold_inlay') {
        if (!this.currentItem.goldInlaid) {
          this.currentItem.goldInlaid = true;
          soundManager.playGradeUpgrade();
          soundManager.playCashRegister();
          this.emitSparksAt(hitPoint, 0xf5cf6d);
          this.recalculateGradeAndValue();
          this.applyRestorationVisuals();
          this.onProgressUpdate?.(this.currentItem);
        }
      }
    }
  }

  private recalculateGradeAndValue() {
    if (!this.currentItem) return;

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
    const positions = this.sparkParticles.geometry.attributes.position.array as Float32Array;
    const mat = this.sparkParticles.material as THREE.PointsMaterial;
    mat.color.setHex(colorHex);
    mat.opacity = 0.95;

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = point.x + (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.15;

      this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 0.07;
      this.sparkVelocities[i * 3 + 1] = Math.random() * 0.08 + 0.02;
      this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.07;
    }

    this.sparkParticles.geometry.attributes.position.needsUpdate = true;
  }

  private hideSparks() {
    (this.sparkParticles.material as THREE.PointsMaterial).opacity = 0;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;

    if (this.currentItemMesh) {
      this.currentItemMesh.rotation.x = this.currentRotation.x;
      this.currentItemMesh.rotation.y = this.currentRotation.y;
    }

    // Sparks decay
    if ((this.sparkParticles.material as THREE.PointsMaterial).opacity > 0.01) {
      const pos = this.sparkParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.sparkCount; i++) {
        pos[i * 3] += this.sparkVelocities[i * 3];
        pos[i * 3 + 1] += this.sparkVelocities[i * 3 + 1];
        pos[i * 3 + 2] += this.sparkVelocities[i * 3 + 2];
      }
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
      (this.sparkParticles.material as THREE.PointsMaterial).opacity *= 0.9;
    }

    // Dust motes gentle drift
    const dustPos = this.dustMotes.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < dustPos.length / 3; i++) {
      dustPos[i * 3 + 1] -= 0.001;
      if (dustPos[i * 3 + 1] < -0.5) {
        dustPos[i * 3 + 1] = 2.0;
      }
    }
    this.dustMotes.geometry.attributes.position.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.renderer.dispose();
  }
}
