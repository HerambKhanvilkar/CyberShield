'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, Shield, Award, Cpu, Globe, Lock, Unlock, ArrowRight, Activity, Terminal, Layers, Copy, ExternalLink, Calendar, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

/**
 * SHARED_CERTIFICATE_V2
 * Cyber-Tech UI with Framer Motion and OGL Shaders
 */

const SharedBadgePage = () => {
  const { certificateId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [badge, setBadge] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(false);
  const [user, setUser] = useState('');
  const [displayCertificateId, setDisplayCertificateId] = useState(null);
  const [error, setError] = useState('');
  const [earnersCount, setEarnersCount] = useState(null);
  const [earnedDate, setEarnedDate] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCertificateId || certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

    return <div ref={containerRef} className="absolute inset-0 pointer-events-none opacity-20" />;
  };

  useEffect(() => {
    const fetchByCertificate = async () => {
      if (!certificateId) return setIsLoading(false);
      try {
        const res = await axios.get(`${process.env.SERVER_URL}/verify-badge/certificate/${certificateId}`);
        if (!res.data || !res.data.verified) {
          setVerificationStatus(false);
          return;
        }

        setVerificationStatus(true);
        setUser(`${res.data.firstName || ''} ${res.data.lastName || ''}`.trim());
        setBadge(res.data.badge || null);
        setDisplayCertificateId(res.data.certificateId || certificateId);
        setEarnedDate(res.data.earnedDate || null);
      } catch (err) {
        console.error('Failed to load badge by certificate:', err);
        setError('Failed to load badge information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchByCertificate();
  }, [certificateId]);

  useEffect(() => {
    const fetchEarnersCount = async () => {
      if (!badge || !badge.id) return;
      try {
        const response = await axios.get(`${process.env.SERVER_URL}/badge/earners/${badge.id}`);
        setEarnersCount(response.data.earners);
      } catch (error) {
        console.error('Failed to fetch earners count:', error);
        setEarnersCount('N/A');
      }
    };
    fetchEarnersCount();
  }, [badge]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#020205] text-white">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="relative size-16">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="absolute inset-0 border-2 border-cyan-500/20 rounded-full" />
            <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="absolute inset-2 border-2 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full" />
          </div>
          <p className="mt-6 font-mono text-cyan-500 animate-pulse tracking-widest text-sm uppercase">Verifying_Credentials...</p>
        </div>
      </div>
    );
  }

  if (!verificationStatus) return notFound();

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-cyan-500/30 font-sans">
      <style jsx global>{`
        .cyber-grid {
          background-image: linear-gradient(#04d9ff05 1px, transparent 1px), linear-gradient(90deg, #04d9ff05 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .tech-clip {
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%);
        }
        .glow-border {
          box-shadow: 0 0 30px rgba(4, 217, 255, 0.05), inset 0 0 30px rgba(4, 217, 255, 0.02);
        }
        .scanline {
          position: relative;
          overflow: hidden;
        }
        .scanline::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(4, 217, 255, 0.05), transparent);
          animation: scan 4s linear infinite;
          pointer-events: none;
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      <div className="fixed inset-0 cyber-grid pointer-events-none" />
      <Navbar />

      <main className="relative z-10 px-6 pt-8 pb-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-green-500/70 tracking-widest uppercase">Verification Passed</div>
              <div className="text-sm font-medium text-gray-300">Issue_Date: <span className="text-white font-bold">{earnedDate ? formatDate(earnedDate) : 'N/A'}</span></div>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md group/cert scanline"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase">ID:</span>
              <code className="text-xs font-mono text-white tracking-widest bg-black/30 px-2 py-1 rounded border border-white/5 tabular-nums">
                {displayCertificateId || certificateId}
              </code>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-cyan-500/10 rounded-lg transition-all text-cyan-400 hover:text-cyan-300"
                title="Copy Certificate ID"
              >
                {copied ? <CheckCircle className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000" />

          <div className="relative rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-3xl border border-white/5 glow-border overflow-hidden">

            {/* Dynamic background rays */}
            <LightRays raysColor={accentColor} />

            <div className="flex flex-col lg:flex-row">
              {/* Left Panel: Visuals & Metrics */}
              <div className="lg:w-1/3 p-10 lg:border-r border-white/5 flex flex-col items-center">
                <div className="relative aspect-square w-full max-w-[240px] mb-12 group-hover:scale-105 transition-transform duration-700">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full scale-75" />
                  <img
                    crossOrigin="anonymous"
                    src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge?.image?.data}
                    alt={badge?.name}
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(4,217,255,0.4)]"
                  />
                </div>

                <div className="w-full space-y-3">
                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl relative overflow-hidden group/metric">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/metric:opacity-30 group-hover/metric:rotate-12 transition-all duration-300"><Award className="size-8" /></div>
                      <div className="text-[9px] font-mono text-cyan-500/60 mb-1 uppercase tracking-[0.2em]">Competency Level</div>
                      <div className="text-2xl font-black text-white tracking-tighter">{badge?.level || 'N/A'}</div>
                    </div>
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl relative overflow-hidden group/metric">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/metric:opacity-30 group-hover/metric:rotate-12 transition-all duration-300"><Users className="size-8" /></div>
                      <div className="text-[9px] font-mono text-cyan-500/60 mb-1 uppercase tracking-[0.2em]">Global Earners</div>
                      <div className="text-2xl font-black text-cyan-400 tracking-tighter tabular-nums">{earnersCount || '0'}</div>
                    </div>
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl relative overflow-hidden group/metric">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/metric:opacity-30 group-hover/metric:rotate-12 transition-all duration-300"><Layers className="size-8" /></div>
                      <div className="text-[9px] font-mono text-cyan-500/60 mb-1 uppercase tracking-[0.2em]">Vertical Sector</div>
                      <div className="text-xl font-black text-white tracking-tighter">{badge?.vertical || 'General'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Content & Information */}
              <div className="lg:w-2/3 p-4 space-y-4">
                <section>
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-4xl font-black tracking-[0.1em] text-cyan-400 uppercase mb-2 drop-shadow-[0_0_10px_rgba(4,217,255,0.3)]">
                      {user}
                    </h2>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white/90 mb-6 italic opacity-80">
                      {badge?.name}
                    </h1>
                    <p className="text-gray-400 text-base font-light leading-relaxed max-w-2xl border-l border-white/10 pl-6 whitespace-pre-line">
                      {badge?.description || "Advanced certification for technical excellence and operational proficiency in cybersecurity protocols."}
                    </p>
                  </motion.div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 font-mono text-xs text-cyan-500 uppercase tracking-[0.2em]">
                    <Terminal className="size-4" />
                    <span>Skills_Learned</span>
                    <span className="h-[1px] flex-1 bg-cyan-900/40" />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] w-6 bg-cyan-500/30" />
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">Foundational_Competencies</span>
                    </div>

                    {/* 2-Column Skills List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {badge?.skillsEarned && badge.skillsEarned.length > 0 ? (
                        badge.skillsEarned.map((skill, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (i * 0.05) }}
                            className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg group/skill hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all"
                          >
                            <div className="size-2 rounded-full bg-cyan-500/20 group-hover/skill:bg-cyan-500 transition-colors" />
                            <span className="text-sm font-medium text-gray-300 group-hover/skill:text-white uppercase tracking-tight">{skill}</span>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-2 text-gray-600 italic text-sm">No specific modules found in database records.</div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Passing Metrics Block */}
                <div className="grid grid-cols-1 gap-6 pt-2 border-t border-white/5">
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Award className="size-3" />
                      CANDIDATE EVALUATION
                    </div>
                    <div className="relative p-6 bg-black/40 border border-white/5 rounded-2xl overflow-hidden group/metrics">
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500/50 transition-colors" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="text-xs leading-relaxed text-gray-400 italic max-w-xl">
                          "Candidate demonstrated mastery of core principles, scoring at least 70% in all technical assessments and completing all mandatory operational tasks within the required timeframe."
                        </div>
                        {/* <div className="flex items-center gap-4 self-end md:self-center">
                          <div className="text-right">
                            <div className="text-[9px] font-mono text-gray-600 uppercase">Status</div>
                            <div className="text-xs font-bold text-green-400 font-mono tracking-tighter">QUALIFIED_ID:04-1</div>
                          </div>
                          <div className="size-10 rounded-full border border-green-500/30 flex items-center justify-center bg-green-500/5">
                            <CheckCircle className="size-5 text-green-400" />
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Accents */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] pointer-events-none" />
          </div>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
};

export default SharedBadgePage;