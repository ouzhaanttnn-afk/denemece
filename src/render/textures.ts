import * as THREE from 'three';

// Procedural high-resolution PBR texture generator for Vintage Vault
// Zero external image files needed - 100% offline, instant generation, ultra-detailed!

export class ProceduralTextureGenerator {
  // Generate realistic antique wood grain (Walnut / Mahogany)
  public static createWoodGrainTexture(width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base rich walnut color
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(0, 0, width, height);

    // Wood rings and fibers
    for (let y = 0; y < height; y++) {
      const n = Math.sin(y * 0.08 + Math.sin(y * 0.02) * 4) * 0.5 + 0.5;
      const alpha = Math.random() * 0.15 + (n > 0.6 ? 0.2 : 0.05);
      ctx.fillStyle = n > 0.5 ? `rgba(85, 48, 26, ${alpha})` : `rgba(28, 14, 8, ${alpha})`;
      ctx.fillRect(0, y, width, 1 + Math.random() * 2);
    }

    // Wood knots
    for (let k = 0; k < 3; k++) {
      const kx = Math.random() * width;
      const ky = Math.random() * height;
      const grad = ctx.createRadialGradient(kx, ky, 2, kx, ky, 28 + Math.random() * 30);
      grad.addColorStop(0, 'rgba(20, 10, 5, 0.85)');
      grad.addColorStop(0.4, 'rgba(50, 28, 15, 0.5)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 28, 14, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Generate realistic heavy rust, verdigris and oxidation mask
  public static createRustTexture(width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Transparent / clean base
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    // Mottled corrosion flakes (reddish-brown rust + turquoise verdigris)
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 25 + 4;
      const isVerdigris = Math.random() < 0.35;

      const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
      if (isVerdigris) {
        grad.addColorStop(0, 'rgba(45, 110, 85, 0.85)'); // Verdigris patina
        grad.addColorStop(0.7, 'rgba(25, 65, 50, 0.5)');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, 'rgba(120, 45, 20, 0.9)'); // Iron rust
        grad.addColorStop(0.6, 'rgba(75, 28, 12, 0.6)');
        grad.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy grime spatter
    for (let j = 0; j < 800; j++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(30, 20, 10, 0.7)' : 'rgba(90, 40, 15, 0.6)';
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Generate Damascus steel wavy ripple pattern
  public static createDamascusTexture(width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#9aa4af';
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 3) {
      const wave = Math.sin(y * 0.05) * 12 + Math.cos(y * 0.12) * 8;
      ctx.strokeStyle = (y % 6 === 0) ? '#4a535c' : '#c2c9d1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + wave);
      for (let x = 0; x < width; x += 16) {
        const localWave = Math.sin((x + y) * 0.04) * 6;
        ctx.lineTo(x, y + wave + localWave);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Generate Victorian floral gold filigree engraving pattern
  public static createFiligreeGoldTexture(width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#f5cf6d';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;

    // Arabesque scrolls
    for (let cx = 64; cx < width; cx += 128) {
      for (let cy = 64; cy < height; cy += 128) {
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 1.5);
        ctx.bezierCurveTo(cx + 40, cy - 20, cx + 50, cy + 30, cx + 15, cy + 45);
        ctx.stroke();

        ctx.fillStyle = '#ffe082';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Generate 360-degree Studio HDRI Environment Map for realistic metallic specular reflections
  public static createStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.CubeTexture | null {
    try {
      const size = 256;
      const canvases: HTMLCanvasElement[] = [];

      for (let i = 0; i < 6; i++) {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d')!;

        // Warm dark studio gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, size);
        bgGrad.addColorStop(0, '#1a2420');
        bgGrad.addColorStop(0.5, '#0d1411');
        bgGrad.addColorStop(1, '#050806');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);

        // Soft studio softbox reflections
        if (i === 0 || i === 1) { // Left and right softboxes
          const boxGrad = ctx.createRadialGradient(size / 2, size / 3, 5, size / 2, size / 3, size / 2);
          boxGrad.addColorStop(0, 'rgba(255, 235, 200, 0.9)');
          boxGrad.addColorStop(0.4, 'rgba(240, 195, 110, 0.4)');
          boxGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = boxGrad;
          ctx.fillRect(0, 0, size, size);
        } else if (i === 2) { // Top overhead spotlight
          const topGrad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2.2);
          topGrad.addColorStop(0, 'rgba(255, 250, 240, 0.95)');
          topGrad.addColorStop(0.6, 'rgba(212, 175, 55, 0.5)');
          topGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, size, size);
        }

        canvases.push(c);
      }

      const cubeTexture = new THREE.CubeTexture(canvases);
      cubeTexture.needsUpdate = true;
      return cubeTexture;
    } catch (_) {
      return null;
    }
  }
}
