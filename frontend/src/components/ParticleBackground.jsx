import React, { useRef, useEffect } from 'react';

const TronCircuitBackground = () => {
  const canvasRef = useRef(null);

  const GRID_SIZE = 80;
  const SEGMENTS_MIN = 3;
  const SEGMENTS_MAX = 5;
  const PULSE_SPAWN_CHANCE = 0.125;
  const PULSE_SPEED_MIN = 0.004;  // faster than before
  const PULSE_SPEED_MAX = 0.008;
  const PULSE_RADIUS = 6;
  const PULSE_SHADOW_BLUR = 15;

  const TRACE_NEAR_RADIUS = 100;
  const TRACE_OPACITY_NEAR = 0.2;
  const TRACE_OPACITY_FAR = 0.05;
  const TRACE_SHADOW_BLUR_NEAR = 20;
  const TRACE_SHADOW_BLUR_FAR = 10;

  const CANVAS_BACKGROUND_COLOR = '#000000';

  let traces = [];
  let pulses = [];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width, height;
    let canvasRect = null;

    const cursor = { x: -1000, y: -1000 };

    const resizeHandler = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      canvasRect = canvas.getBoundingClientRect();
      generateTraces();
    };

    const moveHandler = (e) => {
      if (!canvasRect) canvasRect = canvas.getBoundingClientRect();
      cursor.x = e.clientX - canvasRect.left;
      cursor.y = e.clientY - canvasRect.top;
    };

    const clickHandler = () => {
      const nearest = traces.reduce(
        (closest, path) => {
          const dist = path.reduce((min, pt) => {
            const d = (pt.x - cursor.x) ** 2 + (pt.y - cursor.y) ** 2;
            return Math.min(min, d);
          }, Infinity);
          return dist < closest.dist ? { path, dist } : closest;
        },
        { path: null, dist: Infinity }
      );

      if (nearest.path) {
        if (pulses.length < 30) {
          pulses.push({
            path: nearest.path,
            progress: 0,
            speed: PULSE_SPEED_MIN + Math.random() * (PULSE_SPEED_MAX - PULSE_SPEED_MIN),
          });
        }
      }
    };

    const generateTraces = () => {
      traces = [];
      for (let y = 0; y < height; y += GRID_SIZE) {
        for (let x = 0; x < width; x += GRID_SIZE) {
          const path = [];
          let posX = x;
          let posY = y;
          path.push({ x: posX, y: posY });

          const segments = SEGMENTS_MIN + Math.floor(Math.random() * (SEGMENTS_MAX - SEGMENTS_MIN + 1));
          for (let i = 0; i < segments; i++) {
            const dir = Math.random() > 0.5 ? 'horizontal' : 'vertical';
            const len = GRID_SIZE * (Math.random() > 0.5 ? 1 : -1);

            if (dir === 'horizontal') posX = Math.min(width, Math.max(0, posX + len));
            else posY = Math.min(height, Math.max(0, posY + len));

            path.push({ x: posX, y: posY });
          }

          traces.push(path);
        }
      }

      pulses = traces
        .filter(() => Math.random() < PULSE_SPAWN_CHANCE)
        .map((path) => ({
          path,
          progress: Math.random(),
          speed: PULSE_SPEED_MIN + Math.random() * (PULSE_SPEED_MAX - PULSE_SPEED_MIN),
        }));
    };

    resizeHandler();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw traces with glow near cursor
      traces.forEach((path) => {
        const isNear = path.some(
          (pt) => Math.hypot(pt.x - cursor.x, pt.y - cursor.y) < TRACE_NEAR_RADIUS
        );

        ctx.strokeStyle = isNear
          ? `rgba(255, 255, 255, ${TRACE_OPACITY_NEAR})`
          : `rgba(255, 255, 255, ${TRACE_OPACITY_FAR})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = isNear ? TRACE_SHADOW_BLUR_NEAR : TRACE_SHADOW_BLUR_FAR;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      });

      // Draw glowing pulses (glowing dots) traveling on paths
      pulses.forEach((pulse) => {
        const path = pulse.path;
        const totalSegments = path.length - 1;
        let p = pulse.progress * totalSegments;
        let i = Math.floor(p);
        let t = p - i;

        if (i >= totalSegments) {
          pulse.progress = 0;
          return;
        }

        const start = path[i];
        const end = path[i + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // Current position along the segment
        const x = start.x + dx * t;
        const y = start.y + dy * t;

        // Draw glowing dot
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, PULSE_RADIUS);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = PULSE_SHADOW_BLUR;

        ctx.beginPath();
        ctx.arc(x, y, PULSE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        pulse.progress += pulse.speed;
      });

      requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('click', clickHandler);
    };
  }, []);

  return (
  <canvas
    ref={canvasRef}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -1,
      width: '100%',
      height: '100%',
      background: CANVAS_BACKGROUND_COLOR,
      pointerEvents: 'none',
      //willChange: 'transform',      // <-- GPU hint added here
        transform: 'translateZ(0)',   // <-- GPU hint added here (optional)
    }}
  />
);
};

export default TronCircuitBackground;
