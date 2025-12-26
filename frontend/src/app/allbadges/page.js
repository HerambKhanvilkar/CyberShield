"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState, useRef } from "react";
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import React from "react";
import Link from "next/link";
import PieBadgeOverlay from '@/components/PieBadgeOverlay';

export default function AllBadgesPage() {
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [badges, setBadges] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const accentColor = "#04d9ff"; // Neon blue
  const truncateText = (text, maxLength) => {
    if (text === null || text === undefined) {
      return '';
    }
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  
  
  // ============================================
  // LIGHT RAYS COMPONENT
  // ============================================
  // DEFAULT_COLOR will be replaced by palette color
  const DEFAULT_COLOR = '#04d9ff';
  
  const hexToRgb = hex => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (m) {
      // Use the exact color as provided, no boosting or clamping
      return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
    } else {
      console.warn('hexToRgb fallback: invalid hex', hex);
      // Fallback to a visible color
      return [0.5, 0.2, 1]; // bright purple
    }
  };
  
  const getAnchorAndDir = (origin, w, h) => {
    const outside = 0.2;
    switch (origin) {
      case 'top-left':
        return { anchor: [0, -outside * h], dir: [0, 1] };
      case 'top-right':
        return { anchor: [w, -outside * h], dir: [0, 1] };
      case 'left':
        return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
      case 'right':
        return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
      case 'bottom-left':
        return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
      case 'bottom-center':
        return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
      case 'bottom-right':
        return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
      default:
        return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
    }
  };
  
  const LightRays = ({
    raysOrigin = 'top-left',
    raysColor = DEFAULT_COLOR,
    raysSpeed = 0.8,
    lightSpread = 1,
    rayLength = 2,
    pulsating = false,
    fadeDistance = 1.0,
    saturation = 1.0,
    followMouse = true,
    mouseInfluence = 0.1,
    noiseAmount = 0.0,
    distortion = 0.0,
    className = ''
  }) => {
    const containerRef = useRef(null);
    const uniformsRef = useRef(null);
    const rendererRef = useRef(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
    const animationIdRef = useRef(null);
    const meshRef = useRef(null);
    const cleanupFunctionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const observerRef = useRef(null);
  
    useEffect(() => {
      if (!containerRef.current) return;
  
      observerRef.current = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );
  
      observerRef.current.observe(containerRef.current);
  
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }, []);
  
    // Debug: log the color used in the shader
    useEffect(() => {
      // Log the color and the rgb array actually used
      const rgb = hexToRgb(raysColor);
      console.log('LightRays shader using color:', raysColor, 'rgb:', rgb);
    }, [raysColor]);
  
    useEffect(() => {
      if (!isVisible || !containerRef.current) {
        if (cleanupFunctionRef.current) {
          cleanupFunctionRef.current();
          cleanupFunctionRef.current = null;
        }
        return;
      }
  
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
        cleanupFunctionRef.current = null;
      }
  
      const initializeWebGL = async () => {
        if (!containerRef.current) return;
  
        await new Promise(resolve => setTimeout(resolve, 10));
  
        if (!containerRef.current) return;
  
        const renderer = new Renderer({
          dpr: Math.min(window.devicePixelRatio, 2),
          alpha: true
        });
        rendererRef.current = renderer;
  
        const gl = renderer.gl;
        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';
  
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(gl.canvas);
  
        const vert = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;
  
        const frag = `precision highp float;
  
  uniform float iTime;
  uniform vec2  iResolution;
  uniform vec2  rayPos;
  uniform vec2  rayDir;
  uniform vec3  raysColor;
  uniform float raysSpeed;
  uniform float lightSpread;
  uniform float rayLength;
  uniform float pulsating;
  uniform float fadeDistance;
  uniform float saturation;
  uniform vec2  mousePos;
  uniform float mouseInfluence;
  uniform float noiseAmount;
  uniform float distortion;
  
  varying vec2 vUv;
  
  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                    float seedA, float seedB, float speed) {
    vec2 sourceToCoord = coord - raySource;
    vec2 dirNorm = normalize(sourceToCoord);
    float cosAngle = dot(dirNorm, rayRefDirection);
  
    float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
    
    float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
  
    float distance = length(sourceToCoord);
    float maxDistance = iResolution.x * rayLength;
    float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
    
    float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
    float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
  
    float baseStrength = clamp(
      (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
      (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
      0.0, 1.0
    );
  
    return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
  }
  
  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
    
    vec2 finalRayDir = rayDir;
    if (mouseInfluence > 0.0) {
      vec2 mouseScreenPos = mousePos * iResolution.xy;
      vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
      finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
    }
  
    vec4 rays1 = vec4(1.0) *
                rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                            1.5 * raysSpeed);
    vec4 rays2 = vec4(1.0) *
                rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                            1.1 * raysSpeed);
  
    fragColor = rays1 * 0.5 + rays2 * 0.4;
  
    if (noiseAmount > 0.0) {
      float n = noise(coord * 0.01 + iTime * 0.1);
      fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
    }
  
    float brightness = 1.0 - (coord.y / iResolution.y);
    fragColor.x *= 0.4 + brightness * 0.5;
    fragColor.y *= 0.1 + brightness * 0.3;
    fragColor.z *= 0.5 + brightness * 0.5;
  
    if (saturation != 1.0) {
      float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
      fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
    }
  
    fragColor.rgb *= raysColor;
  
    float alpha = clamp(fragColor.r + fragColor.g + fragColor.b, 0.0, 1.0);
    fragColor.a = alpha * 0.9;
  }
  
  void main() {
    vec4 color;
    mainImage(color, gl_FragCoord.xy);
    gl_FragColor = color; 
  }`;
  
        const program = new Program(gl, {
          vertex: vert,
          fragment: frag,
          uniforms: {
            iTime: { value: 0 },
            iResolution: { value: [gl.canvas.width, gl.canvas.height] },
            rayPos: { value: [0, 0] },
            rayDir: { value: [0, 1] },
            raysColor: { value: hexToRgb(raysColor || DEFAULT_COLOR) },
            raysSpeed: { value: raysSpeed },
            lightSpread: { value: lightSpread },
            rayLength: { value: rayLength },
            pulsating: { value: pulsating ? 1.0 : 0.0 },
            fadeDistance: { value: fadeDistance },
            saturation: { value: saturation },
            mousePos: { value: [smoothMouseRef.current.x, smoothMouseRef.current.y] },
            mouseInfluence: { value: mouseInfluence },
            noiseAmount: { value: noiseAmount },
            distortion: { value: distortion },
          },
          transparent: true
        });
  
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
        meshRef.current = mesh;
        uniformsRef.current = program.uniforms;
  
        const onResize = () => {
          const { clientWidth: w, clientHeight: h } = containerRef.current;
          renderer.setSize(w, h);
          const dpr = renderer.dpr;
  
          program.uniforms.iResolution.value = [w * dpr, h * dpr];
  
          const { anchor, dir } = getAnchorAndDir(raysOrigin, w * dpr, h * dpr);
          program.uniforms.rayPos.value = anchor;
          program.uniforms.rayDir.value = dir;
        };
  
        const onRaf = (t) => {
          program.uniforms.iTime.value = t * 0.001;
  
          const mouseXTarget = followMouse ? mouseRef.current.x : 0.5;
          const mouseYTarget = followMouse ? mouseRef.current.y : 0.5;
          smoothMouseRef.current.x += (mouseXTarget - smoothMouseRef.current.x) * 0.1;
          smoothMouseRef.current.y += (mouseYTarget - smoothMouseRef.current.y) * 0.1;
  
          program.uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
  
          renderer.render({ scene: mesh });
          animationIdRef.current = requestAnimationFrame(onRaf);
        };
  
        onResize();
        window.addEventListener('resize', onResize);
        animationIdRef.current = requestAnimationFrame(onRaf);
  
        cleanupFunctionRef.current = () => {
          window.removeEventListener('resize', onResize);
          if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
          renderer.gl.canvas.remove();
        };
      };
  
      initializeWebGL();
  
      return () => {
        if (cleanupFunctionRef.current) {
          cleanupFunctionRef.current();
          cleanupFunctionRef.current = null;
        }
      };
    }, [
      isVisible,
      raysColor,
      raysSpeed,
      lightSpread,
      raysOrigin,
      rayLength,
      pulsating,
      fadeDistance,
      saturation,
      followMouse,
      mouseInfluence,
      noiseAmount,
      distortion
    ]);
  
    useEffect(() => {
      const handleMouseMove = e => {
        if (!containerRef.current || !followMouse) return;
  
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
  
        let x = (e.clientX - left) / width;
        let y = (e.clientY - top) / height;
  
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));
  
        mouseRef.current = { x, y };
      };
  
      if (followMouse) {
        window.addEventListener('mousemove', handleMouseMove);
      }
  
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, [followMouse, raysOrigin]);
  
    useEffect(() => {
      const u = uniformsRef.current;
      if (!u || !rendererRef.current) return;
  
      // Always use the provided raysColor, do not fallback to DEFAULT_COLOR
      u.raysColor.value = hexToRgb(raysColor);
      u.raysSpeed.value = raysSpeed;
      u.lightSpread.value = lightSpread;
      u.rayLength.value = rayLength;
      u.pulsating.value = pulsating ? 1.0 : 0.0;
      u.fadeDistance.value = fadeDistance;
      u.saturation.value = saturation;
      u.mouseInfluence.value = mouseInfluence;
      u.noiseAmount.value = noiseAmount;
      u.distortion.value = distortion;
  
      const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
      const dpr = rendererRef.current.dpr;
      const { anchor, dir } = getAnchorAndDir(raysOrigin, wCSS * dpr, hCSS * dpr);
      u.rayPos.value = anchor;
      u.rayDir.value = dir;
    }, [
      raysColor,
      raysSpeed,
      lightSpread,
      raysOrigin,
      rayLength,
      pulsating,
      fadeDistance,
      saturation,
      mouseInfluence,
      noiseAmount,
      distortion
    ]);
  
    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 w-full h-full ${className}`}
      />
    );
  };

useEffect(() => {
  let mounted = true;
  (async () => {
    setLoading(true);
    try {
      // Fetch all badges
      const res = await fetch(`${process.env.SERVER_URL}/badges`);
      const data = await res.json();
      const all = Array.isArray(data.badges) ? data.badges : [];
      if (!mounted) return;
      setAllBadges(all);

      // If user is logged in, fetch their badges and order owned badges first
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setBadges(all);
        setMyBadges([]);
        return;
      }

      try {
        const res2 = await fetch(`${process.env.SERVER_URL}/badges-earned`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data2 = await res2.json();
        const mine = Array.isArray(data2.badges) ? data2.badges : [];
        if (!mounted) return;
        setMyBadges(mine);

        const ownedSet = new Set(mine.map(b => String(b.badgeId || b.id)));
        const owned = all.filter(b => ownedSet.has(String(b.badgeId || b.id)));
        const unowned = all.filter(b => !ownedSet.has(String(b.badgeId || b.id)));
        setBadges([...owned, ...unowned]);
      } catch (err) {
        console.error('Failed to fetch user badges:', err);
        setBadges(all);
        setMyBadges([]);
      }
    } catch (err) {
      console.error('Failed to fetch badges:', err);
      setAllBadges([]);
      setBadges([]);
      setMyBadges([]);
    } finally {
      if (mounted) setLoading(false);
    }
  })();
  return () => { mounted = false };
}, []);

  // Helper to check ownership: returns true if user has this badge
  const isOwned = (badge) => {
    if (!myBadges || myBadges.length === 0) return false;
    // myBadges may contain badge objects with id or badgeId
    return myBadges.some(
      (b) =>
        String(b.badgeId || b.id) === String(b.badgeId || badge.id) ||
        String(b.badgeId || b.id) === String(badge.badgeId || badge.id)
    );
  };

  return (
    <>
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#000005]" />

        {/* Dynamic LightRays using accentColor from badge image */}
        {accentColor && (
          <>
            {console.log('LightRays accentColor prop:', accentColor)}
            <LightRays
              raysOrigin="top-center"
              raysColor={accentColor}
              raysSpeed={0.035}
              lightSpread={0.09}
              rayLength={0.3}
              pulsating={false}
              fadeDistance={0}
              saturation={2.8}
              followMouse={true}
              mouseInfluence={0.65}
              noiseAmount={0.01}
              distortion={0.02}
            />
            <LightRays
              raysOrigin="bottom-center"
              raysColor={accentColor}
              raysSpeed={0.04}
              lightSpread={0.09}
              rayLength={3}
              pulsating={true}
              fadeDistance={4.0}
              saturation={2.5}
              followMouse={true}
              mouseInfluence={0.65}
              noiseAmount={0.012}
              distortion={0.02}
            />
            <LightRays
              raysOrigin="left"
              raysColor={accentColor}
              raysSpeed={0.045}
              lightSpread={0.3}
              rayLength={3}
              pulsating={true}
              fadeDistance={4.5}
              saturation={2.7}
              followMouse={true}
              mouseInfluence={0.7}
              noiseAmount={0.015}
              distortion={0.02}
            />
            <LightRays
              raysOrigin="right"
              raysColor={accentColor}
              raysSpeed={0.045}
              lightSpread={0.3}
              rayLength={3}
              pulsating={true}
              fadeDistance={4.5}
              saturation={2.7}
              followMouse={true}
              mouseInfluence={0.7}
              noiseAmount={0.015}
              distortion={0.02}
            />
            <LightRays
              raysOrigin="bottom-left"
              raysColor={accentColor}
              raysSpeed={0.035}
              lightSpread={0.28}
              rayLength={3}
              pulsating={true}
              fadeDistance={4.0}
              saturation={2.4}
              followMouse={true}
              mouseInfluence={0.7}
              noiseAmount={0.012}
              distortion={0.02}
            />
            <LightRays
              raysOrigin="bottom-right"
              raysColor={accentColor}
              raysSpeed={0.035}
              lightSpread={0.28}
              rayLength={3}
              pulsating={true}
              fadeDistance={4.0}
              saturation={2.4}
              followMouse={true}
              mouseInfluence={0.7}
              noiseAmount={0.012}
              distortion={0.02}
            />
          </>
        )}
      </div>
      <Navbar />
      <main className="min-h-screen backdrop-blur-md text-white px-4 py-12">
        <section className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Available <span className="text-cyan-400">Achievements</span>
          </h1>
          <p className="text-lg text-gray-300">
            Complete challenges and earn badges to showcase your cybersecurity skills
          </p>
        </section>
        <section className="text-center max-w-4xl mx-auto mb-12">
        </section>
        {/* Always show all badges; owned badges will be highlighted, unowned appear grayscaled */}

        {loading ? (
          <p className="text-center text-gray-400">Loading badges...</p>
          ) : (
          <section style={{ gridAutoRows: '1fr' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {badges.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              You have not earned any badges yet.
            </p>
          ) : (
            badges.map((badge) => {
              const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
              const loggedIn = !!token;
              const owned = isOwned(badge);

              const baseClass = 'relative h-full flex flex-col bg-gradient-to-br from-gray-950 via-cyan-900/30 to-gray-900 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 transition duration-300 hover:shadow-cyan-400/20 hover:scale-[1.01]';
              const glassyUnownedClass = 'relative h-full flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition duration-300 hover:shadow-lg hover:scale-[1.01] filter grayscale contrast-75 opacity-70';
              const cardClass = loggedIn ? (owned ? baseClass : glassyUnownedClass) : baseClass;

              return (
                <Link href={`/badges/${badge.id}`} key={badge.id}>
                  <div className={cardClass} style={{ position: 'relative' }}>
                    {/* Pie overlay for badges with requirements */}
                    {loggedIn && badge.requires && badge.requires.length > 0 && (() => {
                      const ownedSet = new Set();
                      myBadges.forEach(mb => {
                        if (mb._id) ownedSet.add(String(mb._id));
                        if (mb.id) ownedSet.add(String(mb.id));
                        if (mb.badgeId) ownedSet.add(String(mb.badgeId));
                      });
                      return <PieBadgeOverlay requires={badge.requires} ownedSet={ownedSet} />;
                    })()}
                    {/* Lock overlay for unowned badges, absolutely centered in the card */}
                    {loggedIn && !owned && (
                      <div
                        className="lock-container"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 30,
                          pointerEvents: 'none',
                          width: '96px',
                          height: '96px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#04d9ff', // force neon blue for all children
                        }}
                      >
                        <div
                          className="lock"
                          style={{
                            width: '48px',
                            height: '36px',
                            backgroundColor: '#04d9ff',
                            borderRadius: '10px 10px 6px 6px',
                            position: 'relative',
                            top: 0,
                            left: 0,
                            margin: 0,
                            boxShadow: '0 2px 8px 0 #04d9ff44',
                            color: '#04d9ff',
                          }}
                        >
                          {/* Arc (shackle) */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '-22px',
                              left: '7px',
                              width: '34px',
                              height: '22px',
                              borderTop: '5px solid #04d9ff',
                              borderLeft: '5px solid #04d9ff',
                              borderRight: '5px solid #04d9ff',
                              borderRadius: '18px 18px 0 0',
                              background: 'transparent',
                              zIndex: 2,
                            }}
                          ></div>
                          <div className="keyhole" style={{ left: '20px', top: '12px', width: '8px', height: '14px', background: '#fff', border: '2px solid #04d9ff', boxShadow: '0 0 8px #04d9ff' }}></div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-center mb-4 relative z-10" style={{ position: 'relative' }}>
                      <img
                        src={badge.img?.data || `${process.env.SERVER_URL}/badge/images/${badge.id}`}
                        alt={badge.name}
                        crossOrigin="anonymous"
                        className="w-24 h-24 object-contain drop-shadow-xl"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-cyan-400 mb-2 text-center">
                      {badge.name}
                    </h3>
                    <p className="text-gray-400 text-sm text-center mb-4 flex-1">
                      {truncateText(badge.description, 150)}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-auto">
                      {badge.skillsEarned?.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-300/20"
                          title={skill}
                        >
                          {skill}
                        </span>
                      ))}
                      {badge.skillsEarned && badge.skillsEarned.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-300/20">
                          +{badge.skillsEarned.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
            )})
          )}
          </section>
        )}

        <div className="text-center mt-16">
          <Link
            href="/"
            className="inline-block px-6 py-3 border border-cyan-400 text-cyan-300 rounded hover:bg-cyan-500/10 transition"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
