"use client";
import React, { useRef, useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';
import { ChevronLeft, ChevronRight, Award,Trophy, Share2, Shield, BookOpen} from 'lucide-react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import { toast } from "react-toastify";
import axios from 'axios';
import Navbar from "@/components/Navbar";
import Footer from '@/components/Footer';
import { useAuthContext } from "@/components/AuthContext";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Print } from 'react-to-print';

const BadgeId = () => {
  const params = useParams();
  const badgeId = params?.badgeid;
  const activeButtonCss = "bg-primary text-primary-foreground p-5 w-max rounded-full";
  const buttonVariant = "secondary";
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [filter, setFilter] = useState('all');
  const [filterCss, setFilterCss] = useState({
        "allCss": activeButtonCss,
        "myCss": activeButtonCss.split(" ").splice(2).join(" "),
        "myVariant": buttonVariant,
        "allVariant": 'ghost' 
  });
  const [shareUrl, setShareUrl] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const { isAuthenticated, user } = useAuthContext();
  const [earnersCount, setEarnersCount] = useState(null);

  const pageRef = useRef(null);
  const handlePrint = () => {
    print(pageRef.current);
  };

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
  const fetchEarnersCount = async () => {
    if (!badgeId) return;

    try {
      const response = await axios.get(`${process.env.SERVER_URL}/badge/earners/${badgeId}`);
      setEarnersCount(response.data.earners);
    } catch (error) {
      console.error("Failed to fetch earners count:", error);
      setEarnersCount("N/A");
    }
  };

  fetchEarnersCount();
}, [badgeId]);


function handleBadgeFilter(filter){
    if (filter === 'all'){
      setBadges(allBadges) 
      setFilterCss({
        "allCss": activeButtonCss,
        "myCss": activeButtonCss.split(" ").splice(2).join(" "),
        "myVariant": buttonVariant,
        "allVariant": 'ghost'
      })
    } else {
      setBadges(earnedBadges);
      setFilterCss({
        "myCss": activeButtonCss,
        "allCss": activeButtonCss.split(" ").splice(2).join(" "),
        "myVariant": "ghost",
        "allVariant": buttonVariant
      })
    }
}

const scrollRef = useRef(null);

const scrollByAmount = 280; // each badge ~36px incl. spacing

const scrollLeft = () => {
  if (scrollRef.current) {
    scrollRef.current.scrollBy({ left: -scrollByAmount, behavior: "smooth" });
  }
};

const scrollRight = () => {
  if (scrollRef.current) {
    scrollRef.current.scrollBy({ left: scrollByAmount, behavior: "smooth" });
  }
};

function AllBadgeMyBadgeFilter() {
  return (
    // add fixed  to the nav class name to make the navbar stick to the bottom of the screen
      <div className={(earnedBadges.length > 0 ? "display" : "hidden") + " container mx-auto mt-2 flex items-center justify-center md:justify-start md:mx-4 space-x-5 "}>
        <Button onClick={() => handleBadgeFilter('all')} size="icon" className={filterCss['allCss']} variant={filterCss['allVariant']}>
          All Badges
        </Button>
        <Button onClick={() => handleBadgeFilter('my')} size="icon" className={filterCss['myCss']} variant={filterCss['myVariant']}>
          My Badges
        </Button>
      </div>
  )
}

useEffect(() => {
  const fetchAllBadges = async () => {
    try {
      setIsDataLoading(true);

      const token = localStorage.getItem('token');

      // 1. Get all badge metadata
      const responseBadges = await axios.get(`${process.env.SERVER_URL}/badges`);
      const allBadges = responseBadges.data.badges;

      setBadges(allBadges);
      setAllBadges(allBadges);

      // 2. If user is logged in, fetch earned badges from /auth/me
      if (user?.username && token) {
        const responseUser = await axios.get(`${process.env.SERVER_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        const earnedBadgesWithDates = responseUser.data.user.badges;

        // 3. Merge - match by new `badgeId` string if present, otherwise fall back to numeric id
        const mergedEarnedBadges = earnedBadgesWithDates.map((earnedBadge) => {
          const badgeMeta = allBadges.find(
            (b) => (b.badgeId && String(b.badgeId) === String(earnedBadge.badgeId)) || b.id === Number(earnedBadge.badgeId)
          );
          if (badgeMeta) {
            return {
              ...badgeMeta,
              earnedDate: earnedBadge.earnedDate,
              isPublic: earnedBadge.isPublic,
              certificateId: earnedBadge.certificateId || null,
            };
          }
          return null;
        }).filter(Boolean);

        setEarnedBadges(mergedEarnedBadges);
        console.log('Merged Earned Badges:', mergedEarnedBadges);
      } else {
        setEarnedBadges([]); // not logged in, no earned badges
      }

    } catch (err) {
      console.error('Error fetching badges:', err);
      setError('Failed to load badges from database. Please try again later.');
      setBadges([]);
    } finally {
      setIsDataLoading(false);
    }
  };

  fetchAllBadges(); // 🟢 Always call it
}, [user]);

  const difficultyColors = {
    Easy: 'bg-green-500',
    Medium: 'bg-blue-600',
    Hard: 'bg-orange-500',
    Expert: 'bg-purple-700',
    Extreme: 'bg-red-600',
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [currentBadgeIndex]);

  useEffect(() => {
    if (badges.length > 0 && badgeId) {
      const index = badges.findIndex(
        (b) => String(b.id) === String(badgeId) || String(b.badgeId) === String(badgeId)
      );
      if (index !== -1) setCurrentBadgeIndex(index)
      else setCurrentBadgeIndex(0);
    }
  }, [badges, badgeId]);


  const currentBadge =
    badges.length > 0
      ? badges[currentBadgeIndex]
      : {
          id: 0,
          name: 'Loading...',
          image: '',
          difficulty: 'Medium',
          description: 'Loading badge information...',
          category: 'Loading...',
          skillsEarned: [],
        };


  // Accent color extraction using fast-average-color
  const badgeImgUrl = currentBadge?.image?.data || `${process.env.SERVER_URL}/badge/images/${currentBadge?.id}`;
  // Use the bgcolor field from the badge data, fallback to DEFAULT_COLOR
  const accentColor = currentBadge?.bgcolor || DEFAULT_COLOR;
  const badgeImgRef = useRef(null);

  const earnedBadge = earnedBadges.find((badge) => badge.id === currentBadge?.id);

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4 animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading Badge Gallery...</p>
        </div>
      </div>
    );
  }

  //badge Actions Component
  const BadgeActions = ({ currentBadge, isAuthenticated, outerEarnedBadge }) => {
    const [earnedBadge, setEarnedBadge] = useState(null);
    const hasEarned = earnedBadge || outerEarnedBadge;
    const [showLoginMessage, setShowLoginMessage] = useState(false);
    const [showShareSuccess, setShowShareSuccess] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [formData, setFormData] = useState({
      badges: []
    });

    useEffect(() => {
      async function updatePublicStatus () {
          let toastId;
        try {
          if (formData.badges.length === 0 ){
            console.log("Form ain't filled ");
            return;
          }
          console.log("Attempting public ");
          const formDataObject = convertToFormData(formData);
          const apiUrl = process.env.SERVER_URL + '/user/profile';
          const token = localStorage.getItem("accessToken");

          toastId = toast.loading("Making badge Public...");
          const response = await axios.put(apiUrl, formDataObject, {
            headers: {
              'Content-Type': 'multipart/form-data', // Set the content type
              Authorization: `Bearer ${token}`, // Add the token to the headers
            },
          });

          toast.update(toastId ,{
            isLoading: false, 
            render:"Badge ready to share",
            type: "success",
            autoClose: 5000, 
          });
        } catch (e) {
          toast.update(toastId,{
            isLoading: false, 
            render:"Something went wrong",
            type: "error",
            autoClose: 5000, 
          });
          console.log(e);
        }
      }

     updatePublicStatus(); 

    }, [formData])

    useEffect(() => {
      // Prefer the outerEarnedBadge passed from parent (fresh, merged from /auth/me).
      if (outerEarnedBadge) {
        setEarnedBadge(outerEarnedBadge);
        return;
      }

      // Fallback: read from localStorage if parent did not provide earned badge info
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      try {
        const user = JSON.parse(userStr);
        const userBadges = user.badges || [];

        const match = userBadges.find((b) => String(b.badgeId) === String(currentBadge?.badgeId) || b.badgeId == currentBadge?.id || b.id == currentBadge?.id);
        if (match) {
          setEarnedBadge(match);
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }, [currentBadge?.id, currentBadge?.badgeId, outerEarnedBadge]);

    function convertToFormData(jsonObject) {
  const form = new FormData();

  for (const key in jsonObject) {
    if (Object.prototype.hasOwnProperty.call(jsonObject, key)) {
      const value = jsonObject[key];

      // Handle array of objects like badges
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            for (const subKey in item) {
              form.append(`${key}[${index}][${subKey}]`, item[subKey]);
            }
          } else {
            form.append(`${key}[${index}]`, item);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested single object
        for (const subKey in value) {
          form.append(`${key}[${subKey}]`, value[subKey]);
        }
      } else {
        form.append(key, value);
      }
    }
  }

  return form;
}


    const handleGenerateShareLink = async () => {
      // if (!isAuthenticated) {
      //   setShowLoginMessage(true);
      //   setTimeout(() => setShowLoginMessage(false), 3000);
      //   return;
      // }

      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      console.log("setting formData");
      setFormData((prevData) => {
        return {
          ...prevData,
          badges: [{badgeId: currentBadge?.id, isPublic: true}],
        };
      });

      const user = JSON.parse(userStr);
      // Prefer certificateId-based share URL when available
      let shareURL = '';
      try {
        // First try the local earned badgeentry
        const localEarned = earnedBadge;
        if (localEarned && localEarned.certificateId) {
          try {
            const v = await axios.get(`${process.env.SERVER_URL}/verify-badge/certificate/${encodeURIComponent(localEarned.certificateId)}`);
            const displayId = v?.data?.displayCertificateId || localEarned.certificateId;
            shareURL = `${window.location.origin}/badges/shared/${displayId}`;
          } catch (e) {
            shareURL = `${window.location.origin}/badges/shared/${localEarned.certificateId}`;
          }
        } else {
          // Try to find certificateId in stored user badges
          const certMatch = (user.badges || []).find(b => (
            String(b.badgeId) === String(currentBadge?.badgeId) || String(b.badgeId) === String(currentBadge?.id) || String(b.id) === String(currentBadge?.id)
          ) && b.certificateId);
          if (certMatch && certMatch.certificateId) {
            try {
              const v2 = await axios.get(`${process.env.SERVER_URL}/verify-badge/certificate/${encodeURIComponent(certMatch.certificateId)}`);
              const displayId2 = v2?.data?.displayCertificateId || certMatch.certificateId;
              shareURL = `${window.location.origin}/badges/shared/${displayId2}`;
            } catch (e) {
              shareURL = `${window.location.origin}/badges/shared/${certMatch.certificateId}`;
            }
          } else {
            // Fallback: ask backend to generate a share link (legacy path), requires auth
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            if (token) {
              try {
                const resp = await axios.post(`${process.env.SERVER_URL}/generate-share-link`, { badgeId: currentBadge?.id }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (resp?.data?.shareLink) {
                  shareURL = resp.data.shareLink.startsWith('http') ? resp.data.shareLink : `${window.location.origin}${resp.data.shareLink}`;
                }
              } catch (err) {
                console.warn('generate-share-link failed, falling back to client link', err);
              }
            }
            // Last-resort client-side legacy link
            if (!shareURL) {
              shareURL = `${window.location.origin}/badges/shared/old/${currentBadge?.badgeId || currentBadge?.id}/${user.username}/${Math.floor(Date.now() / 1000)}`;
            }
          }
        }
      } catch (err) {
        console.error('Error while building share link:', err);
        shareURL = `${window.location.origin}/badges/shared/old/${currentBadge?.badgeId || currentBadge?.id}/${user.username}/${Math.floor(Date.now() / 1000)}`;
      }

      setShareUrl(shareURL);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);
      try { await navigator.clipboard.writeText(shareURL); } catch (e) { /* ignore */ }
    };

    return (
  <div className="flex flex-row flex-wrap gap-2 md:flex-col md:space-y-4">

    {hasEarned ? (
      <>
        {/* Share Link Pill */}
        <button
          className="bg-blue-600 hover:bg-blue-700 mx-auto transition rounded-full p-2 px-3 shadow-md flex items-center space-x-2 md:rounded-md md:p-3"
          onClick={handleGenerateShareLink}
        >
          <Share2 className="w-5 h-5 md:w-6 md:h-6" />
          <span className="text-sm md:text-base whitespace-nowrap">
            <span>Share</span>
          </span>
        </button>
        <button           
          className="bg-blue-600 hover:bg-blue-700 mx-auto transition rounded-full p-2 px-3 shadow-md flex items-center space-x-2 md:rounded-md md:p-3"
          onClick={() => handlePrint()}>Print Page
        </button>
      </>
    ) : (
      <>
      <button
        className="bg-indigo-600 mx-auto hover:bg-indigo-700 transition rounded-full p-2 px-3 shadow-md flex items-center space-x-2 md:rounded-md md:p-3"
        onClick={() => (window.location.href = 'https://learn.deepcytes.io/')}
      >
        <Award className="w-5 h-5 md:w-6 md:h-6" />
        <span className="text-sm md:text-base whitespace-nowrap">
          <span className="block md:hidden">Get</span>
          <span className="hidden md:block">Get this Badge</span>
        </span>
      </button>
      <button
        onClick={() => {
          window.print();
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Print Page
      </button>
      </>
    )}

    {/* Feedback messages */}
    {showShareSuccess && (
      <div className="bg-green-600 text-white p-2 rounded-md text-center animate-pulse text-sm md:text-base w-full">
        Link generated! Share URL copied to clipboard.
      </div>
    )}

    {showLoginMessage && (
      <div className="bg-red-600 text-white p-2 rounded-md text-center animate-pulse text-sm md:text-base w-full">
        Please log in to generate a share link.
      </div>
    )}
  </div>
);
  }

const BadgeMetrics = () => (
  <div className="w-full flex flex-col gap-2 mt-0 lg:mt-15">
    {/* Top Row: Level + Earners + Vertical */}
    <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-stretch print:flex-row print:justify-between print:items-stretch gap-2">
      {/* Level */}
      <div className="relative flex-1 flex flex-col">
        <div className="flex-1 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] p-4 flex flex-col justify-between text-center min-h-[50px] transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]">
          <div className="text-sm uppercase text-gray-600">Level</div>
          <div className="text-lg font-semibold my-auto text-white">{currentBadge?.level || "N/A"}</div>
        </div>
      </div>

      {/* Earners */}
      <div className="relative flex-1 flex flex-col">
        <div className="flex-1 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] p-4 flex flex-col justify-between text-center min-h-[50px] transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]">
          <div className="text-sm uppercase text-gray-600">Earners</div>
          <div className="text-lg font-semibold my-auto text-white">
            {earnersCount !== null ? earnersCount : '...'}
          </div>
        </div>
      </div>

      {/* Vertical */}
      <div className="relative flex-1">
        <div className="flex-1 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] p-4 flex flex-col justify-between text-center min-h-[50px] transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]">
          <div className="text-sm uppercase text-gray-600">Vertical</div>
          <div className="text-lg font-semibold text-white">
            {currentBadge?.vertical || "General"}
          </div>
        </div>
      </div>
    </div>

    {/* Course Block */}
    <div className="relative w-full">
      <div className="flex-1 p-4 mt-1 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
          <BookOpen />
          Course
        </h3>
        <p className="text-blue-300 text-sm font-medium">
          {currentBadge?.course || "No course linked to this badge."}
        </p>
      </div>
    </div>
  </div>
);

  // Badge Description Block
const BadgeDescription = () => (
  <div className="relative">

    {/* Badge Details Block */}
    <div className="relative z-20 space-y-4 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
      <h2 className="text-2xl font-semibold border-b border-cyan-500 pb-2 text-white flex items-center gap-2">
        <Trophy />
        Badge Details
      </h2>

      <p className="text-gray-300 max-h-[170px] overflow-y-auto scrollbar leading-relaxed text-sm font-medium">
        {currentBadge?.description || 'No description available for this badge.'}
      </p>
    </div>
  </div>
);

// Skills Earned Component with glow on hover
const SkillsEarned = () => (
  <div className="space-y-2">
    <h2 className="text-2xl font-semibold border-b border-cyan-500 pb-2 text-white flex items-center gap-2">
      <Shield className="w-6 h-6 mr-1 text-blue-400" />
      Skills Earned
    </h2>
    <div className="grid grid-cols-2 gap-3">
      {currentBadge?.skillsEarned?.map((skill, idx) => (
        <div key={idx} className="relative rounded-2xl h-full">
          <div
            className="h-full w-full flex items-center text-sm rounded-2xl bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] px-3 py-2 text-white
              transition-shadow duration-300 ease-in-out
              hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]"
          >
            <Shield className="w-5 h-5 mr-1 text-blue-400" />
            <span className="text-sm font-medium">{skill}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

 // Related Badges Component
const RelatedBadges = () => (
  <div>
    <h3 className="text-xl font-semibold border-b border-cyan-500 pb-1 mt-6 text-white">
      Related Badges
    </h3>

    <div className="flex space-x-2 overflow-x-auto scrollbar py-2">
      {allBadges
        .filter((b) => b.id !== currentBadge?.id)
        .slice(0, 3)
        .map((relatedBadge) => (
          <div
            key={relatedBadge.id}
            className="mx-2 relative flex-shrink-0 min-w-[6rem] md:min-w-[6.5rem]"
          >
            <div
              className="cursor-pointer flex flex-col items-center space-y-2 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg p-2
              transition-shadow duration-300 ease-in-out
              hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]"
              onClick={() => {
                const index = badges.findIndex((b) => b.id === relatedBadge.id);
                if (index !== -1) setCurrentBadgeIndex(index);
              }}
              tabIndex={0}
              role="button"
              aria-pressed="false"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  const index = badges.findIndex((b) => b.id === relatedBadge.id);
                  if (index !== -1) setCurrentBadgeIndex(index);
                }
              }}
            >
              <img
                crossOrigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${relatedBadge?.id}` || relatedBadge.image?.data}
                alt={relatedBadge.name}
                className="rounded-lg shadow-md w-16 h-16 md:w-20 md:h-20 object-cover"
              />
              <span className="text-sm font-medium text-center text-white truncate w-full">
                {relatedBadge.name}
              </span>
            </div>
          </div>
        ))}
    </div>
  </div>
);

  // Badge Image Component with Navigation
  const BadgeImage = () => (
    <div className="flex flex-col items-center mt-2">
      <div className="relative flex items-center justify-center w-full max-w-md px-4 sm:px-8 md:px-12">
        {/* Left Chevron */}
        <button
          aria-label="Previous Badge"
          onClick={() =>
            setCurrentBadgeIndex((prev) => (prev === 0 ? badges.length - 1 : prev - 1))
          }
          className="absolute left-2 sm:-left-1 md:-left-3 lg:-left-4 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Badge Image */}
        <div className="w-50 h-50 rounded-full z-0 shadow-lg flex items-center justify-center relative overflow-hidden">
          {!isLoading ? (
            <>
            <div className='relative'>
              {/* Glint overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10 w-full h-full">
              <div className="glint glintcenter" />
            </div>
              <img
                ref={badgeImgRef}
                crossOrigin="anonymous"
                src={badgeImgUrl}
                alt={currentBadge?.name}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-2 left-0 right-0 text-center text-white text-sm font-medium">
                {currentBadgeIndex + 1} of {badges.length}
              </div>
              </div>
            </>
          ) : (
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-300 h-16 w-16 animate-spin"></div>
          )}
        </div>

        {/* Right Chevron */}
        <button
          aria-label="Next Badge"
          onClick={() =>
            setCurrentBadgeIndex((prev) => (prev === badges.length - 1 ? 0 : prev + 1))
          }
          className="absolute right-2 sm:-right-1 md:-right-3 lg:-right-4 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      <h1 className="text-3xl font-bold text-center mt-2">{currentBadge?.name}</h1>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col text-white relative">
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

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <AllBadgeMyBadgeFilter/>
        {/* Main content with responsive layout */}
        <main className="flex-grow" key={badgeId}>
          {/* Desktop Layout */}
          <div
            className="hidden lg:flex flex-row max-w-7xl min-h-[calc(100vh-250px)] mx-auto p-6 gap-6 
                      print:flex print:flex-row print:gap-6 print:max-w-none print-container print-scale-fit print:w-full print:items-start print:justify-between"
          >
            <section className="md:w-2/6 print:w-[33.3%] my-auto space-y-6 z-10">
              <BadgeDescription />
              <RelatedBadges />
            </section>
            &nbsp;
            &nbsp;

            <section className="md:w-2/6 print:w-[33.3%] flex flex-col items-center z-10">
              <div>
                {/* Top earned badge pill */}
                {earnedBadge && (
                  <div className="z-30">
                    <div
                      className="
                        bg-green-700 bg-opacity-30
                        text-green-100
                        rounded-full
                        px-4 py-1.5
                        shadow-sm
                        flex items-center space-x-2
                        font-semibold
                        select-none
                        md:px-5 md:py-2
                      "
                      style={{ backdropFilter: "blur(6px)" }} // subtle blur for glassy feel
                    >
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-green-300" />
                      <span className="text-sm md:text-base whitespace-nowrap">
                        <span className="block md:hidden">
                          {earnedBadge.earnedDate
                            ? new Date(earnedBadge.earnedDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              }) // → 05/11/23
                            : "Earned"}
                        </span>
                        <span className="hidden md:block">
                          {earnedBadge.earnedDate
                            ? `You earned this badge on ${new Date(earnedBadge.earnedDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}` // → You earned this badge on 5 November 2023
                            : "You have earned this badge"}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <BadgeImage />
              <BadgeMetrics />
            </section>
            &nbsp;
            &nbsp;

            <section className="md:w-2/6 print:w-[33.3%] my-auto space-y-6 z-10">
              <SkillsEarned />
              <h2 className="text-2xl font-semibold border-b border-cyan-500 pb-2">Badge Actions</h2>
              <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} outerEarnedBadge={earnedBadge} />
            </section>
          </div>

          {/* Tablet Layout */}
          <section className="hidden md:flex lg:hidden p-2 flex-col print:hidden w-full mx-auto gap-6 text-white z-10">
            <div className="flex w-full gap-6">
              {/* Badge and Badge Actions */}
              <div className="flex flex-col items-center w-1/2 space-y-4">
              <div className='my-2'>
                {/* Top earned badge pill */}
                {earnedBadge && (
                  <div className="z-50">
                    <div
                      className="
                        bg-green-700 bg-opacity-30
                        text-green-100
                        rounded-full
                        px-4 py-1.5
                        shadow-sm
                        flex items-center space-x-2
                        font-semibold
                        select-none
                        md:px-5 md:py-2
                      "
                      style={{ backdropFilter: "blur(6px)" }} // subtle blur for glassy feel
                    >
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-green-300" />
                      <span className="text-sm md:text-base whitespace-nowrap">
                        <span className="block md:hidden">
                          {earnedBadge.earnedDate
                            ? new Date(earnedBadge.earnedDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              }) // → 05/11/23
                            : "Earned"}
                        </span>
                        <span className="hidden md:block">
                          {earnedBadge.earnedDate
                            ? `You earned this badge on ${new Date(earnedBadge.earnedDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}` // → You earned this badge on 5 November 2023
                            : "You have earned this badge"}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
                <BadgeImage />
                <div className="flex flex-wrap justify-center gap-2 z-10">
                  <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} outerEarnedBadge={earnedBadge} />
                </div>
                <BadgeMetrics />
                <RelatedBadges />
              </div>
              &nbsp;
              &nbsp;

              {/* Description */}
              <section className="w-1/2 mr-4 space-y-2 z-10">
                <BadgeDescription />
                <SkillsEarned />
              </section>
            </div>
          </section>

          {/* Mobile Layout */}
          <div className="flex sm:hidden flex-col max-w-sm mx-auto print:hidden p-4 gap-4 z-10">
            {/* Badge Image */}
            <section className="flex flex-col items-center">
              <div className='my-2'>
                {/* Top earned badge pill */}
                {earnedBadge && (
                  <div className="z-50">
                    <div
                      className="
                        bg-green-700 bg-opacity-30
                        text-green-100
                        rounded-full
                        px-4 py-1.5
                        shadow-sm
                        flex items-center space-x-2
                        font-semibold
                        select-none
                        md:px-5 md:py-2
                      "
                      style={{ backdropFilter: "blur(6px)" }} // subtle blur for glassy feel
                    >
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-green-300" />
                      <span className="text-sm md:text-base whitespace-nowrap">
                        <span className="block md:hidden">
                          {earnedBadge.earnedDate
                            ? new Date(earnedBadge.earnedDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              }) // → 05/11/23
                            : "Earned"}
                        </span>
                        <span className="hidden md:block">
                          {earnedBadge.earnedDate
                            ? `You earned this badge on ${new Date(earnedBadge.earnedDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}` // → You earned this badge on 5 November 2023
                            : "You have earned this badge"}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <BadgeImage />

              {/* <div className="text-center text-sm text-gray-400 mt-2">
                {currentBadgeIndex + 1} of {badges.length} badges
              </div> */}
              
            </section>
            {/* Badge Actions */}
            <section className="space-y-4">
              <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} outerEarnedBadge={earnedBadge} />
            </section>
          &nbsp;
          &nbsp;

            {/* Badge Metrics */}
            <section>
              <BadgeMetrics />
            </section>
          &nbsp;
          &nbsp;

            {/* Badge Description */}
            <section>
              <BadgeDescription />
            </section>
          &nbsp;
          &nbsp;

            {/* Skills Earned */}
            <section>
              <SkillsEarned />
            </section>
          &nbsp;
          &nbsp;

            {/* Related Badges */}
            <section>
              <RelatedBadges />
            </section>
          </div>
        </main>

        {/* Desktop Badge Collection Thumbnails print:block print:flex-col print:items-center print:justify-center */}
        <div className="hidden md:flex z-10 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-cyan-400/5 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] p-2 mt-4 mx-auto w-max">
          
          {/* Scrollable badge row with chevrons */}
          <div className="flex items-center gap-2">
            
            {/* Left Chevron */}
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full hover:bg-gray-600 transition text-white"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable container (max width for 5 badges) */}
            <div
              ref={scrollRef}
              className="overflow-x-hidden overflow-y-hidden scrollbar-hide max-w-[275px]"
            >
              <div className="flex space-x-2 w-max">
                {badges.map((badge, index) => (
                  <img
                    key={badge.id}
                    crossOrigin="anonymous"
                    src={
                      badge.image?.data || `${process.env.SERVER_URL}/badge/images/${badge?.id}`
                    }
                    alt={badge.name}
                    className={`w-12 h-12 object-cover rounded-md cursor-pointer shadow-md transition-transform ${
                      index === currentBadgeIndex
                        ? 'border-2 border-cyan-500 scale-100'
                        : 'opacity-70'
                    }`}
                    onClick={() => setCurrentBadgeIndex(index)}
                  />
                ))}
              </div>
            </div>

            {/* Right Chevron */}
            <button
              onClick={scrollRight}
              className="p-2 rounded-full hover:bg-gray-600 transition text-white"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-gray-300 mt-1 text-center text-xs">
            {badges.length} Badges — Showing {currentBadgeIndex + 1} of {badges.length}
          </div>
        </div>

        {/* Mobile Badge Collection Thumbnails */}
        <div className="block md:hidden z-10 rounded-2xl print:hidden bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] p-2 flex flex-col items-center justify-between mt-4 w-full mx-auto">
          <div className="w-full relative">
            <button
              aria-label="Previous Badge"
              onClick={() => {
                const container = document.getElementById("mobileBadgeScroll");
                container.scrollBy({ left: -300, behavior: "smooth" });
              }}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable & draggable container */}
            <div
              id="mobileBadgeScroll"
              className={`flex space-x-2 overflow-x-auto px-6 scroll-smooth cursor-grab active:cursor-grabbing ${
                          badges.length < 5 ? 'justify-center' : ''
                        }`}
              style={{ WebkitOverflowScrolling: "touch" }}
              onMouseDown={(e) => {
                const container = e.currentTarget;
                let startX = e.pageX - container.offsetLeft;
                let scrollLeft = container.scrollLeft;

                const onMouseMove = (eMove) => {
                  const x = eMove.pageX - container.offsetLeft;
                  const walk = (x - startX) * 1.5;
                  container.scrollLeft = scrollLeft - walk;
                };

                const onMouseUp = () => {
                  window.removeEventListener("mousemove", onMouseMove);
                  window.removeEventListener("mouseup", onMouseUp);
                };

                window.addEventListener("mousemove", onMouseMove);
                window.addEventListener("mouseup", onMouseUp);
              }}
              onTouchStart={(e) => {
                const container = e.currentTarget;
                const touchStartX = e.touches[0].pageX;
                const scrollStart = container.scrollLeft;

                const onTouchMove = (eMove) => {
                  const touchX = eMove.touches[0].pageX;
                  const walk = (touchX - touchStartX) * 1.5;
                  container.scrollLeft = scrollStart - walk;
                };

                const onTouchEnd = () => {
                  container.removeEventListener("touchmove", onTouchMove);
                  container.removeEventListener("touchend", onTouchEnd);
                };

                container.addEventListener("touchmove", onTouchMove);
                container.addEventListener("touchend", onTouchEnd);
              }}
            >
              {badges.map((badge, index) => (
                <img
                  key={badge.id}
                  crossOrigin="anonymous"
                  src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge.image?.data}
                  alt={badge.name}
                  className={`w-12 h-12 object-cover rounded-md cursor-pointer shadow-md transition-transform ${
                    index === currentBadgeIndex
                      ? "border-2 border-cyan-500 scale-100"
                      : "opacity-70"
                  }`}
                  onClick={() => setCurrentBadgeIndex(index)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setCurrentBadgeIndex(index);
                    }
                  }}
                />
              ))}
            </div>
            <button
              aria-label="Next Badge"
              onClick={() => {
                const container = document.getElementById("mobileBadgeScroll");
                container.scrollBy({ left: 300, behavior: "smooth" });
              }}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-gray-300 mt-1 text-xs">
            {badges.length} Badges — Showing {currentBadgeIndex + 1} of {badges.length}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default BadgeId;
