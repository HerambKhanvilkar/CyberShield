"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState, useRef } from "react";
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import React from "react";
import Link from "next/link";
import PieBadgeOverlay from '@/components/PieBadgeOverlay';
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Target, Award, Cpu, Globe, Lock, Unlock, ArrowRight, Activity, Terminal, Layers } from "lucide-react";

/**
 * BADGES_SYSTEM_V2
 * Techy UI with Framer Motion and OGL Shaders
 */

export default function BadgesPage() {
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const accentColor = "#04d9ff";

  // ============================================
  // ADVANCED SHADER AMBIANCE
  // ============================================
  const hexToRgb = hex => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [0.5, 0.2, 1];
  };

  const LightRays = ({ raysColor = "#04d9ff" }) => {
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting));
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (!isVisible || !containerRef.current) return;
      const renderer = new Renderer({ alpha: true, dpr: 2 });
      const gl = renderer.gl;
      containerRef.current.appendChild(gl.canvas);

      const program = new Program(gl, {
        vertex: `attribute vec2 position; varying vec2 vUv; void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`,
        fragment: `
          precision highp float;
          uniform float iTime;
          uniform vec3 color;
          varying vec2 vUv;
          void main() {
            vec2 uv = vUv - 0.5;
            float angle = atan(uv.y, uv.x);
            float dist = length(uv);
            float rays = sin(angle * 12.0 + iTime * 2.0) * sin(angle * 7.0 - iTime);
            float mask = smoothstep(0.5, 0.0, dist);
            gl_FragColor = vec4(color, mask * (rays * 0.2 + 0.1));
          }
        `,
        uniforms: { iTime: { value: 0 }, color: { value: hexToRgb(raysColor) } },
        transparent: true
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      let raf;
      const loop = (t) => {
        program.uniforms.iTime.value = t * 0.001;
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.render({ scene: mesh });
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); gl.canvas.remove(); };
    }, [isVisible, raysColor]);

    return <div ref={containerRef} className="absolute inset-0 pointer-events-none opacity-40" />;
  };

  // ============================================
  // DATA FETCHING
  // ============================================
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.SERVER_URL}/badges`);
        const data = await res.json();
        const all = Array.isArray(data.badges) ? data.badges : [];
        if (!mounted) return;
        setAllBadges(all);

        const token = localStorage.getItem('accessToken');
        if (!token) {
          setBadges(all);
          return;
        }

        const res2 = await fetch(`${process.env.SERVER_URL}/badges-earned`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data2 = await res2.json();
        const mine = Array.isArray(data2.badges) ? data2.badges : [];
        if (!mounted) return;
        setMyBadges(mine);

        const sorted = all.sort((a, b) => {
          const idA = parseInt(a.badgeId || a.id) || 0;
          const idB = parseInt(b.badgeId || b.id) || 0;
          return idA - idB;
        });
        setBadges(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  const isOwned = (badge) => myBadges.some(b => String(b.badgeId || b.id) === String(badge.badgeId || badge.id));

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-cyan-500/30">
      <style jsx global>{`
        .cyber-grid {
          background-image: linear-gradient(#04d9ff05 1px, transparent 1px), linear-gradient(90deg, #04d9ff05 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .tech-clip {
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
        }
        .glow-border {
          box-shadow: 0 0 20px rgba(4, 217, 255, 0.1), inset 0 0 20px rgba(4, 217, 255, 0.05);
        }
      `}</style>

      <div className="fixed inset-0 cyber-grid pointer-events-none" />
      <Navbar />

      <main className="relative z-10 px-6 pt-32 pb-24 max-w-[1400px] mx-auto">
        <header className="mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 text-cyan-500 font-mono text-xs tracking-[0.3em] uppercase"
          >
            <Activity className="size-4" />
            <span>Badges Active</span>
            <span className="h-[1px] flex-1 bg-cyan-900/40" />
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-3xl"
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
                OFFERED <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">BADGES</span>
              </h1>
              <p className="text-gray-400 text-lg md:text-xl font-light leading-relaxed">
                {myBadges.length > 0 ? "Deploying advanced credentialing protocols. Monitor your progression through the architecture." : "Explore the complete database of cybersecurity certifications and operational milestones."}
              </p>
            </motion.div>

            {myBadges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-6 bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10 backdrop-blur-md"
              >
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 font-mono">TOTAL_RECORDS</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400">{badges.length.toString().padStart(2, '0')}</div>
                </div>
                <div className="w-[1px] h-10 bg-cyan-500/20" />
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 font-mono">EARNED_STATUS</div>
                  <div className="text-2xl font-bold font-mono text-white">{myBadges.length.toString().padStart(2, '0')}</div>
                </div>
              </motion.div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-6">
            <div className="relative size-16">
              <motion.div
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="absolute inset-0 border-2 border-cyan-500/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="absolute inset-2 border-2 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full"
              />
            </div>
            <span className="font-mono text-xs text-cyan-500 animate-pulse uppercase tracking-widest">Loading All Badges...</span>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {badges.map((badge, index) => {
                const loggedIn = myBadges.length > 0 || (typeof window !== 'undefined' && !!localStorage.getItem('accessToken'));
                const owned = !loggedIn || isOwned(badge);

                return (
                  <motion.div
                    key={badge.id}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.9 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20 } }
                    }}
                    whileHover={{ scale: 1.02 }}
                    className="group"
                  >
                    <Link href={`/badges/${badge.id}`} className="block h-full">
                      <div className={`relative h-full flex flex-col tech-clip p-1 transition-all duration-500 bg-gradient-to-br ${owned ? 'from-cyan-500/20 via-transparent to-blue-500/20' : 'from-gray-800/10 via-transparent to-gray-800/10'}`}>
                        <div className={`relative h-full bg-[#0a0a0f] tech-clip p-8 flex flex-col ${owned ? 'glow-border' : 'opacity-60 saturate-50'}`}>

                          {/* Light Effect Background */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <LightRays raysColor={accentColor} />
                          </div>

                          {/* Card Header */}<div className="flex justify-between items-start mb-10 relative z-10">
                            {loggedIn ? (
                              <div className={`px-3 py-1 rounded text-[9px] font-mono tracking-widest uppercase border ${owned ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' : 'border-gray-500/40 text-gray-500 bg-gray-500/10'}`}>
                                {owned ? 'BADGE_UNLOCKED' : 'BADGE_LOCKED'}
                              </div>
                            ) : (
                              <div className="px-3 py-1 rounded text-[9px] font-mono tracking-widest uppercase border border-white/10 text-white/40 bg-white/5">
                                BADGE_STANDARD
                              </div>
                            )}
                            <div className="text-[10px] font-mono text-gray-700">NO_{(index + 1).toString().padStart(2, '0')}</div>
                          </div>

                          {/* Badge Visual */}
                          <div className="relative aspect-square w-40 mx-auto mb-10 group-hover:scale-110 transition-transform duration-500 ease-out">
                            <div className="absolute inset-0 bg-cyan-400/10 blur-[60px] rounded-full scale-50 group-hover:scale-100 transition-transform duration-700" />
                            <motion.img
                              src={badge.img?.data || `${process.env.SERVER_URL}/badge/images/${badge.id}`}
                              alt={badge.name}
                              crossOrigin="anonymous"
                              className={`w-full h-full object-contain relative z-10 ${owned ? 'drop-shadow-[0_0_20px_rgba(4,217,255,0.4)]' : 'grayscale contrast-125 brightness-50'}`}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 relative z-10 space-y-4">
                            <h3 className="text-2xl font-black tracking-tighter text-white group-hover:text-cyan-400 transition-colors">
                              {badge.name.toUpperCase()}
                            </h3>
                            <p className="text-gray-500 text-sm font-light leading-relaxed line-clamp-3 whitespace-pre-line">
                              {badge.description}
                            </p>
                          </div>

                          {/* Skills / Modules */}
                          <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                            <div className="flex flex-wrap gap-2">
                              {badge.skillsEarned?.slice(0, 4).map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-gray-400 font-mono uppercase tracking-tighter">
                                  {skill}
                                </span>
                              ))}
                              {badge.skillsEarned?.length > 4 && (
                                <span className="px-2 py-1 text-[10px] text-gray-600 font-mono">+{badge.skillsEarned.length - 4}</span>
                              )}
                            </div>
                          </div>

                          {/* Hover Action */}
                          <div className="absolute bottom-6 right-8 text-cyan-500 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                            <ArrowRight className="size-5" />
                          </div>

                          {/* Tech Accents */}
                          <div className="absolute top-0 right-10 w-[1px] h-10 bg-gradient-to-b from-cyan-500 to-transparent opacity-30" />
                          <div className="absolute top-10 right-0 w-10 h-[1px] bg-gradient-to-l from-cyan-500 to-transparent opacity-30" />

                          {/* Unlock Overlay */}
                          {loggedIn && !owned && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-20 bg-[#0a0a0f]/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="size-12 border border-red-500/40 rounded-full flex items-center justify-center text-red-500 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <Lock className="size-5" />
                              </div>
                              <div className="text-[10px] font-mono text-red-500 tracking-[0.4em] uppercase">Security_Exclusion</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
