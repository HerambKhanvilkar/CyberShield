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
      <Navbar />
      <main className="min-h-screen bg-black/50 from-black/50 to-cyan-500/30 backdrop-blur-md text-white px-4 py-12">
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

              const baseClass = 'h-full flex flex-col bg-gradient-to-br from-gray-950 via-cyan-900/30 to-gray-900 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 transition duration-300 hover:shadow-cyan-400/20 hover:scale-[1.01]';
              const glassyUnownedClass = 'h-full flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition duration-300 hover:shadow-lg hover:scale-[1.01] filter grayscale contrast-75 opacity-70';
              const cardClass = loggedIn ? (owned ? baseClass : glassyUnownedClass) : baseClass;

              return (
              <Link href={`/badges/${badge.id}`} key={badge.id}>
                <div className={cardClass}>
                  <div className="flex justify-center mb-4">
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
