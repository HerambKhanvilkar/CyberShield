"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import React, { useEffect, useRef, useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import SplineScene from "@/components/SplineScene";
import SplineScene2 from "@/components/SplineScene2";
import Count from "@/components/count";

export default function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectBadge = (i) => setActiveIndex(i);
  const truncateText = (text, maxLength) => {
  if (text === null || text === undefined) {
    return '';
  }
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`${process.env.SERVER_URL}/badges`);
        const data = await res.json();

        if (Array.isArray(data.badges)) {
          setBadges(data.badges);
        } else {
          console.error("API response format unexpected:", data);
          setBadges([]);
        }
      } catch (error) {
        console.error("Failed to fetch badges:", error);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();

    const interval = setInterval(() => {
      setActiveIndex((prev) =>
        badges.length ? (prev + 1) % badges.length : 0
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [badges.length]);

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-[#00040A] text-white font-sans">
        {/* Interactive Background */}
        <div className="hidden md:block absolute inset-0 z-0 pointer-events-auto">
          <SplineScene />
        </div>
        <div className="block md:hidden absolute inset-0 z-0 pointer-events-auto">
          <SplineScene2 />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 mx-auto pointer-events-none">
          {/* Hero Section */}
          <section className="min-h-[calc(100vh-70px)] mr-auto flex items-center justify-center text-center px-5 py-12 relative">
            <div
              className="max-w-[800px] mt-100 md:mt-0 mr-auto animate-fadeIn pointer-events-auto
                        md:bg-transparent md:backdrop-blur-none md:border-none
                        bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4"
            >
              <img
                src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                alt="Logo"
                className="hidden md:block max-w-[200px] mb-5 drop-shadow-[0_0_20px_rgba(0,212,255,0.5)] mx-auto"
              />
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-5">
                Cybersecurity Badges
              </h1>
              <p className="text-lg sm:text-xl max-w-[600px] mx-auto mb-10 text-text-medium">
                Earn and showcase badges for your cybersecurity skills and achievements.
              </p>
              <div className="flex justify-center gap-5 flex-wrap pointer-events-auto">
                <button className="px-7 py-3 text-base sm:text-lg border border-cyan-400 bg-gradient-to-br from-cyan-300/20 to-cyan-400/20 hover:from-cyan-300/40 hover:to-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] transition rounded">
                  Get Started
                </button>
                <button
                  onClick={() => window.open("https://learn.deepcytes.io/", "_blank")}
                  className="px-7 py-3 text-base sm:text-lg border border-white/20 bg-white/10 hover:bg-white/20 transition rounded"
                >
                  Learn More
                </button>
              </div>
            </div>
          </section>


          {/* Featured Badge */}
          {!loading && badges.length > 0 && (
            <section className="py-20 z-50 bg-[#00040A] pointer-events-auto">
              <h2 className="text-3xl sm:text-4xl mb-10 text-center">Featured Badge</h2>
              <div className="flex w-5/6 mx-auto items-center gap-10 flex-wrap md:flex-nowrap text-text-light">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl mb-5 font-semibold">
                    {badges[activeIndex].name}
                  </h3>
                  <p className="text-text-medium text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
                    {truncateText(badges[activeIndex].description,200)}
                  </p>
                  <div className="flex gap-8 flex-wrap justify-center md:justify-start">
                    <div className="bg-white/5 rounded-lg p-4 text-center flex-1 min-w-[150px]">
                      {/* <p className="text-xl font-bold text-cyan-400 mb-1">150+</p> */}
                      <Count endValue={12345} format='number' direction="up" />
                      <p className="text-sm text-text-medium">Holders</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center flex-1 min-w-[150px]">
                      {/* <p className="text-xl font-bold text-cyan-400 mb-1">2024</p> */}
                      <Count endValue={2024} format='year' direction="up" />
                      <p className="text-sm text-text-medium">Year Launched</p>
                    </div>
                  </div>
                </div>
                <div className="w-[250px] h-[250px] rounded-full bg-gradient-radial from-cyan-400/10 to-transparent flex items-center justify-center mx-auto md:mx-0">
                  <img
                    crossOrigin="anonymous"
                    src={`${process.env.SERVER_URL}/badge/images/${badges[activeIndex].id}` || badges[activeIndex].img?.data}
                    alt={badges[activeIndex].title}
                    className="max-w-[80%] max-h-[80%] object-contain drop-shadow-md animate-float"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Badge Carousel */}
          {!loading && badges.length > 0 && (
            <section className="pointer-events-auto z-50 bg-[#00040A] py-20 bg-gradient-to-t from-primary-dark to-transparent">
              <h2 className="text-3xl sm:text-4xl mb-10 text-center">All Badges</h2>
              <div className="overflow-y-hidden scrollbar w-5/6 mx-auto overflow-x-auto no-scrollbar px-5">
                <div
                  className="flex gap-6 justify-start scroll-smooth snap-x snap-mandatory"
                  ref={carouselRef}
                >
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
          )}

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