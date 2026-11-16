import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';

export interface FisheyeGridItem {
  /** Image displayed inside the tile. */
  image: string;
  /** Accessible description for the image. */
  alt: string;
  /** Primary tile label. */
  title?: string;
  /** Secondary tile label, such as index or category. */
  meta?: string;
  /** Optional editorial sub-caption shown cleanly inside the tile frame. */
  subtitle?: string;
  /** Internal route for case-study navigation. */
  href?: string;
  /** Project slug identifier. */
  slug?: string;
  /** Highlights primary product (SmartReach AI) within the spatial field. */
  featured?: boolean;
  /** Optional crop focal bias in X (0..1, defaults to 0.5). */
  focalX?: number;
  /** Optional crop focal bias in Y (0..1, defaults to 0.08 top-aligned for websites). */
  focalY?: number;
}

export interface FisheyeInfiniteGridProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Items repeated across the infinite field. */
  items?: FisheyeGridItem[];
  /** Width of each tile in CSS pixels. */
  tileWidth?: number;
  /** Height of each tile in CSS pixels. */
  tileHeight?: number;
  /** Space between tiles in CSS pixels. */
  gap?: number;
  /** Strength of the lens warp. Set to 0 for a flat grid. */
  lensStrength?: number;
  /** Visual treatment for the grid surface and tile chrome. */
  theme?: 'dark' | 'light' | 'system';
  /** Distance of the subtle ambient hover drift in CSS pixels. */
  hoverNudge?: number;
  /** Momentum retained after releasing a drag, from 0 to 1. */
  inertia?: number;
  /** Amount of movement produced by trackpad or mouse-wheel input. */
  wheelSensitivity?: number;
  /** Callback fired when a user clicks/taps a tile without dragging. */
  onItemSelect?: (item: FisheyeGridItem) => void;
  /** Callback fired as hover moves across tiles inside the lens. */
  onItemHover?: (item: FisheyeGridItem | null) => void;
  /** Additional classes applied to the root container. */
  className?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const positiveMod = (n: number, m: number) => ((n % m) + m) % m;

const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform vec2 u_atlas_size;
  uniform vec2 u_offset;
  uniform float u_curvature;
  varying vec2 v_uv;

  void main() {
    vec2 centered = v_uv * 2.0 - 1.0;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 lens = vec2(centered.x * aspect, centered.y);
    float radius = dot(lens, lens) / (aspect * aspect + 1.0);
    float curve = u_curvature * (0.34 * radius + 0.12 * radius * radius);
    vec2 warped = lens / (1.0 + curve);
    vec2 warped_uv = vec2(warped.x / aspect, warped.y) * 0.5 + 0.5;
    vec2 world = vec2(
      warped_uv.x * u_resolution.x - u_offset.x,
      (1.0 - warped_uv.y) * u_resolution.y - u_offset.y
    );
    vec2 atlas_uv = fract(world / u_atlas_size);
    vec4 color = texture2D(u_texture, vec2(atlas_uv.x, 1.0 - atlas_uv.y));
    float edgeShade = clamp(radius * u_curvature * 0.14, 0.0, 0.26);
    color.rgb *= 1.0 - edgeShade;
    gl_FragColor = color;
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  focalX = 0.5,
  focalY = 0.08,
) {
  const natW = image.naturalWidth || 1;
  const natH = image.naturalHeight || 1;
  const scale = Math.max(width / natW, height / natH);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = clamp((natW - sourceWidth) * focalX, 0, natW - sourceWidth);
  const sourceY = clamp((natH - sourceHeight) * focalY, 0, natH - sourceHeight);

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

/**
 * Computes atlas grid layout so 4 portfolio projects weave diagonally without
 * repeating identically on top of each other.
 */
function getAtlasLayout(itemCount: number) {
  const cols = Math.max(2, Math.min(4, itemCount));
  const rows = Math.max(2, Math.ceil(itemCount / cols));
  return {cols, rows};
}

function getItemIndexForCell(
  col: number,
  row: number,
  cols: number,
  itemCount: number,
) {
  if (itemCount === 4 && cols === 4) {
    return (col + row * 2) % 4;
  }
  return (row * cols + col) % itemCount;
}

export function FisheyeInfiniteGrid({
  items = [],
  tileWidth = 238,
  tileHeight = 272,
  gap = 0,
  lensStrength = 0.24,
  theme = 'system',
  hoverNudge = 16,
  inertia = 0.94,
  wheelSensitivity = 0.42,
  onItemSelect,
  onItemHover,
  className,
  style,
  'aria-label': ariaLabel = 'Infinite draggable project showcase grid',
  ...rest
}: FisheyeInfiniteGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionRef = useRef({x: 68, y: 32});
  const velocityRef = useRef({x: 0, y: 0});
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    pointerType: 'mouse',
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    time: 0,
    movedDistance: 0,
  });
  const nudgeRef = useRef<{
    startedAt: number;
    x: number;
    y: number;
  } | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const onItemSelectRef = useRef(onItemSelect);
  const onItemHoverRef = useRef(onItemHover);

  onItemSelectRef.current = onItemSelect;
  onItemHoverRef.current = onItemHover;

  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(
    theme === 'light' ? 'light' : 'dark',
  );

  const resolvedItems = useMemo(() => items, [items]);

  useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const resolveSystemTheme = () => {
      const rootEl = document.documentElement;
      setResolvedTheme(
        rootEl.classList.contains('dark') ||
          (!rootEl.classList.contains('light') && mediaQuery.matches)
          ? 'dark'
          : 'light',
      );
    };

    const observer = new MutationObserver(resolveSystemTheme);
    resolveSystemTheme();
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    mediaQuery.addEventListener('change', resolveSystemTheme);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', resolveSystemTheme);
    };
  }, [theme]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || resolvedItems.length === 0) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      setWebglUnavailable(true);
      return;
    }

    const program = createProgram(gl);
    if (!program) {
      setWebglUnavailable(true);
      return;
    }

    const positionBuffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!positionBuffer || !texture) {
      setWebglUnavailable(true);
      return;
    }

    setWebglUnavailable(false);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const atlasSizeLocation = gl.getUniformLocation(program, 'u_atlas_size');
    const offsetLocation = gl.getUniformLocation(program, 'u_offset');
    const curvatureLocation = gl.getUniformLocation(program, 'u_curvature');
    const textureLocation = gl.getUniformLocation(program, 'u_texture');

    const safeTileWidth = Math.max(140, tileWidth);
    const safeTileHeight = Math.max(150, tileHeight);
    const safeGap = Math.max(0, gap);
    const cellWidth = safeTileWidth + safeGap;
    const cellHeight = safeTileHeight + safeGap;
    const {cols: atlasColumns, rows: atlasRows} = getAtlasLayout(
      resolvedItems.length,
    );

    const atlasCssWidth = Math.ceil(atlasColumns * cellWidth);
    const atlasCssHeight = Math.ceil(atlasRows * cellHeight);
    const atlasDpr = Math.min(window.devicePixelRatio || 1, 2);

    const atlas = document.createElement('canvas');
    atlas.width = Math.ceil(atlasCssWidth * atlasDpr);
    atlas.height = Math.ceil(atlasCssHeight * atlasDpr);
    const atlasContext = atlas.getContext('2d');
    if (!atlasContext) {
      setWebglUnavailable(true);
      return;
    }

    const loadedImages: Array<HTMLImageElement | null> = Array.from(
      {length: resolvedItems.length},
      () => null,
    );

    let disposed = false;
    let animationFrame = 0;
    let previousFrame = performance.now();
    let viewWidth = 1;
    let viewHeight = 1;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => {
      reducedMotionRef.current = motionQuery.matches;
      if (reducedMotionRef.current) {
        velocityRef.current = {x: 0, y: 0};
        nudgeRef.current = null;
      }
    };
    syncMotionPreference();
    motionQuery.addEventListener('change', syncMotionPreference);

    const safeInertia = clamp(inertia, 0, 0.98);
    const effectiveLens = clamp(lensStrength, 0, 2.5);

    const uploadAtlas = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlas,
      );
    };

    const drawAtlas = () => {
      const light = resolvedTheme === 'light';
      atlasContext.save();
      atlasContext.setTransform(atlasDpr, 0, 0, atlasDpr, 0, 0);

      atlasContext.fillStyle = light ? '#F2F0EC' : '#09090B';
      atlasContext.fillRect(0, 0, atlasCssWidth, atlasCssHeight);
      atlasContext.textBaseline = 'middle';

      for (let row = 0; row < atlasRows; row += 1) {
        for (let col = 0; col < atlasColumns; col += 1) {
          const itemIndex = getItemIndexForCell(
            col,
            row,
            atlasColumns,
            resolvedItems.length,
          );
          const item = resolvedItems[itemIndex]!;
          const image = loadedImages[itemIndex];
          const isFeatured = Boolean(item.featured);
          const isHovered = hoveredIndexRef.current === itemIndex;

          const x = col * cellWidth;
          const y = row * cellHeight;
          const inset = Math.max(12, Math.round(safeTileWidth * 0.06));
          const footerHeight = Math.max(38, Math.round(safeTileHeight * 0.165));
          const imageWidth = safeTileWidth - inset * 2;
          const imageHeight = safeTileHeight - inset * 2 - footerHeight;

          // Tile backing surface
          atlasContext.fillStyle = light
            ? isFeatured
              ? '#FAF9F6'
              : '#F6F4EF'
            : isFeatured
              ? '#141419'
              : '#101014';
          atlasContext.fillRect(x, y, safeTileWidth, safeTileHeight);

          // Crisp architectural border
          atlasContext.strokeStyle = light
            ? isHovered
              ? 'rgba(9, 9, 11, 0.45)'
              : isFeatured
                ? 'rgba(9, 9, 11, 0.25)'
                : 'rgba(9, 9, 11, 0.12)'
            : isHovered
              ? 'rgba(250, 249, 246, 0.5)'
              : isFeatured
                ? 'rgba(250, 249, 246, 0.28)'
                : 'rgba(250, 249, 246, 0.12)';
          atlasContext.lineWidth = isFeatured || isHovered ? 1.25 : 1;
          atlasContext.strokeRect(
            x + 0.5,
            y + 0.5,
            safeTileWidth - 1,
            safeTileHeight - 1,
          );

          // Image frame placeholder background
          atlasContext.fillStyle = light
            ? 'rgba(9, 9, 11, 0.04)'
            : 'rgba(250, 249, 246, 0.035)';
          atlasContext.fillRect(x + inset, y + inset, imageWidth, imageHeight);

          if (image && image.complete && image.naturalWidth > 0) {
            atlasContext.save();
            atlasContext.beginPath();
            atlasContext.rect(x + inset, y + inset, imageWidth, imageHeight);
            atlasContext.clip();
            drawCoverImage(
              atlasContext,
              image,
              x + inset,
              y + inset,
              imageWidth,
              imageHeight,
              item.focalX ?? 0.5,
              item.focalY ?? 0.08,
            );
            // Subtle contrast glaze keeping tiles unified inside dark/light surface
            atlasContext.fillStyle = light
              ? 'rgba(9, 9, 11, 0.04)'
              : isHovered
                ? 'rgba(9, 9, 11, 0.06)'
                : 'rgba(9, 9, 11, 0.14)';
            atlasContext.fillRect(x + inset, y + inset, imageWidth, imageHeight);
            atlasContext.restore();
          }

          // Inner image hairline
          atlasContext.strokeStyle = light
            ? 'rgba(9, 9, 11, 0.11)'
            : isFeatured
              ? 'rgba(250, 249, 246, 0.2)'
              : 'rgba(250, 249, 246, 0.12)';
          atlasContext.lineWidth = 1;
          atlasContext.strokeRect(
            x + inset + 0.5,
            y + inset + 0.5,
            imageWidth - 1,
            imageHeight - 1,
          );

          // Restrained editorial footer typography
          const titleY = y + safeTileHeight - inset - footerHeight * 0.52;
          const subtitleY = y + safeTileHeight - inset - footerHeight * 0.16;
          const titleSize = clamp(Math.round(safeTileWidth * 0.05), 11, 15);
          const metaSize = clamp(Math.round(safeTileWidth * 0.037), 9, 11);

          atlasContext.font = `600 ${titleSize}px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif`;
          atlasContext.fillStyle = light
            ? '#09090B'
            : isFeatured || isHovered
              ? '#FAF9F6'
              : '#F0EFEA';

          const displayTitle = item.title ?? item.alt;
          const clippedTitle =
            displayTitle.length > 22
              ? `${displayTitle.slice(0, 21)}…`
              : displayTitle;
          atlasContext.fillText(clippedTitle, x + inset, titleY);

          if (item.meta) {
            atlasContext.font = `500 ${metaSize}px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif`;
            atlasContext.fillStyle = light
              ? 'rgba(9, 9, 11, 0.58)'
              : isFeatured
                ? '#FAF9F6'
                : 'rgba(250, 249, 246, 0.58)';
            atlasContext.textAlign = 'right';
            atlasContext.fillText(item.meta, x + safeTileWidth - inset, titleY);
            atlasContext.textAlign = 'left';
          }

          if (item.subtitle) {
            atlasContext.font = `italic 500 ${Math.max(10, metaSize + 1)}px "Cormorant Garamond", Georgia, serif`;
            atlasContext.fillStyle = light
              ? 'rgba(56, 56, 62, 0.85)'
              : 'rgba(180, 180, 188, 0.88)';
            const clippedSub =
              item.subtitle.length > 34
                ? `${item.subtitle.slice(0, 33)}…`
                : item.subtitle;
            atlasContext.fillText(clippedSub, x + inset, subtitleY);
          }
        }
      }

      atlasContext.restore();
      uploadAtlas();
    };

    const currentNudge = (time: number) => {
      const nudge = nudgeRef.current;
      if (!nudge || reducedMotionRef.current) {
        return {x: 0, y: 0, active: false};
      }
      const elapsed = Math.max(0, time - nudge.startedAt);
      const progress = clamp(elapsed / 520, 0, 1);
      const settled = 1 - Math.pow(1 - progress, 3);
      const breathing = 1 + Math.sin(elapsed * 0.0042) * 0.07;
      const amount = settled * breathing;
      return {
        x: nudge.x * amount,
        y: nudge.y * amount,
        active: true,
      };
    };

    const mapClientToItemIndex = (
      clientX: number,
      clientY: number,
    ): number | null => {
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      if (sx < 0 || sy < 0 || sx > rect.width || sy > rect.height) {
        return null;
      }

      const cx = (sx / rect.width) * 2 - 1;
      const cy = 1 - (sy / rect.height) * 2;
      const aspect = rect.width / Math.max(rect.height, 1);
      const lx = cx * aspect;
      const ly = cy;
      const radius = (lx * lx + ly * ly) / (aspect * aspect + 1);
      const curve = effectiveLens * (0.34 * radius + 0.12 * radius * radius);
      const warpedX = lx / (1 + curve);
      const warpedY = ly / (1 + curve);
      const warpedUvX = (warpedX / aspect) * 0.5 + 0.5;
      const warpedUvY = warpedY * 0.5 + 0.5;

      const nudge = currentNudge(performance.now());
      const offX = positionRef.current.x + nudge.x;
      const offY = positionRef.current.y + nudge.y;

      const worldX = warpedUvX * rect.width - offX;
      const worldY = (1 - warpedUvY) * rect.height - offY;

      const wrappedX = positiveMod(worldX, atlasCssWidth);
      const wrappedY = positiveMod(worldY, atlasCssHeight);

      const col = Math.floor(wrappedX / cellWidth);
      const row = Math.floor(wrappedY / cellHeight);
      const localX = wrappedX - col * cellWidth;
      const localY = wrappedY - row * cellHeight;

      if (localX > safeTileWidth || localY > safeTileHeight) {
        return null;
      }

      return getItemIndexForCell(col, row, atlasColumns, resolvedItems.length);
    };

    const renderGrid = (time: number) => {
      const nudge = currentNudge(time);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, viewWidth, viewHeight);
      gl.uniform2f(atlasSizeLocation, atlasCssWidth, atlasCssHeight);
      gl.uniform2f(
        offsetLocation,
        positionRef.current.x + nudge.x,
        positionRef.current.y + nudge.y,
      );
      gl.uniform1f(curvatureLocation, effectiveLens);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return nudge.active;
    };

    const tick = (time: number) => {
      const delta = Math.min(32, time - previousFrame);
      previousFrame = time;
      const drag = dragRef.current;
      const velocity = velocityRef.current;

      if (!drag.active && !reducedMotionRef.current) {
        positionRef.current.x += velocity.x * delta;
        positionRef.current.y += velocity.y * delta;
        const decay = Math.pow(safeInertia, delta / 16.667);
        velocity.x *= decay;
        velocity.y *= decay;
      } else if (!drag.active) {
        velocity.x = 0;
        velocity.y = 0;
      }

      const nudgeActive = renderGrid(time);
      const hasVelocity = Math.hypot(velocity.x, velocity.y) > 0.006;

      if (drag.active || hasVelocity || nudgeActive) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        velocity.x = 0;
        velocity.y = 0;
        animationFrame = 0;
      }
    };

    const requestRender = () => {
      if (animationFrame) return;
      previousFrame = performance.now();
      animationFrame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewWidth = Math.max(1, rect.width);
      viewHeight = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.round(viewWidth * dpr));
      canvas.height = Math.max(1, Math.round(viewHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      requestRender();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    resize();

    resolvedItems.forEach((item, index) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (disposed) return;
        loadedImages[index] = image;
        drawAtlas();
        requestRender();
      };
      image.onerror = () => {
        if (disposed) return;
        drawAtlas();
        requestRender();
      };
      image.src = item.image;
    });
    drawAtlas();

    const commitNudge = (time: number) => {
      const nudge = currentNudge(time);
      if (!nudgeRef.current && !nudge.active) return;
      positionRef.current.x += nudge.x;
      positionRef.current.y += nudge.y;
      nudgeRef.current = null;
    };

    const updateHoverState = (clientX: number, clientY: number) => {
      const nextIndex = mapClientToItemIndex(clientX, clientY);
      if (nextIndex === hoveredIndexRef.current) return;
      hoveredIndexRef.current = nextIndex;
      if (nextIndex !== null) {
        const hoveredItem = resolvedItems[nextIndex] ?? null;
        onItemHoverRef.current?.(hoveredItem);
        root.dataset.cursorLabel = hoveredItem?.title ?? 'Inspect';
      } else {
        onItemHoverRef.current?.(null);
        delete root.dataset.cursorLabel;
      }
      drawAtlas();
      requestRender();
    };

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        updateHoverState(event.clientX, event.clientY);
      }
      if (
        event.pointerType !== 'mouse' ||
        event.buttons !== 0 ||
        reducedMotionRef.current ||
        dragRef.current.active ||
        hoverNudge <= 0
      ) {
        return;
      }

      const rect = root.getBoundingClientRect();
      const fromLeft = event.clientX < rect.left + rect.width / 2;
      const fromTop = event.clientY < rect.top + rect.height / 2;
      nudgeRef.current = {
        startedAt: performance.now(),
        x: (fromLeft ? 1 : -1) * hoverNudge,
        y: (fromTop ? 1 : -1) * hoverNudge * 0.42,
      };
      requestRender();
    };

    const onPointerLeave = () => {
      if (hoveredIndexRef.current !== null) {
        hoveredIndexRef.current = null;
        delete root.dataset.cursorLabel;
        onItemHoverRef.current?.(null);
        drawAtlas();
        requestRender();
      }
      if (dragRef.current.active) return;
      commitNudge(performance.now());
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      commitNudge(performance.now());
      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        pointerType: event.pointerType || 'mouse',
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        movedDistance: 0,
      };
      velocityRef.current = {x: 0, y: 0};
      root.dataset.dragging = 'true';
      if (event.pointerType !== 'touch') {
        root.setPointerCapture(event.pointerId);
      }
      requestRender();
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) {
        if (event.pointerType === 'mouse') {
          updateHoverState(event.clientX, event.clientY);
        }
        return;
      }

      const bounds = root.getBoundingClientRect();
      const outside =
        event.clientX <= bounds.left ||
        event.clientY <= bounds.top ||
        event.clientX >= bounds.right ||
        event.clientY >= bounds.bottom;

      if (outside) {
        drag.active = false;
        root.dataset.dragging = 'false';
        if (root.hasPointerCapture(event.pointerId)) {
          root.releasePointerCapture(event.pointerId);
        }
        requestRender();
        return;
      }

      const time = performance.now();
      const deltaTime = Math.max(8, time - drag.time);
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      drag.movedDistance += Math.hypot(deltaX, deltaY);

      positionRef.current.x += deltaX;
      // On coarse touch screens keep vertical touch dedicated to natural page scroll
      if (drag.pointerType !== 'touch') {
        positionRef.current.y += deltaY;
      }

      if (!reducedMotionRef.current) {
        velocityRef.current.x = clamp(deltaX / deltaTime, -2.4, 2.4);
        velocityRef.current.y =
          drag.pointerType !== 'touch'
            ? clamp(deltaY / deltaTime, -2.4, 2.4)
            : 0;
      }

      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.time = time;
      requestRender();
    };

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      const wasTapClick =
        drag.movedDistance < 7 &&
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 7;

      drag.active = false;
      root.dataset.dragging = 'false';
      if (root.hasPointerCapture(event.pointerId)) {
        root.releasePointerCapture(event.pointerId);
      }

      if (wasTapClick) {
        const hitIndex = mapClientToItemIndex(event.clientX, event.clientY);
        if (hitIndex !== null && resolvedItems[hitIndex]) {
          velocityRef.current = {x: 0, y: 0};
          onItemSelectRef.current?.(resolvedItems[hitIndex]!);
        }
      }

      requestRender();
    };

    const cancelDrag = () => {
      const drag = dragRef.current;
      if (!drag.active) return;
      drag.active = false;
      root.dataset.dragging = 'false';
      if (root.hasPointerCapture(drag.pointerId)) {
        root.releasePointerCapture(drag.pointerId);
      }
      requestRender();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [46, 0],
        ArrowRight: [-46, 0],
        ArrowUp: [0, 46],
        ArrowDown: [0, -46],
      };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        commitNudge(performance.now());
        positionRef.current.x += direction[0];
        positionRef.current.y += direction[1];
        velocityRef.current = {x: 0, y: 0};
        requestRender();
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        const rect = root.getBoundingClientRect();
        const centerIdx = mapClientToItemIndex(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        if (centerIdx !== null && resolvedItems[centerIdx]) {
          event.preventDefault();
          onItemSelectRef.current?.(resolvedItems[centerIdx]!);
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (dragRef.current.active || reducedMotionRef.current) return;
      commitNudge(performance.now());

      const modeMultiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? Math.max(viewHeight, 1)
            : 1;
      const impulse = Math.max(0, wheelSensitivity) * 0.0028;

      const isHorizontalIntent =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;

      if (isHorizontalIntent) {
        // Explicit horizontal swipe or Shift+Wheel pans freely on 2 axes without vertical lock
        event.preventDefault();
        const dx = event.deltaX !== 0 ? event.deltaX : event.deltaY;
        const dy = event.shiftKey ? 0 : event.deltaY;
        velocityRef.current.x = clamp(
          velocityRef.current.x - dx * modeMultiplier * impulse,
          -1.25,
          1.25,
        );
        velocityRef.current.y = clamp(
          velocityRef.current.y - dy * modeMultiplier * impulse,
          -1.25,
          1.25,
        );
      } else {
        // Never prevent normal vertical page scrolling; respond softly along X as user scrolls past
        velocityRef.current.x = clamp(
          velocityRef.current.x - event.deltaY * modeMultiplier * impulse * 0.45,
          -0.85,
          0.85,
        );
      }

      requestRender();
    };

    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
    window.addEventListener('blur', cancelDrag);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('wheel', onWheel, {passive: false});
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', syncMotionPreference);
      root.removeEventListener('pointerenter', onPointerEnter);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', endDrag);
      root.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('blur', cancelDrag);
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('wheel', onWheel);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, [
    gap,
    hoverNudge,
    inertia,
    lensStrength,
    resolvedItems,
    resolvedTheme,
    tileHeight,
    tileWidth,
    wheelSensitivity,
  ]);

  if (webglUnavailable) {
    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className={cn(
          'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4',
          resolvedTheme === 'light'
            ? 'bg-[#F2F0EC] text-[#09090B]'
            : 'bg-[#09090B] text-[#FAF9F6]',
          className,
        )}
      >
        {resolvedItems.map((item) => (
          <a
            key={item.slug ?? item.title ?? item.image}
            href={item.href ?? '#'}
            onClick={(event) => {
              if (onItemSelect) {
                event.preventDefault();
                onItemSelect(item);
              }
            }}
            className={cn(
              'group block overflow-hidden rounded-[var(--radius-md)] border p-3 transition-colors',
              resolvedTheme === 'light'
                ? 'border-black/15 bg-white hover:border-black/40'
                : 'border-white/15 bg-[#121216] hover:border-white/40',
            )}
          >
            <div className="aspect-[16/10] w-full overflow-hidden rounded-sm bg-black/20">
              <img
                src={item.image}
                alt={item.alt}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{item.title}</span>
              {item.meta && (
                <span className="tabular-nums text-xs opacity-65">
                  {item.meta}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div
      {...rest}
      ref={rootRef}
      role="region"
      tabIndex={0}
      aria-label={ariaLabel}
      data-dragging="false"
      data-cursor="project"
      className={cn(
        'group/fisheye-grid relative isolate w-full cursor-grab touch-pan-y select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset data-[dragging=true]:cursor-grabbing',
        !className?.includes('h-') && 'h-full',
        resolvedTheme === 'light'
          ? 'bg-[#F2F0EC] text-[#09090B] focus-visible:ring-[#09090B]/60'
          : 'bg-[#09090B] text-[#FAF9F6] focus-visible:ring-[#FAF9F6]/70',
        className,
      )}
      style={
        {
          ...style,
          WebkitFontSmoothing: 'antialiased',
        } as CSSProperties
      }
    >
      <span className="sr-only">
        Drag in any direction, swipe horizontally, or use arrow keys to explore
        the infinite project grid. Click a tile or use the project directory
        links below to open a case study.
      </span>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />

      {/* Restrained edge depth vignette */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 z-20',
          resolvedTheme === 'light'
            ? 'bg-[radial-gradient(circle_at_center,transparent_52%,rgba(42,35,24,0.12)_100%)]'
            : 'bg-[radial-gradient(circle_at_center,transparent_50%,rgba(9,9,11,0.44)_100%)]',
        )}
      />

      {/* Subtle top and bottom scrims tying grid into section borders */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b to-transparent',
          resolvedTheme === 'light' ? 'from-[#F2F0EC]/60' : 'from-[#09090B]/70',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t to-transparent',
          resolvedTheme === 'light' ? 'from-[#F2F0EC]/60' : 'from-[#09090B]/70',
        )}
      />
    </div>
  );
}

export default FisheyeInfiniteGrid;
