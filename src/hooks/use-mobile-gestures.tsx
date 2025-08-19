import { useEffect, useRef } from 'react';

interface MobileGesturesProps {
  onPinchZoom?: (scale: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onDoubleTap?: () => void;
}

export function useMobileGestures({ onPinchZoom, onPan, onDoubleTap }: MobileGesturesProps = {}) {
  const elementRef = useRef<HTMLElement>(null);
  const gestureStateRef = useRef({
    initialDistance: 0,
    lastTouchTime: 0,
    isGesturing: false,
    lastPanPosition: { x: 0, y: 0 },
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const state = gestureStateRef.current;
      
      if (e.touches.length === 2) {
        // Pinch gesture start
        state.initialDistance = getDistance(e.touches[0], e.touches[1]);
        state.isGesturing = true;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        // Pan gesture start
        const touch = e.touches[0];
        state.lastPanPosition = { x: touch.clientX, y: touch.clientY };
        
        // Double tap detection
        const currentTime = Date.now();
        if (currentTime - state.lastTouchTime < 300) {
          onDoubleTap?.();
          e.preventDefault();
        }
        state.lastTouchTime = currentTime;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = gestureStateRef.current;
      
      if (e.touches.length === 2 && state.isGesturing) {
        // Pinch zoom
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / state.initialDistance;
        onPinchZoom?.(scale);
        e.preventDefault();
      } else if (e.touches.length === 1 && !state.isGesturing) {
        // Pan
        const touch = e.touches[0];
        const deltaX = touch.clientX - state.lastPanPosition.x;
        const deltaY = touch.clientY - state.lastPanPosition.y;
        onPan?.(deltaX, deltaY);
        state.lastPanPosition = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const state = gestureStateRef.current;
      if (e.touches.length < 2) {
        state.isGesturing = false;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPinchZoom, onPan, onDoubleTap]);

  return elementRef;
}