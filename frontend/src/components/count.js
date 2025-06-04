import { useEffect, useRef, useState } from "react";

const Count = ({
  endValue,
  duration = 2000,
  className = "",
  format = "number", // "number" | "year"
  direction = "up" // "up" | "down"
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

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      const interpolatedValue =
        direction === "up"
          ? progressRatio * endValue
          : endValue - progressRatio * endValue;

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
      {format === "number" ? "0" : endValue.toString()}
    </div>
  );
};

export default Count;
