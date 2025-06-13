"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import React, { useEffect, useRef, useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import SplineScene from "@/components/SplineScene";
import SplineScene2 from "@/components/SplineScene2";
import Count from "@/components/count";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null); // renamed for clarity

  const selectBadge = (i) => setActiveIndex(i);

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 🔧 SCROLL FUNCTIONS should be HERE:
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`${process.env.SERVER_URL}/badges`);
        const data = await res.json();
        setBadges(Array.isArray(data.badges) ? data.badges : []);
      } catch (error) {
        console.error("Failed to fetch badges:", error);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();

    const interval = setInterval(() => {
      setActiveIndex((prev) => (badges.length ? (prev + 1) % badges.length : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, [badges.length]);

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-[#00040A] text-white font-sans">
        {/* Foreground Content */}
        <div className="relative z-10 mx-auto pointer-events-none">
          {/* Hero Section */}
          <section className="relative min-h-[calc(100vh-70px)] px-5 py-12 bg-black">
            {/* Mobile image block only */}
            <div className="block md:hidden relative w-full h-[250px]">
              <img
                src="/cyber-security-concept-digital-art.jpg"
                alt="Cyber Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/50 to-black" />
            </div>

            {/* Content block */}
            <div className="relative z-10 max-w-7xl mt-0 md:mt-30 mx-auto flex flex-col md:flex-row items-center justify-start">
              <div className="flex-1 text-white text-left mt-5 md:mt-0 px-4">
                <img
                  src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                  alt="Logo"
                  className="max-w-[200px] hidden md:block mb-5 drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]"
                />
                <h1 className="text-4xl md:text-5xl font-extrabold mb-5">
                  Cybersecurity Badges
                </h1>
                <p className="text-lg md:text-xl mb-10 text-white/80 max-w-lg">
                  Earn and showcase badges for your cybersecurity skills and achievements.
                </p>
                <div className="flex flex-wrap gap-5">
                  <button className="px-7 py-3 border border-cyan-400 bg-gradient-to-br from-cyan-300/20 to-cyan-400/20 hover:from-cyan-300/40 hover:to-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] transition rounded">
                    Get Started
                  </button>
                  <button
                    onClick={() => window.open("https://learn.deepcytes.io/", "_blank")}
                    className="px-7 py-3 border border-white/20 bg-white/10 hover:bg-white/20 transition rounded"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop-only background image gradient */}
            <div
              className="hidden md:block absolute inset-0 bg-no-repeat bg-right bg-contain pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgb(0,0,0) 35%, rgb(0,0,0) 35%, rgba(0,1,30,0.33) 55%, rgba(0,1,30,0) 90%), url("/cyber-security-concept-digital-art.jpg")',
                backgroundSize: 'contain',
                backgroundPosition: 'right center',
                backgroundRepeat: 'no-repeat',
                zIndex: 0,
              }}
            />
          </section>

          {/* Featured Badge */}
          <section className="py-2 z-50 bg-[#00040A] pointer-events-auto">
            <h2 className="text-3xl sm:text-4xl mb-2 md:mb-10 text-center text-cyan-500">Featured Badges</h2>
            
            {/* Use column-reverse on mobile, row on md+ */}
            <div className="flex flex-col-reverse md:flex-row w-5/6 mx-auto items-center gap-0 md:gap-2 text-text-light">
              {/* Text content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl mb-0 md:mb-5 font-semibold">
                  {badges[activeIndex]?.name}
                </h3>
                {/* desktop description */}
                <p className="hidden md:block text-text-medium text-base sm:text-lg leading-relaxed text-left mb-0 md:mb-8 max-w-lg mx-auto md:mx-0">
                  {truncateText(badges[activeIndex]?.description, 250)}
                </p>
                {/* mobile description */}
                <p className="block md:hidden text-text-medium text-base sm:text-lg leading-relaxed text-left mb-0 md:mb-8 max-w-lg mx-auto md:mx-0">
                  {truncateText(badges[activeIndex]?.description, 150)}
                </p>
                
                {/* Stats */}
                <div className="flex gap-4 justify-center md:justify-start flex-nowrap">
                  <div className="bg-white/5 rounded-lg p-4 text-center w-[140px] md:flex-1 md:min-w-[150px]">
                    <Count endValue={12345} format="number" direction="up" />
                    <p className="text-sm text-text-medium">Holders</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center w-[140px] md:flex-1 md:min-w-[150px]">
                    <Count endValue={2024} format="year" direction="up" />
                    <p className="text-sm text-text-medium">Year Launched</p>
                  </div>
                </div>
              </div>

              {/* Image wrapper - shows on top in mobile view due to flex-col-reverse */}
              <div className="w-[250px] h-[250px] rounded-full bg-gradient-radial from-cyan-400/10 to-transparent flex items-center justify-center mx-auto md:mx-0">
                <img
                  crossOrigin="anonymous"
                  src={`${process.env.SERVER_URL}/badge/images/${badges[activeIndex]?.id}` || badges[activeIndex].img?.data}
                  alt={badges[activeIndex]?.title}
                  className="max-w-[80%] max-h-[80%] object-contain drop-shadow-md animate-float"
                />
              </div>
            </div>
          </section>

          {/* Badge Carousel */}
          <section className="relative scrollbar pointer-events-auto z-50 bg-[#00040A] py-20 bg-gradient-to-t from-primary-dark to-transparent">
          {/* Chevron Left */}
          <button
            aria-label="Scroll Left"
            onClick={scrollLeft}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-gray-800 hover:bg-gray-700 p-2 rounded-full shadow-md"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Chevron Right */}
          <button
            aria-label="Scroll Right"
            onClick={scrollRight}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-gray-800 hover:bg-gray-700 p-2 rounded-full shadow-md"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Scrollable Badges */}
          <div
            ref={carouselRef}
            className="w-5/6 mx-auto px-5 overflow-x-scroll scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
            style={{
              WebkitOverflowScrolling: "touch",
              overflowY: "hidden",
              scrollSnapType: "x mandatory",
            }}
          >
            <div className="flex gap-6 justify-start snap-x snap-mandatory">
              {badges.map((badge, i) => (
                <div
                  key={badge.id}
                  onClick={() => selectBadge(i)}
                  className={`w-24 h-24 flex-shrink-0 snap-center cursor-pointer rounded-lg flex items-center justify-center transition transform ${
                    i === activeIndex
                      ? "bg-cyan-400/20 shadow-lg scale-110"
                      : "bg-white/5 hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  <img
                    crossOrigin="anonymous"
                    src={`${process.env.SERVER_URL}/badge/images/${badge.id}` || badge.image || badge.img?.data}
                    alt={badge.title}
                    className="max-w-[80%] max-h-[80%] object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
          {/* Why Earn Badges */}
          <section className="pointer-events-auto py-20 z-50 bg-[#00040A]">
            <h2 className="text-3xl sm:text-4xl text-center text-white mb-10">
              Why Earn Badges?
            </h2>
            <div className="grid grid-cols-1 w-5/6 mx-auto sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { emoji: "🏆", title: "Showcase Skills", text: "Display your verified cybersecurity skills and knowledge to employers and peers." },
                { emoji: "🚀", title: "Career Growth", text: "Advance your career by earning increasingly advanced badges in your field." },
                { emoji: "🔍", title: "Validate Expertise", text: "Prove your capabilities through practical challenges and assessments." },
                { emoji: "🌐", title: "Join Community", text: "Connect with other cybersecurity professionals in a growing community." },
              ].map((item, index) => (
                <div key={index} className="p-8 flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl bg-white/5 rounded-lg">
                  <div className="text-5xl mb-5 bg-gradient-to-br from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    {item.emoji}
                  </div>
                  <h3 className="text-lg sm:text-xl text-white mb-3 font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
