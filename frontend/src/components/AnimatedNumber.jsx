import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedNumber - Silky 60/120fps count-up animation with easeOutExpo
 * Designed for fintech / luxury banking feel (Apple Card / Revolut style)
 */
export default function AnimatedNumber({ value = 0, duration = 200, format = true }) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(numValue);
  const prevValRef = useRef(numValue);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = prevValRef.current;
    const end = numValue;
    if (start === end) return;

    let startTime = null;
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);

      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
        prevValRef.current = end;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [numValue, duration]);

  const formatted = format ? displayValue.toLocaleString() : displayValue;
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatted}</span>;
}
