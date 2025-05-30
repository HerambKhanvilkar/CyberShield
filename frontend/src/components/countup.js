import { useEffect, useRef, useState } from "react";

const CountUp = ({ endValue, duration = 2000, className = "" }) => {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 1 } // Trigger when 100% of the element is visible default was 0.3
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
      const currentValue = Math.floor(progressRatio * endValue);

      if (ref.current) {
        ref.current.textContent = currentValue.toLocaleString();
      }

      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        if (ref.current) {
          ref.current.textContent = endValue.toLocaleString();
        }
      }
    };

    requestAnimationFrame(step);
  }, [hasAnimated, duration, endValue]);

  return (
    <div ref={ref} className={`text-4xl font-bold text-white ${className}`}>
      0
    </div>
  );
};

export default CountUp;
