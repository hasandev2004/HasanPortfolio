import {useEffect, useRef, type RefObject} from 'react';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface UseCardTiltOptions {
  /** Maximum tilt rotation in degrees. Defaults to 3.5. */
  maxTiltDeg?: number;
  disabled?: boolean;
}

/**
 * Drives 3D perspective tilt and CSS pointer spotlight variables (--pointer-x,
 * --pointer-y, --spotlight-opacity) directly on the target card element via rAF.
 * Produces zero React state updates during pointer movement.
 */
export function useCardTilt<T extends HTMLElement>({
  maxTiltDeg = 3.5,
  disabled = false,
}: UseCardTiltOptions = {}): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled || prefersReducedMotion) {
      if (element) {
        element.style.transform = '';
        element.style.removeProperty('--pointer-x');
        element.style.removeProperty('--pointer-y');
        element.style.setProperty('--spotlight-opacity', '0');
      }
      return;
    }

    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      !window.matchMedia('(pointer: fine) and (hover: hover)').matches
    ) {
      return;
    }

    let targetRx = 0;
    let targetRy = 0;
    let currentRx = 0;
    let currentRy = 0;
    let pointerPctX = 50;
    let pointerPctY = 50;
    let isHovered = false;
    let rafId = 0;

    const animate = () => {
      currentRx += (targetRx - currentRx) * 0.16;
      currentRy += (targetRy - currentRy) * 0.16;

      element.style.setProperty('--pointer-x', `${pointerPctX.toFixed(1)}%`);
      element.style.setProperty('--pointer-y', `${pointerPctY.toFixed(1)}%`);
      element.style.setProperty('--spotlight-opacity', isHovered ? '1' : '0');

      const settled =
        !isHovered &&
        Math.abs(currentRx) < 0.03 &&
        Math.abs(currentRy) < 0.03;

      if (settled) {
        element.style.transform = '';
        rafId = 0;
        return;
      }

      element.style.transform = `perspective(1200px) rotateX(${currentRx.toFixed(2)}deg) rotateY(${currentRy.toFixed(2)}deg) translateZ(0)`;
      rafId = window.requestAnimationFrame(animate);
    };

    const ensureLoop = () => {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') {
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      const nx = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      pointerPctX = nx * 100;
      pointerPctY = ny * 100;
      targetRy = (nx - 0.5) * 2 * maxTiltDeg;
      targetRx = -(ny - 0.5) * 2 * maxTiltDeg;
      isHovered = true;
      ensureLoop();
    };

    const handlePointerLeave = () => {
      isHovered = false;
      targetRx = 0;
      targetRy = 0;
      ensureLoop();
    };

    element.addEventListener('pointermove', handlePointerMove, {passive: true});
    element.addEventListener('pointerleave', handlePointerLeave, {passive: true});

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', handlePointerLeave);
      element.style.transform = '';
      element.style.setProperty('--spotlight-opacity', '0');
    };
  }, [maxTiltDeg, disabled, prefersReducedMotion]);

  return ref;
}
