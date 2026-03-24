'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import React, { useState, useEffect, useRef } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import { useRouter } from 'next/navigation';
import UsersPagination from '@/components/UsersPagination';
import UserBlock from '@/components/UserBlock';
import SearchBox from '@/components/SearchBox';
import { users } from '@/lib/data';
import Link from "next/link";
import axios from 'axios';
import { toast } from 'react-toastify';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import UserDetailsView from '@/components/UserDetailsView';
import BadgeCreationForm from '@/components/BadgeCreationForm';
import ErrorTable from '@/components/badgeAdminComponents/CsvDataTable';
import ImportPage from '@/components/ImportData/ImportPage';
import {UserPlus} from 'lucide-react';

const TABS = ['Users', 'Import', 'Badges'];
const ITEMS_PER_PAGE = 10;

export default function SettingsPage() {
  const [searchResults, setSearchResults] = useState([]); // Initialize as an empty array
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Users');
  const [usersData, setUsersData] = useState(users);
  const accentColor = "#04d9ff"; // Neon blue


  // Page status
  const [currentPage, setCurrentPage] = useState(1);
  //Page specific values
  const totalPages = Math.ceil(100 / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const [userInfo, setUserInfo] = useState(null);
  const currentUsers = users;
  // const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNewUser = async (email, firstName, lastName, password) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("No auth token found.");
        return;
      }

      const response = await axios.post(
        `${process.env.SERVER_URL}/user/create`,
        {
          email,
          firstName,
          lastName,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("User created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(
        error.response?.data?.message || "Failed to create user. Please try again."
      );
      return null;
    }
  };
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const handleOpenModal = () => setShowCreateUserModal(true);
  const handleCloseModal = () => {
    setShowCreateUserModal(false);
    setNewUserData({ email: '', firstName: '', lastName: '', password: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, firstName, lastName, password } = newUserData;
    if (!email || !firstName || !lastName || !password) {
      toast.error("Please fill all fields.");
      return;
    }

    const result = await handleNewUser(email, firstName, lastName, password);
    if (result) {
      handleCloseModal();
      // Optionally refresh user list or add the new user to state
    }
  };

  const handleSearch = (data) => {
    // Ensure data is an array before setting it
    setSearchResults(Array.isArray(data)  ? data : []);
  };

const handleSelectUser = async (user) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return toast.error("No token found!");

    const badgesRes = await axios.get(`${process.env.SERVER_URL}/badges`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const allBadges = badgesRes.data.badges;
    const badgeMap = {};
    allBadges.forEach((badge) => {
      badgeMap[badge.id] = badge;
    });

    const enrichedUser = {
      ...user,
      badges: (user.badges || []).map((b) => ({
        ...badgeMap[b.badgeId],
        badgeId: b.badgeId,
        earnedDate: b.earnedDate,
      })),
    };

    setSelectedUser(enrichedUser);
    console.log("updateUser", enrichedUser);
  } catch (err) {
    console.error("Error enriching user badges:", err);
    toast.error("Failed to enrich badge details");
  }
}

const updateUserDetails = async (email) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return toast.error("No token found!");
    const response = await axios.get(`${process.env.SERVER_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { "email": email }
    });

    const updatedUser = response.data;

  setSearchResults(prev =>
    prev.map(user => (user.email === email ? updatedUser[0] : user))
  );
    console.log("updateUser", updatedUser[0]);
    handleSelectUser(updatedUser[0]);

  } catch (err) {
    console.error("Error enriching user badges:", err);
    toast.error("Failed to enrich badge details");
  }
};

// ============================================
  // LIGHT RAYS COMPONENT
  // ============================================
  // DEFAULT_COLOR will be replaced by palette color
  const DEFAULT_COLOR = '#04d9ff'; // Neon blue
  
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


  const renderTabContent = () => {
    switch (activeTab) {
      case 'Users':
        return (
          
          <div className="p-2 md:p-4 rounded-xl backdrop-blur-md shadow-lg border border-white/10">
            {/* Top Row: Search + Pagination */}
            <div className="flex flex-row justify-between items-start mb-2 gap-4">
              <div className="flex gap-4">
                <SearchBox onSearch={handleSearch} className="h-10" />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors h-10 flex items-center justify-center"
                  onClick={() => setSelectedUser('new')}
                >
                  <UserPlus />
                </button>
              </div>
            </div>

            {/* Main Content: Left = User List | Right = User Details */}
            <div className="flex flex-col md:flex-row backdrop-blur-md gap-4 h-full md:h-[calc(100vh-200px)]">
              {/* Left: User List */}
              <div className="w-full md:w-1/3 bg-white/20 backdrop-blur-md rounded-lg p-2 border border-white/10 shadow-md flex flex-col h-full">
                <h2 className="text-white font-semibold mb-2">User List</h2>
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full overflow-y-auto scrollbar pr-2">
                    <div className="flex flex-col space-y-2 w-full">
                      {Array.isArray(searchResults) && searchResults.length > 0 ? (
                        searchResults.map((user, index) => (
                          <UserBlock
                            key={index}
                            className="w-full"
                            data={user}
                            updateUserDetails={updateUserDetails}
                            handleSelectUser={handleSelectUser}
                            onSelect={() => handleSelectUser(user)}
                          />
                        ))
                      ) : (
                        <p className="text-gray-400">No data available.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Right: User Details */}
              <div className="w-full md:w-2/3 bg-white/20 backdrop-blur-md rounded-lg p-2 md:p-4 border border-white/10 shadow-md overflow-y-auto scrollbar">
                <UserDetailsView 
                  selectedUser={selectedUser} 
                  updateUserDetails={updateUserDetails} 
                />
              </div>
            </div>
          </div>
        );
      case 'Badges':
        return (
          <BadgeCreationForm />
        );
      case 'Import':
        return (
          <ImportPage />
        );
      default:
        return null;
    }
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
      <div className='z-100 relative'>
        <div className="min-h-full  p-0 md:p-3 pb-0 pt-0">
          <div className="mb-0 border-b border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            {TABS.map((tab, index) => (
              <li key={index} className="me-2 inline-block px-2 md:px-4 rounded-lg">
              <button
                key={tab}
              className={`inline-block p-2 md:px-4 rounded-t-lg ${
                  activeTab === tab
                    ? 'text-[#B9D9EB] border-b-2 border-[#B9D9EB]'
                    : 'text-gray-400 hover:border-gray-300 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
              </li>
            ))}
            </ul>
          </div>
        </div>
        <div>{renderTabContent()}</div>
      </div>
        {/* User creation Modal Popup */}
        {showCreateUserModal && (
          <>
            {/* Backdrop with blur */}
            <div className="fixed inset-0 z-50 bg-opacity-40 backdrop-blur-md"></div>

            {/* Modal box */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <h2 className="text-white text-xl font-semibold mb-4">Create New User</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={newUserData.email}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />
                  <input
                    name="firstName"
                    type="text"
                    placeholder="First Name"
                    value={newUserData.firstName}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />
                  <input
                    name="lastName"
                    type="text"
                    placeholder="Last Name"
                    value={newUserData.lastName}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={newUserData.password}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />

                  <div className="flex justify-end gap-4 mt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

      <Footer />
    </>
  );
}

