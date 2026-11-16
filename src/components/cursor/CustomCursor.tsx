import {useEffect, useRef} from 'react';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

type CursorMode = 'default' | 'link' | 'button' | 'project' | 'interactive' | 'text';
type SurfaceTone = 'light' | 'dark';

const LIGHT_SURFACE_DOT = '#09090b';
const LIGHT_SURFACE_RING = 'rgba(9, 9, 11, 0.82)';
const DARK_SURFACE_DOT = '#faf9f6';
const DARK_SURFACE_RING = 'rgba(250, 249, 246, 0.88)';
const TONE_TRANSITION = '280ms cubic-bezier(0.16, 1, 0.3, 1)';

function parseCssColorLightness(
  colorStr: string,
): {alpha: number; lightness: number} | null {
  const normalized = colorStr.trim().toLowerCase();
  if (!normalized || normalized === 'transparent') {
    return {alpha: 0, lightness: 1};
  }

  if (normalized.startsWith('rgb')) {
    const match = normalized.match(
      /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
    );
    if (!match) {
      return null;
    }
    const r = Number(match[1]) / 255;
    const g = Number(match[2]) / 255;
    const b = Number(match[3]) / 255;
    const rawAlpha = match[4];
    const alpha = rawAlpha
      ? rawAlpha.endsWith('%')
        ? Number(rawAlpha.slice(0, -1)) / 100
        : Number(rawAlpha)
      : 1;
    const lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return {alpha, lightness};
  }

  if (normalized.startsWith('oklab(') || normalized.startsWith('oklch(')) {
    const inner = normalized.slice(normalized.indexOf('(') + 1, -1).trim();
    const [colorPart, alphaPart] = inner.split('/');
    const parts = colorPart.trim().split(/\s+/);
    if (parts.length < 3) {
      return null;
    }
    const rawL = parts[0];
    const lightness = rawL.endsWith('%')
      ? Number(rawL.slice(0, -1)) / 100
      : Number(rawL);
    const rawAlpha = alphaPart?.trim();
    const alpha = rawAlpha
      ? rawAlpha.endsWith('%')
        ? Number(rawAlpha.slice(0, -1)) / 100
        : Number(rawAlpha)
      : 1;
    if (Number.isNaN(lightness) || Number.isNaN(alpha)) {
      return null;
    }
    return {alpha, lightness};
  }

  if (normalized.startsWith('color(')) {
    const inner = normalized.slice(6, -1).trim();
    const [colorPart, alphaPart] = inner.split('/');
    const parts = colorPart.trim().split(/\s+/);
    if (parts[0] === 'srgb' && parts.length >= 4) {
      const r = Number(parts[1]);
      const g = Number(parts[2]);
      const b = Number(parts[3]);
      const rawAlpha = alphaPart?.trim();
      const alpha = rawAlpha
        ? rawAlpha.endsWith('%')
          ? Number(rawAlpha.slice(0, -1)) / 100
          : Number(rawAlpha)
        : 1;
      const lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return {alpha, lightness};
    }
  }

  return null;
}

function resolveSurfaceTone(target: EventTarget | null): SurfaceTone {
  if (!(target instanceof Element)) {
    return 'light';
  }

  let el: Element | null = target;
  while (el && el !== document.documentElement) {
    const bg = window.getComputedStyle(el).backgroundColor;
    const parsed = parseCssColorLightness(bg);
    if (parsed && parsed.alpha >= 0.45) {
      return parsed.lightness < 0.5 ? 'dark' : 'light';
    }
    el = el.parentElement;
  }

  return target.closest('.theme-dark') ? 'dark' : 'light';
}

/**
 * Custom desktop cursor (inner dot + trailing outer ring) rendered via DOM refs
 * inside requestAnimationFrame. Automatically adapts dot/ring contrast to light
 * and dark surfaces underneath without triggering React re-renders.
 * Disabled automatically on coarse/touch pointers and prefers-reduced-motion.
 */
export function CustomCursor() {
  const prefersReducedMotion = useReducedMotion();
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') {
      document.documentElement.classList.remove('has-custom-cursor');
      return;
    }

    const pointerQuery = window.matchMedia('(pointer: fine) and (hover: hover)');
    if (!pointerQuery.matches) {
      document.documentElement.classList.remove('has-custom-cursor');
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    const labelEl = labelRef.current;
    if (!dot || !ring || !labelEl) {
      return;
    }

    document.documentElement.classList.add('has-custom-cursor');

    let targetX = -100;
    let targetY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;
    let isPressed = false;
    let currentMode: CursorMode = 'default';
    let currentLabel = '';
    let currentTone: SurfaceTone = 'light';
    let lastResolvedTarget: Element | null = null;
    let rafId = 0;
    let scrollRafId = 0;

    dot.dataset.surface = 'light';
    ring.dataset.surface = 'light';

    const applySurfaceTone = (tone: SurfaceTone) => {
      if (tone === currentTone) {
        return;
      }
      currentTone = tone;
      dot.dataset.surface = tone;
      ring.dataset.surface = tone;

      if (tone === 'dark') {
        dot.style.backgroundColor = DARK_SURFACE_DOT;
        ring.style.borderColor = DARK_SURFACE_RING;
        labelEl.style.color = DARK_SURFACE_DOT;
      } else {
        dot.style.backgroundColor = LIGHT_SURFACE_DOT;
        ring.style.borderColor = LIGHT_SURFACE_RING;
        labelEl.style.color = LIGHT_SURFACE_DOT;
      }
    };

    const applyModeStyles = (mode: CursorMode, labelText: string) => {
      if (mode === currentMode && labelText === currentLabel) {
        return;
      }
      currentMode = mode;
      currentLabel = labelText;
      ring.dataset.mode = mode;
      dot.dataset.mode = mode;

      if (mode === 'text') {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
        return;
      }

      if (isVisible) {
        dot.style.opacity = mode === 'project' ? '0' : '1';
        ring.style.opacity = '1';
      }

      if (mode === 'project' && labelText) {
        labelEl.textContent = labelText;
        labelEl.style.opacity = '1';
        ring.style.width = '76px';
        ring.style.height = '76px';
        ring.style.marginLeft = '-38px';
        ring.style.marginTop = '-38px';
      } else if (mode === 'button') {
        labelEl.textContent = '';
        labelEl.style.opacity = '0';
        ring.style.width = '46px';
        ring.style.height = '46px';
        ring.style.marginLeft = '-23px';
        ring.style.marginTop = '-23px';
      } else if (mode === 'link') {
        labelEl.textContent = '';
        labelEl.style.opacity = '0';
        ring.style.width = '38px';
        ring.style.height = '38px';
        ring.style.marginLeft = '-19px';
        ring.style.marginTop = '-19px';
      } else if (mode === 'interactive') {
        labelEl.textContent = labelText || '';
        labelEl.style.opacity = labelText ? '1' : '0';
        ring.style.width = labelText ? '62px' : '44px';
        ring.style.height = labelText ? '62px' : '44px';
        ring.style.marginLeft = labelText ? '-31px' : '-22px';
        ring.style.marginTop = labelText ? '-31px' : '-22px';
      } else {
        labelEl.textContent = '';
        labelEl.style.opacity = '0';
        ring.style.width = '30px';
        ring.style.height = '30px';
        ring.style.marginLeft = '-15px';
        ring.style.marginTop = '-15px';
      }
    };

    const resolveTargetContext = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        applyModeStyles('default', '');
        return;
      }

      const textControl = target.closest(
        'input, textarea, select, [contenteditable="true"], [data-cursor="text"]',
      );
      if (textControl) {
        applyModeStyles('text', '');
        return;
      }

      const customEl = target.closest<HTMLElement>('[data-cursor]');
      if (customEl) {
        const mode = (customEl.dataset.cursor as CursorMode) || 'default';
        const label = customEl.dataset.cursorLabel || '';
        applyModeStyles(mode, label);
        return;
      }

      const buttonEl = target.closest('button');
      if (buttonEl) {
        applyModeStyles('button', '');
        return;
      }

      const linkEl = target.closest('a[href]');
      if (linkEl) {
        applyModeStyles('link', '');
        return;
      }

      applyModeStyles('default', '');
    };

    const syncTargetUnderPointer = (target: EventTarget | null) => {
      const targetEl = target instanceof Element ? target : null;
      if (targetEl === lastResolvedTarget) {
        return;
      }
      lastResolvedTarget = targetEl;
      resolveTargetContext(targetEl);
      applySurfaceTone(resolveSurfaceTone(targetEl));
    };

    const renderFrame = () => {
      dotX += (targetX - dotX) * 0.58;
      dotY += (targetY - dotY) * 0.58;
      ringX += (targetX - ringX) * 0.17;
      ringY += (targetY - ringY) * 0.17;

      const pressScale = isPressed ? 0.84 : 1;
      dot.style.transform = `translate3d(${dotX.toFixed(1)}px, ${dotY.toFixed(1)}px, 0) scale(${pressScale})`;
      ring.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0) scale(${pressScale})`;

      const settled =
        Math.abs(targetX - dotX) < 0.08 &&
        Math.abs(targetY - dotY) < 0.08 &&
        Math.abs(targetX - ringX) < 0.08 &&
        Math.abs(targetY - ringY) < 0.08;

      if (settled && !isPressed) {
        rafId = 0;
        return;
      }
      rafId = window.requestAnimationFrame(renderFrame);
    };

    const startLoop = () => {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') {
        return;
      }
      targetX = event.clientX;
      targetY = event.clientY;

      syncTargetUnderPointer(event.target);

      if (!isVisible) {
        isVisible = true;
        dotX = targetX;
        dotY = targetY;
        ringX = targetX;
        ringY = targetY;
        if (currentMode !== 'text') {
          dot.style.opacity = currentMode === 'project' ? '0' : '1';
          ring.style.opacity = '1';
        }
      }

      startLoop();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') {
        return;
      }
      isPressed = true;
      startLoop();
    };

    const handlePointerUp = () => {
      isPressed = false;
      startLoop();
      if (!isVisible) {
        return;
      }
      if (scrollRafId !== 0) {
        window.cancelAnimationFrame(scrollRafId);
      }
      scrollRafId = window.requestAnimationFrame(() => {
        scrollRafId = 0;
        lastResolvedTarget = null;
        syncTargetUnderPointer(document.elementFromPoint(targetX, targetY));
      });
    };

    const handleScroll = () => {
      if (!isVisible || scrollRafId !== 0) {
        return;
      }
      scrollRafId = window.requestAnimationFrame(() => {
        scrollRafId = 0;
        const el = document.elementFromPoint(targetX, targetY);
        lastResolvedTarget = null;
        syncTargetUnderPointer(el);
      });
    };

    const handleMouseLeaveWindow = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        isVisible = false;
        lastResolvedTarget = null;
        dot.style.opacity = '0';
        ring.style.opacity = '0';
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isVisible = false;
        dot.style.opacity = '0';
        ring.style.opacity = '0';
      }
    };

    const handlePointerMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        document.documentElement.classList.remove('has-custom-cursor');
        dot.style.opacity = '0';
        ring.style.opacity = '0';
      } else {
        document.documentElement.classList.add('has-custom-cursor');
      }
    };

    window.addEventListener('pointermove', handlePointerMove, {passive: true});
    window.addEventListener('pointerdown', handlePointerDown, {passive: true});
    window.addEventListener('pointerup', handlePointerUp, {passive: true});
    window.addEventListener('scroll', handleScroll, {passive: true});
    document.addEventListener('mouseout', handleMouseLeaveWindow, {passive: true});
    window.addEventListener('keydown', handleKeyDown, {passive: true});
    pointerQuery.addEventListener('change', handlePointerMediaChange);

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      if (scrollRafId !== 0) {
        window.cancelAnimationFrame(scrollRafId);
      }
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseout', handleMouseLeaveWindow);
      window.removeEventListener('keydown', handleKeyDown);
      pointerQuery.removeEventListener('change', handlePointerMediaChange);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] hidden overflow-hidden md:block"
    >
      {/* Trailing context-aware ring adapting smoothly to light/dark surfaces */}
      <div
        ref={ringRef}
        style={{
          opacity: 0,
          width: '30px',
          height: '30px',
          marginLeft: '-15px',
          marginTop: '-15px',
          borderColor: LIGHT_SURFACE_RING,
          transition: `width 220ms cubic-bezier(0.16, 1, 0.3, 1), height 220ms cubic-bezier(0.16, 1, 0.3, 1), margin 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color ${TONE_TRANSITION}, opacity 180ms ease`,
        }}
        className="fixed top-0 left-0 flex items-center justify-center rounded-full border"
      >
        <span
          ref={labelRef}
          style={{
            opacity: 0,
            color: LIGHT_SURFACE_DOT,
            transition: `color ${TONE_TRANSITION}, opacity 160ms ease`,
          }}
          className="text-[10px] font-medium tracking-[0.08em] uppercase"
        />
      </div>

      {/* Crisp pointer core */}
      <div
        ref={dotRef}
        style={{
          opacity: 0,
          width: '6px',
          height: '6px',
          marginLeft: '-3px',
          marginTop: '-3px',
          backgroundColor: LIGHT_SURFACE_DOT,
          transition: `background-color ${TONE_TRANSITION}, opacity 140ms ease`,
        }}
        className="fixed top-0 left-0 rounded-full"
      />
    </div>
  );
}
