import React, { useRef, useEffect } from 'react';

const TronCircuitBackground = () => {
  const canvasRef = useRef(null);
  const tracesRef = useRef([]);
  const pulsesRef = useRef([]);
  const cursorRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef(null);

  // === CONFIGURABLE VARIABLES ===
  const GRID_SIZE = 80;
  const SEGMENTS_MIN = 3;
  const SEGMENTS_MAX = 5;
  const PULSE_SPAWN_CHANCE = 0.125;
  const PULSE_SPEED_MIN = 0.008;
  const PULSE_SPEED_MAX = 0.008;
  const PULSE_RADIUS = 6;
  const PULSE_SHADOW_BLUR = 15;
  const TRACE_NEAR_RADIUS = 100;
  const TRACE_OPACITY_NEAR = 0.2;
  const TRACE_OPACITY_FAR = 0.05;
  const TRACE_SHADOW_BLUR_NEAR = 20;
  const TRACE_SHADOW_BLUR_FAR = 10;
  const CANVAS_BACKGROUND_COLOR = '#000000';

  // === COLOR CONFIGURATION ===
  const TRACE_COLOR = '#00ffff';     // White traces
  const TRACE_GLOW_COLOR = '#00ffff'; // Cyan glow
  // const PULSE_COLOR = 'rgba(0, 255, 255, 1)'; //Original cyan pulse color
  // const PULSE_COLOR_STOP = 'rgba(0, 255, 255, 0)'; // Original cyan pulse color stop
  const PULSE_COLOR = 'rgba(56, 248, 72, 1)';
  const PULSE_COLOR_STOP = 'rgba(56, 248, 72, 0)';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width, height;
    let canvasRect = null;

    const resizeHandler = () => {
      clearTimeout(resizeHandler._debounce);
      resizeHandler._debounce = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        canvasRect = canvas.getBoundingClientRect();
        generateTraces();
      }, 150);
    };

    const moveHandler = (e) => {
      if (!canvasRect) canvasRect = canvas.getBoundingClientRect();
      cursorRef.current.x = e.clientX - canvasRect.left;
      cursorRef.current.y = e.clientY - canvasRect.top;
    };

    const clickHandler = () => {
      const cursor = cursorRef.current;

      const nearest = tracesRef.current.reduce(
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
        const speed =
          PULSE_SPEED_MIN +
          Math.random() * (PULSE_SPEED_MAX - PULSE_SPEED_MIN);

        if (pulsesRef.current.length < 30) {
          pulsesRef.current.push({
            path: nearest.path,
            progress: 0,
            speed,
          });
        } else {
          // Reuse the oldest pulse
          const recycled = pulsesRef.current.shift();
          pulsesRef.current.push({
            ...recycled,
            path: nearest.path,
            progress: 0,
            speed,
          });
        }
      }
    };

    const generateTraces = () => {
      const traces = [];
      const pulses = [];

      for (let y = 0; y < height; y += GRID_SIZE) {
        for (let x = 0; x < width; x += GRID_SIZE) {
          const path = [];
          let posX = x;
          let posY = y;
          path.push({ x: posX, y: posY });

          const segments =
            SEGMENTS_MIN +
            Math.floor(Math.random() * (SEGMENTS_MAX - SEGMENTS_MIN + 1));
          for (let i = 0; i < segments; i++) {
            const dir = Math.random() > 0.5 ? 'horizontal' : 'vertical';
            const len = GRID_SIZE * (Math.random() > 0.5 ? 1 : -1);
            if (dir === 'horizontal')
              posX = Math.min(width, Math.max(0, posX + len));
            else posY = Math.min(height, Math.max(0, posY + len));
            path.push({ x: posX, y: posY });
          }

          traces.push(path);

          if (Math.random() < PULSE_SPAWN_CHANCE) {
            pulses.push({
              path,
              progress: Math.random(),
              speed:
                PULSE_SPEED_MIN +
                Math.random() * (PULSE_SPEED_MAX - PULSE_SPEED_MIN),
            });
          }
        }
      }

      tracesRef.current = traces;
      pulsesRef.current = pulses;
    };

    const animate = () => {
      const cursor = cursorRef.current;
      ctx.clearRect(0, 0, width, height);

      let lastShadowBlur = null;
      let lastStrokeStyle = null;

      tracesRef.current.forEach((path) => {
        const isNear = path.some((pt) => {
          const dx = pt.x - cursor.x;
          const dy = pt.y - cursor.y;
          return dx * dx + dy * dy < TRACE_NEAR_RADIUS * TRACE_NEAR_RADIUS;
        });

        const strokeStyle = `rgba(255, 255, 255, ${
          isNear ? TRACE_OPACITY_NEAR : TRACE_OPACITY_FAR
        })`;
        const shadowBlur = isNear
          ? TRACE_SHADOW_BLUR_NEAR
          : TRACE_SHADOW_BLUR_FAR;

        if (lastStrokeStyle !== strokeStyle) {
          ctx.strokeStyle = strokeStyle;
          lastStrokeStyle = strokeStyle;
        }

        if (lastShadowBlur !== shadowBlur) {
          ctx.shadowColor = TRACE_GLOW_COLOR;
          ctx.shadowBlur = shadowBlur;
          lastShadowBlur = shadowBlur;
        }

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      });

      pulsesRef.current.forEach((pulse) => {
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
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, PULSE_RADIUS);
        gradient.addColorStop(0, PULSE_COLOR);
        gradient.addColorStop(1, PULSE_COLOR_STOP);

        ctx.fillStyle = gradient;
        ctx.shadowColor = TRACE_GLOW_COLOR;
        ctx.shadowBlur = PULSE_SHADOW_BLUR;

        ctx.beginPath();
        ctx.arc(x, y, PULSE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        pulse.progress += pulse.speed;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeHandler();
    animate();

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('click', clickHandler);
      cancelAnimationFrame(animationRef.current);
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
        transform: 'translateZ(0)',
      }}
    />
  );
};

export default TronCircuitBackground;
