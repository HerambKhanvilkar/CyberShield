"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";

export default function AllBadgesPage() {
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [badges, setBadges] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchAllBadges = async () => {
    try {
      const res = await fetch(`${process.env.SERVER_URL}/badges`);
      const data = await res.json();

      if (Array.isArray(data.badges)) {
        setAllBadges(data.badges);
        setBadges(data.badges);
      } else {
        console.error("API response format unexpected:", data);
        setAllBadges([]); // fallback to empty array
      }
    } catch (error) {
      console.error("Failed to fetch badges:", error);
      setAllBadges([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.SERVER_URL}/badges-earned`, {
        method: 'GET', // Specify the method if needed (GET is default)
        headers: {
          'Authorization': `Bearer ${token}`, // Add the token to the Authorization header
          'Content-Type': 'application/json' // Optional: specify content type if needed
        }
      });

      const data = await res.json();

      if (Array.isArray(data.badges)) {
        setMyBadges(data.badges);
      } else {
        console.error("API response format unexpected:", data);
        setMyBadges([]); // fallback to empty array
      }
    } catch (error) {
      console.error("Failed to fetch badges:", error);
      setMyBadges([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  fetchAllBadges();
  fetchMyBadges();
}, []);

  const activeButton = "px-5 py-1.5 text-xs font-medium text-gray-900 bg-gray-300 rounded-lg";
  const inActiveButton = "px-5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 rounded-lg";

  const [allBadgesClass, setAllBadgesClass] = useState(activeButton);
  const [myBadgesClass, setMyBadgesClass] = useState(inActiveButton);

  const handleAllBadges = () => {
    setBadges(allBadges);
    setAllBadgesClass(activeButton);
    setMyBadgesClass(inActiveButton);
  }

  const handleMyBadges = () => {
    setBadges(myBadges);
    setMyBadgesClass(activeButton);
    setAllBadgesClass(inActiveButton);
  }


  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-br from-[#00011E] to-[#000022] min-h-screen text-white px-4 py-12">
        <section className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Cybersecurity <span className="text-cyan-400">Badges</span>
          </h1>
          <p className="text-lg text-gray-300">
            Complete challenges and earn badges to showcase your cybersecurity skills
          </p>
        </section>
        <section className="text-center max-w-4xl mx-auto mb-12">
        </section>
        <div className="grid max-w-xs grid-cols-2 gap-1 p-1 mx-auto my-4 rounded-lg bg-gray-600" role="group">
          <button onClick={handleAllBadges} type="button" className={allBadgesClass} >
          All Badges
          </button>
              <button onClick={handleMyBadges} type="button" className={myBadgesClass}>
              My Badges
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading badges...</p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {badges.map((badge) => (
              <Link href={`/badges/${badge.id}`} key={badge.id}>
                <div className="bg-[#0A0E2A] rounded-xl p-6 shadow-lg border border-white/5 hover:shadow-cyan-500/20 transition duration-300">
                  <div className="flex justify-center mb-4">
                    <img
                      src={badge.image || badge.img?.data}
                      alt={badge.name}
                      className="w-24 h-24 object-contain drop-shadow-xl"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-cyan-400 mb-2 text-center">
                    {badge.name}
                  </h3>
                  <p className="text-gray-400 text-sm text-center mb-4">
                    {badge.description}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {badge.skillsEarned?.map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-400/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}

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
