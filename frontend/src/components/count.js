import { useEffect, useRef, useState } from "react";

const Count = ({
  endValue,
  duration = 2000,
  className = "",
  format = "number", // "number" | "year"
  direction = "up", // "up" | "down"
  startValue // optional, for custom start
}) => {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    let startTime = null;
    const actualStart = typeof startValue === "number"
      ? startValue
      : direction === "up"
        ? 0
        : endValue < new Date().getFullYear() ? new Date().getFullYear() : endValue;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      let interpolatedValue;
      if (direction === "up") {
        interpolatedValue = actualStart + progressRatio * (endValue - actualStart);
      } else {
        interpolatedValue = actualStart - progressRatio * (actualStart - endValue);
      }
      const currentValue = Math.floor(interpolatedValue);
      const formatted =
        format === "number"
          ? currentValue.toLocaleString()
          : currentValue.toString();

      if (ref.current) ref.current.textContent = formatted;

      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        const finalFormatted =
          format === "number"
            ? endValue.toLocaleString()
            : endValue.toString();
        if (ref.current) ref.current.textContent = finalFormatted;
      }
    };

    requestAnimationFrame(step);
  }, [hasAnimated, duration, endValue, direction, format]);

  return (
    <div ref={ref} className={`text-4xl font-bold text-white ${className}`}>
      {format === "number"
        ? (typeof startValue === "number" ? startValue.toLocaleString() : "0")
        : (typeof startValue === "number" ? startValue.toString() : endValue.toString())}
    </div>
  );
};

export default Count;
