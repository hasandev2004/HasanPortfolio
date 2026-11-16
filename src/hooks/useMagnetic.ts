import {useEffect, useRef, type RefObject} from 'react';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface UseMagneticOptions {
  /** Maximum translation in pixels along X and Y axes. Defaults to 6. */
  strength?: number;
  disabled?: boolean;
}

/**
 * Applies restrained magnetic pointer attraction directly via DOM transforms
 * inside requestAnimationFrame (zero React re-renders per pointer move).
 * Disabled automatically on coarse pointers, touch screens, and reduced motion.
 */
export function useMagnetic<T extends HTMLElement>({
  strength = 6,
  disabled = false,
}: UseMagneticOptions = {}): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled || prefersReducedMotion) {
      if (element) {
        element.style.transform = '';
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

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;
    let isHovered = false;

    const animate = () => {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;

      const isSettled =
        !isHovered &&
        Math.abs(currentX) < 0.06 &&
        Math.abs(currentY) < 0.06;

      if (isSettled) {
        element.style.transform = '';
        rafId = 0;
        return;
      }

      element.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
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
      const relX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const relY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, relX)) * strength;
      targetY = Math.max(-1, Math.min(1, relY)) * strength;
      isHovered = true;
      ensureLoop();
    };

    const handlePointerLeave = () => {
      isHovered = false;
      targetX = 0;
      targetY = 0;
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
    };
  }, [strength, disabled, prefersReducedMotion]);

  return ref;
}
