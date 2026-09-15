/** Coalesce high-frequency pointer events without measuring transformed bounds. */
export function attachStampTilt(stamp: HTMLElement, reducedMotion: MediaQueryList) {
  let bounds: DOMRect | undefined;
  let frame = 0;
  let x = 0, y = 0;
  const reset = () => {
    cancelAnimationFrame(frame); frame = 0; bounds = undefined;
    stamp.classList.remove('is-tilting');
    stamp.style.removeProperty('--tilt-x'); stamp.style.removeProperty('--tilt-y');
  };
  const enter = () => { bounds = stamp.getBoundingClientRect(); };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) { reset(); return; }
    bounds ??= stamp.getBoundingClientRect();
    x = event.clientX; y = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!bounds || !stamp.isConnected || reducedMotion.matches) return;
      const angle = (value: number) => Math.max(-10, Math.min(10, value));
      stamp.classList.add('is-tilting');
      stamp.style.setProperty('--tilt-x', `${angle((.5 - (y-bounds.top)/bounds.height)*20)}deg`);
      stamp.style.setProperty('--tilt-y', `${angle(((x-bounds.left)/bounds.width-.5)*20)}deg`);
    });
  };
  stamp.addEventListener('pointerenter', enter);
  stamp.addEventListener('pointermove', move);
  for (const type of ['pointerleave', 'pointercancel', 'blur']) stamp.addEventListener(type, reset);
  reducedMotion.addEventListener('change', reset);
  return () => {
    reset();
    stamp.removeEventListener('pointerenter', enter);
    stamp.removeEventListener('pointermove', move);
    for (const type of ['pointerleave', 'pointercancel', 'blur']) stamp.removeEventListener(type, reset);
    reducedMotion.removeEventListener('change', reset);
  };
}
