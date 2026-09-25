export interface InputTuning {
  /** Pedal units per pixel of wheel/trackpad scroll. */
  wheel: number;
  /** Pedal units per pixel of finger movement. */
  touch: number;
}

export interface InputHandlers {
  pedal(amount: number, now: number): void;
  step(dir: 1 | -1): void;
  home(): void;
  end(): void;
}

const LINE_HEIGHT = 32;

/**
 * Turns every way of "scrolling" into pedaling. The page itself never scrolls.
 * Returns a cleanup function.
 */
export function attachRideInput(target: HTMLElement, tuning: InputTuning, h: InputHandlers) {
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return; // pinch-zoom / ctrl+wheel stays with the browser
    e.preventDefault();
    let dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (e.deltaMode === 1) dy *= LINE_HEIGHT;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    // Clamp freak spikes (some mice report huge single deltas).
    dy = Math.max(-240, Math.min(240, dy));
    h.pedal(dy * tuning.wheel, performance.now());
  };

  let lastY: number | null = null;
  const onTouchStart = (e: TouchEvent) => {
    lastY = e.touches.length === 1 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (lastY === null || e.touches.length !== 1) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = lastY - y; // finger up = ride forward
    lastY = y;
    h.pedal(dy * tuning.touch, performance.now());
  };
  const onTouchEnd = () => {
    lastY = null;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const el = document.activeElement;
    const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (typing) return;
    const onControl = el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        h.step(1);
        break;
      case ' ':
        if (onControl) return; // let Space press the focused button
        e.preventDefault();
        h.step(e.shiftKey ? -1 : 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        h.step(-1);
        break;
      case 'Home':
        e.preventDefault();
        h.home();
        break;
      case 'End':
        e.preventDefault();
        h.end();
        break;
    }
  };

  target.addEventListener('wheel', onWheel, { passive: false });
  target.addEventListener('touchstart', onTouchStart, { passive: true });
  target.addEventListener('touchmove', onTouchMove, { passive: false });
  target.addEventListener('touchend', onTouchEnd);
  target.addEventListener('touchcancel', onTouchEnd);
  window.addEventListener('keydown', onKey);

  return () => {
    target.removeEventListener('wheel', onWheel);
    target.removeEventListener('touchstart', onTouchStart);
    target.removeEventListener('touchmove', onTouchMove);
    target.removeEventListener('touchend', onTouchEnd);
    target.removeEventListener('touchcancel', onTouchEnd);
    window.removeEventListener('keydown', onKey);
  };
}
