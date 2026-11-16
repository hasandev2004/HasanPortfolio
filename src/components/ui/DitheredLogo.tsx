import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type {MotionValue} from 'motion/react';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

interface GrayscaleResult {
  grayscale: Uint8Array;
  alpha: Uint8Array;
  width: number;
  height: number;
}

interface DitherConfig {
  threshold: number;
  serpentine: boolean;
  diffusionStrength: number;
}

interface ParticleSystem {
  count: number;
  baseX: Float32Array;
  baseY: Float32Array;
  dirX: Float32Array;
  dirY: Float32Array;
  offsetX: Float32Array;
  offsetY: Float32Array;
  brightness: Float32Array;
  tint: Float32Array;
  size: number;
}

interface Ripple {
  x: number;
  y: number;
  start: number;
}

const DEFAULTS = {
  gridSize: 200,
  scale: 0.5,
  dotScale: 1,
  invert: true,
  cornerRadius: 0.2,
  threshold: 180,
  contrast: 0,
  gamma: 1,
  blur: 3.75,
  diffusionStrength: 1,
  serpentine: true,
};

const RIPPLE_SPEED = 225;
const RIPPLE_WIDTH = 37;
const RIPPLE_FORCE = 20;
const RIPPLE_DURATION = 675;
const CURSOR_RADIUS = 96;
const CURSOR_RADIUS_SQ = CURSOR_RADIUS * CURSOR_RADIUS;
const CURSOR_FORCE = 34;
const LERP_FACTOR = 0.12;
const SNAP_THRESHOLD = 0.01;
const MAX_DPR = 2;

const toGrayscaleGrid = (
  img: HTMLImageElement,
  maxDim: number,
  contrast: number,
  gamma: number,
  blur: number,
): GrayscaleResult => {
  const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
  const outW = Math.max(8, aspect >= 1 ? maxDim : Math.round(maxDim * aspect));
  const outH = Math.max(8, aspect >= 1 ? Math.round(maxDim / aspect) : maxDim);
  const srcW = Math.max(1, img.naturalWidth || maxDim);
  const srcH = Math.max(1, img.naturalHeight || maxDim);

  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = outW;
  alphaCanvas.height = outH;
  const alphaCtx = alphaCanvas.getContext('2d');
  if (!alphaCtx) {
    throw new Error('DitheredLogo: unable to create alpha canvas context.');
  }
  alphaCtx.imageSmoothingEnabled = true;
  alphaCtx.imageSmoothingQuality = 'high';
  alphaCtx.drawImage(img, 0, 0, outW, outH);
  const alphaData = alphaCtx.getImageData(0, 0, outW, outH).data;

  const pad = Math.ceil(blur * 3);
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW + pad * 2;
  srcCanvas.height = srcH + pad * 2;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) {
    throw new Error('DitheredLogo: unable to create source canvas context.');
  }
  if (blur > 0) {
    srcCtx.filter = `blur(${blur}px)`;
  }
  srcCtx.drawImage(img, pad, pad, srcW, srcH);
  srcCtx.filter = 'none';

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error(
      'DitheredLogo: unable to create processing canvas context.',
    );
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, pad, pad, srcW, srcH, 0, 0, outW, outH);
  const pixels = ctx.getImageData(0, 0, outW, outH).data;

  const grayscale = new Uint8Array(outW * outH);
  const alpha = new Uint8Array(outW * outH);
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const idx = (y * outW + x) * 4;
      const blurAlpha = pixels[idx + 3]! / 255;
      alpha[y * outW + x] = alphaData[idx + 3]!;
      let luma =
        blurAlpha > 0.01
          ? (0.299 * pixels[idx]! +
              0.587 * pixels[idx + 1]! +
              0.114 * pixels[idx + 2]!) /
            blurAlpha
          : 0;
      if (contrast !== 0) {
        luma = cFactor * (luma - 128) + 128;
      }
      if (gamma !== 1) {
        luma = 255 * Math.pow(Math.max(0, luma / 255), 1 / gamma);
      }
      grayscale[y * outW + x] = Math.max(0, Math.min(255, Math.round(luma)));
    }
  }

  return {grayscale, alpha, width: outW, height: outH};
};

const errorDiffusionDither = (
  grayscale: Uint8Array,
  width: number,
  height: number,
  config: DitherConfig,
  alpha: Uint8Array,
): Float32Array => {
  const errors = new Float32Array(width * height);
  for (let i = 0; i < grayscale.length; i++) {
    errors[i] = grayscale[i]!;
  }
  const positions: number[] = [];
  const strength = config.diffusionStrength;

  for (let y = 0; y < height; y++) {
    const ltr = !config.serpentine || y % 2 === 0;
    const startX = ltr ? 0 : width - 1;
    const endX = ltr ? width : -1;
    const step = ltr ? 1 : -1;

    for (let x = startX; x !== endX; x += step) {
      const idx = y * width + x;
      if (alpha[idx]! < 128) continue;

      const oldVal = errors[idx]!;
      const newVal = oldVal > config.threshold ? 255 : 0;
      const err = (oldVal - newVal) * strength;
      if (newVal > 0) positions.push(x, y);

      const spread = (nx: number, ny: number, weight: number) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const ni = ny * width + nx;
        if (alpha[ni]! < 128) return;
        errors[ni] = errors[ni]! + err * weight;
      };

      spread(x + step, y, 7 / 16);
      spread(x - step, y + 1, 3 / 16);
      spread(x, y + 1, 5 / 16);
      spread(x + step, y + 1, 1 / 16);
    }
  }

  return new Float32Array(positions);
};

const fetchImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const buildRoundedMask = (
  w: number,
  h: number,
  radiusPct: number,
): Set<number> => {
  const r = Math.round(radiusPct * Math.min(w, h));
  const mask = new Set<number>();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = false;
      if (x >= r && x < w - r) {
        inside = true;
      } else if (y >= r && y < h - r) {
        inside = true;
      } else {
        const cx = x < r ? r : w - r - 1;
        const cy = y < r ? r : h - r - 1;
        const dx = x - cx;
        const dy = y - cy;
        inside = dx * dx + dy * dy <= r * r;
      }
      if (inside) mask.add(y * w + x);
    }
  }

  return mask;
};

const applyMaskInversion = (
  positions: Float32Array,
  gridW: number,
  gridH: number,
  radiusPct: number,
  alpha: Uint8Array,
): Float32Array => {
  const mask = buildRoundedMask(gridW, gridH, radiusPct);
  const filled = new Set<number>();

  for (let i = 0; i < positions.length; i += 2) {
    filled.add(
      Math.round(positions[i + 1]!) * gridW + Math.round(positions[i]!),
    );
  }

  const result: number[] = [];
  for (const idx of mask) {
    if (!filled.has(idx)) {
      if (alpha[idx]! < 128) continue;
      result.push(idx % gridW, Math.floor(idx / gridW));
    }
  }

  return new Float32Array(result);
};

const initParticles = (
  points: Float32Array,
  scaleFactor: number,
  dotScale: number,
  originX: number,
  originY: number,
  centerX: number,
  centerY: number,
): ParticleSystem => {
  const count = points.length / 2;
  const baseX = new Float32Array(count);
  const baseY = new Float32Array(count);
  const dirX = new Float32Array(count);
  const dirY = new Float32Array(count);
  const offsetX = new Float32Array(count);
  const offsetY = new Float32Array(count);
  const brightness = new Float32Array(count);
  const tint = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const px = originX + points[i * 2]! * scaleFactor;
    const py = originY + points[i * 2 + 1]! * scaleFactor;
    baseX[i] = px;
    baseY[i] = py;

    // Precompute deterministic radial dispersion vector for smooth scroll scattering
    const dx = px - centerX;
    const dy = py - centerY;
    const dist = Math.hypot(dx, dy) || 1;
    const hash = Math.sin(i * 12.9898) * 43758.5453;
    const jitter = 0.65 + (hash - Math.floor(hash)) * 0.7;
    dirX[i] = (dx / dist) * jitter;
    dirY[i] = (dy / dist) * jitter;

    brightness[i] = 1;
    tint[i] = 1;
  }

  return {
    count,
    baseX,
    baseY,
    dirX,
    dirY,
    offsetX,
    offsetY,
    brightness,
    tint,
    size: scaleFactor * dotScale,
  };
};

const stepParticles = (
  sys: ParticleSystem,
  cursorX: number,
  cursorY: number,
  cursorActive: boolean,
  ripples: Ripple[],
  now: number,
  dispersionAmount: number,
  maxScatterPx: number,
): boolean => {
  const {count, baseX, baseY, dirX, dirY, offsetX, offsetY} = sys;

  for (let k = ripples.length - 1; k >= 0; k--) {
    if (now - ripples[k]!.start >= RIPPLE_DURATION) {
      ripples.splice(k, 1);
    }
  }

  const numRipples = ripples.length;
  const rippleMul = numRipples > 0 ? 1 + 0.5 * (numRipples - 1) : 0;
  let hasMotion = false;
  const scatter = dispersionAmount * maxScatterPx;

  for (let i = 0; i < count; i++) {
    let fx = dirX[i]! * scatter;
    let fy = dirY[i]! * scatter;

    if (cursorActive) {
      const vx = baseX[i]! + offsetX[i]! - cursorX;
      const vy = baseY[i]! + offsetY[i]! - cursorY;
      const d2 = vx * vx + vy * vy;
      if (d2 > 0.1 && d2 < CURSOR_RADIUS_SQ) {
        const d = Math.sqrt(d2);
        const f = (1 - d / CURSOR_RADIUS) ** 3 * CURSOR_FORCE;
        fx += (vx / d) * f;
        fy += (vy / d) * f;
      }
    }

    for (let k = 0; k < numRipples; k++) {
      const ripple = ripples[k]!;
      const elapsed = now - ripple.start;
      const radius = (elapsed / 1000) * RIPPLE_SPEED;
      const life = 1 - elapsed / RIPPLE_DURATION;
      const sx = baseX[i]! - ripple.x;
      const sy = baseY[i]! - ripple.y;
      const d = Math.sqrt(sx * sx + sy * sy);
      if (d < 0.1) continue;
      const band = Math.abs(d - radius);
      if (band < RIPPLE_WIDTH) {
        const wf = (1 - band / RIPPLE_WIDTH) * life * RIPPLE_FORCE * rippleMul;
        fx += (sx / d) * wf;
        fy += (sy / d) * wf;
      }
    }

    if (dispersionAmount > 0.001 && !cursorActive && numRipples === 0) {
      // Snap directly toward scroll target to keep scroll response crisp and avoid idle drift
      offsetX[i] = offsetX[i]! + (fx - offsetX[i]!) * 0.28;
      offsetY[i] = offsetY[i]! + (fy - offsetY[i]!) * 0.28;
    } else {
      offsetX[i] = offsetX[i]! + (fx - offsetX[i]!) * LERP_FACTOR;
      offsetY[i] = offsetY[i]! + (fy - offsetY[i]!) * LERP_FACTOR;
    }

    if (Math.abs(offsetX[i]!) < SNAP_THRESHOLD && fx === 0) offsetX[i] = 0;
    if (Math.abs(offsetY[i]!) < SNAP_THRESHOLD && fy === 0) offsetY[i] = 0;
    if (
      Math.abs(offsetX[i]! - fx) > SNAP_THRESHOLD ||
      Math.abs(offsetY[i]! - fy) > SNAP_THRESHOLD
    ) {
      hasMotion = true;
    }
  }

  return hasMotion || numRipples > 0 || cursorActive;
};

const drawParticles = (
  ctx: CanvasRenderingContext2D,
  sys: ParticleSystem,
  particleColor: string,
  canvasW: number,
  canvasH: number,
  dpr: number,
  dispersionAmount: number,
) => {
  ctx.clearRect(0, 0, Math.round(canvasW * dpr), Math.round(canvasH * dpr));

  const fadeMul = Math.max(0.18, 1 - dispersionAmount * 0.55);
  const size = Math.max(0.65 * dpr, sys.size * dpr);

  ctx.fillStyle = particleColor;
  ctx.globalAlpha = fadeMul;

  for (let i = 0; i < sys.count; i++) {
    const rx = (sys.baseX[i]! + sys.offsetX[i]!) * dpr;
    const ry = (sys.baseY[i]! + sys.offsetY[i]!) * dpr;
    ctx.fillRect(rx, ry, size, size);
  }

  ctx.globalAlpha = 1;
};

export interface DitheredLogoProps {
  imageSrc: string;
  gridSize?: number;
  scale?: number;
  dotScale?: number;
  invert?: boolean;
  cornerRadius?: number;
  threshold?: number;
  contrast?: number;
  gamma?: number;
  blur?: number;
  diffusionStrength?: number;
  serpentine?: boolean;
  particleColor?: string;
  /** Disable pointer repulsion & ripples (or auto-disabled on touch/reduced motion). */
  interactive?: boolean;
  /** Fit sampled image across full container width instead of min(width, height). */
  fitWidth?: boolean;
  /** Optional continuous 0..1 MotionValue driving subtle radial dispersion on scroll without React re-renders. */
  dispersionProgress?: MotionValue<number>;
  /** Max radial particle scatter distance in CSS px at dispersionProgress === 1. */
  dispersionDistance?: number;
  style?: CSSProperties;
  className?: string;
}

export function DitheredLogo({
  imageSrc,
  gridSize = DEFAULTS.gridSize,
  scale = DEFAULTS.scale,
  dotScale = DEFAULTS.dotScale,
  invert = DEFAULTS.invert,
  cornerRadius = DEFAULTS.cornerRadius,
  threshold = DEFAULTS.threshold,
  contrast = DEFAULTS.contrast,
  gamma = DEFAULTS.gamma,
  blur = DEFAULTS.blur,
  diffusionStrength = DEFAULTS.diffusionStrength,
  serpentine = DEFAULTS.serpentine,
  particleColor = 'currentColor',
  interactive = true,
  fitWidth = false,
  dispersionProgress,
  dispersionDistance = 38,
  style,
  className = '',
}: DitheredLogoProps) {
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<ParticleSystem | null>(null);
  const cursorRef = useRef({x: 0, y: 0, active: false});
  const ripplesRef = useRef<Ripple[]>([]);
  const animFrameRef = useRef(0);
  const runningRef = useRef(false);
  const isVisibleRef = useRef(true);
  const dispersionRef = useRef(0);
  const prevConfigRef = useRef('');

  const [isMobile, setIsMobile] = useState(false);
  const [hasFinePointer, setHasFinePointer] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);

  const allowPointerInteraction =
    interactive && hasFinePointer && !prefersReducedMotion;

  const resolveParticleColor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return particleColor;
    return particleColor === 'currentColor'
      ? getComputedStyle(canvas).color
      : particleColor;
  }, [particleColor]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mqMobile = window.matchMedia('(max-width: 640px)');
    const mqPointer = window.matchMedia('(pointer: fine) and (hover: hover)');
    setIsMobile(mqMobile.matches);
    setHasFinePointer(mqPointer.matches);

    const onMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const onPointerChange = (e: MediaQueryListEvent) =>
      setHasFinePointer(e.matches);

    mqMobile.addEventListener('change', onMobileChange);
    mqPointer.addEventListener('change', onPointerChange);
    return () => {
      mqMobile.removeEventListener('change', onMobileChange);
      mqPointer.removeEventListener('change', onPointerChange);
    };
  }, []);

  const drawStaticFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const sys = systemRef.current;
    if (!canvas || !sys) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const disp = prefersReducedMotion ? 0 : dispersionRef.current;
    stepParticles(
      sys,
      0,
      0,
      false,
      ripplesRef.current,
      performance.now(),
      disp,
      dispersionDistance,
    );
    drawParticles(
      ctx,
      sys,
      resolveParticleColor(),
      rect.width,
      rect.height,
      dpr,
      disp,
    );
  }, [dispersionDistance, prefersReducedMotion, resolveParticleColor]);

  const startLoop = useCallback(() => {
    if (
      runningRef.current ||
      !isVisibleRef.current ||
      (typeof document !== 'undefined' && document.hidden)
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderFailed(true);
      return;
    }

    if (prefersReducedMotion) {
      drawStaticFrame();
      return;
    }

    runningRef.current = true;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const tick = () => {
      if (
        !isVisibleRef.current ||
        (typeof document !== 'undefined' && document.hidden)
      ) {
        runningRef.current = false;
        animFrameRef.current = 0;
        return;
      }

      const sys = systemRef.current;
      const currentCanvas = canvasRef.current;
      if (!sys || !currentCanvas) {
        runningRef.current = false;
        animFrameRef.current = 0;
        return;
      }

      const rect = currentCanvas.getBoundingClientRect();
      const disp = dispersionRef.current;
      const needsMore = stepParticles(
        sys,
        cursorRef.current.x,
        cursorRef.current.y,
        allowPointerInteraction && cursorRef.current.active,
        ripplesRef.current,
        performance.now(),
        disp,
        dispersionDistance,
      );

      drawParticles(
        ctx,
        sys,
        resolveParticleColor(),
        rect.width,
        rect.height,
        dpr,
        disp,
      );

      if (needsMore) {
        animFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        runningRef.current = false;
        animFrameRef.current = 0;
      }
    };

    animFrameRef.current = window.requestAnimationFrame(tick);
  }, [
    allowPointerInteraction,
    dispersionDistance,
    drawStaticFrame,
    prefersReducedMotion,
    resolveParticleColor,
  ]);

  const rebuild = useCallback(
    async (src: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !src) return;

      try {
        const img = await fetchImage(src);
        if (!canvasRef.current) return;

        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const effectiveGrid = isMobile ? Math.min(gridSize, 112) : gridSize;
        const processed = toGrayscaleGrid(
          img,
          effectiveGrid,
          contrast,
          gamma,
          blur,
        );
        const {width: gridW, height: gridH} = processed;

        let positions = errorDiffusionDither(
          processed.grayscale,
          gridW,
          gridH,
          {threshold, serpentine, diffusionStrength},
          processed.alpha,
        );

        if (invert) {
          positions = applyMaskInversion(
            positions,
            gridW,
            gridH,
            cornerRadius,
            processed.alpha,
          );
        }

        const scaleFactor = fitWidth
          ? Math.max(0.5, (rect.width * scale) / gridW)
          : Math.max(
              0.5,
              (Math.min(rect.width, rect.height) * scale) /
                Math.max(gridW, gridH),
            );
        const originX = Math.round((rect.width - gridW * scaleFactor) / 2);
        const originY = Math.round((rect.height - gridH * scaleFactor) / 2);
        const responsiveDotScale = isMobile ? dotScale * 0.85 : dotScale;

        systemRef.current = initParticles(
          positions,
          scaleFactor,
          responsiveDotScale,
          originX,
          originY,
          rect.width / 2,
          rect.height / 2,
        );
        setRenderFailed(false);
        drawStaticFrame();
        if (!prefersReducedMotion) {
          startLoop();
        }
      } catch {
        setRenderFailed(true);
      }
    },
    [
      gridSize,
      scale,
      dotScale,
      invert,
      cornerRadius,
      threshold,
      contrast,
      gamma,
      blur,
      diffusionStrength,
      serpentine,
      isMobile,
      fitWidth,
      prefersReducedMotion,
      drawStaticFrame,
      startLoop,
    ],
  );

  useEffect(() => {
    const key = JSON.stringify([
      imageSrc,
      gridSize,
      scale,
      dotScale,
      invert,
      cornerRadius,
      threshold,
      contrast,
      gamma,
      blur,
      diffusionStrength,
      serpentine,
      isMobile,
    ]);
    if (key === prevConfigRef.current) return;
    prevConfigRef.current = key;
    void rebuild(imageSrc);
  }, [
    imageSrc,
    gridSize,
    scale,
    dotScale,
    invert,
    cornerRadius,
    threshold,
    contrast,
    gamma,
    blur,
    diffusionStrength,
    serpentine,
    isMobile,
    rebuild,
  ]);

  // Subscribe to scroll MotionValue directly without React re-renders
  useEffect(() => {
    if (!dispersionProgress) {
      dispersionRef.current = 0;
      return;
    }

    dispersionRef.current = dispersionProgress.get();
    const unsubscribe = dispersionProgress.on('change', (latest) => {
      dispersionRef.current = Math.max(0, Math.min(1, latest));
      if (isVisibleRef.current && systemRef.current && !prefersReducedMotion) {
        startLoop();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispersionProgress, prefersReducedMotion, startLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderFailed(true);
      return;
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastW = 0;
    let lastH = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));

      const sys = systemRef.current;
      if (sys) {
        drawParticles(
          ctx,
          sys,
          resolveParticleColor(),
          rect.width,
          rect.height,
          dpr,
          prefersReducedMotion ? 0 : dispersionRef.current,
        );
      }

      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (lastW !== 0 && (w !== lastW || h !== lastH)) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          void rebuild(imageSrc);
        }, 180);
      } else if (lastW === 0 && !sys) {
        void rebuild(imageSrc);
      }
      lastW = w;
      lastH = h;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!allowPointerInteraction || event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      cursorRef.current.x = event.clientX - rect.left;
      cursorRef.current.y = event.clientY - rect.top;
      cursorRef.current.active = true;
      startLoop();
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      cursorRef.current.active = false;
      if (systemRef.current && !prefersReducedMotion) {
        startLoop();
      }
    };

    const onPointerCancel = () => {
      cursorRef.current.active = false;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!allowPointerInteraction || event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      ripplesRef.current.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        start: performance.now(),
      });
      startLoop();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
        runningRef.current = false;
      } else if (isVisibleRef.current && systemRef.current) {
        drawStaticFrame();
      }
    };

    handleResize();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(handleResize)
        : null;
    resizeObserver?.observe(canvas);

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              if (!entry) return;
              isVisibleRef.current = entry.isIntersecting;
              if (!entry.isIntersecting) {
                window.cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = 0;
                runningRef.current = false;
              } else if (systemRef.current) {
                drawStaticFrame();
                if (!prefersReducedMotion) {
                  startLoop();
                }
              }
            },
            {threshold: 0.01, rootMargin: '80px 0px'},
          )
        : null;
    intersectionObserver?.observe(wrapper);

    const themeObserver = new MutationObserver(() => handleResize());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    document.addEventListener('visibilitychange', onVisibilityChange);
    canvas.addEventListener('pointermove', onPointerMove, {passive: true});
    canvas.addEventListener('pointerleave', onPointerLeave, {passive: true});
    canvas.addEventListener('pointercancel', onPointerCancel, {passive: true});
    canvas.addEventListener('pointerup', onPointerUp, {passive: true});

    return () => {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
      runningRef.current = false;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [
    allowPointerInteraction,
    drawStaticFrame,
    imageSrc,
    prefersReducedMotion,
    rebuild,
    resolveParticleColor,
    startLoop,
  ]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className={`relative select-none ${className}`}
      style={style}
    >
      {renderFailed ? (
        <svg
          viewBox="0 0 256 256"
          fill="none"
          className="h-full w-full p-4 opacity-75"
          aria-hidden="true"
        >
          <polygon
            points="128,18 232,80 232,176 128,238 24,176 24,80"
            stroke={particleColor === 'currentColor' ? 'currentColor' : particleColor}
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          <polygon
            points="128,44 204,88 128,132 52,88"
            stroke={particleColor === 'currentColor' ? 'currentColor' : particleColor}
            strokeWidth="2"
          />
          <circle
            cx="128"
            cy="136"
            r="10"
            fill={particleColor === 'currentColor' ? 'currentColor' : particleColor}
          />
        </svg>
      ) : (
        <canvas
          ref={canvasRef}
          tabIndex={-1}
          data-cursor={allowPointerInteraction ? 'interactive' : undefined}
          className={`absolute inset-0 block h-full w-full ${
            allowPointerInteraction ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        />
      )}
    </div>
  );
}

export default DitheredLogo;
