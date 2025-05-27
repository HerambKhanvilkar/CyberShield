"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("No token found!");

        const response = await axios.get(`${process.env.SERVER_URL}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = response.data;

        // Fetch all badges
        const badgesRes = await axios.get(`${process.env.SERVER_URL}/badges`);
        const allBadges = badgesRes.data.badges;

        // Create badgeMap by id (not badgeId)
        const badgeMap = {};
        allBadges.forEach((badge) => {
          badgeMap[badge.id] = badge;
        });

        // Enrich user badges
        const enrichedBadges = (user.badges || []).map((b) => ({
          ...badgeMap[b.badgeId],
          badgeId: b.badgeId,
          earnedDate: b.earnedDate,
        }));

        setUserData({ ...user, badges: enrichedBadges });

        // Set default selected badge to latest (first in list)
        if (enrichedBadges.length > 0) {
          setSelectedBadgeId(enrichedBadges[0].badgeId);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast.error("Failed to load user data");
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading || !userData) {
    return (
      <main className="bg-[#00011E] text-white min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </main>
    );
  }

  const selectedBadge = userData.badges.find(
    (badge) => badge.badgeId === selectedBadgeId
  );

  // Check if selected badge is the latest (first in userData.badges)
  const isLatestBadge = userData.badges.length > 0 && selectedBadgeId === userData.badges[0].badgeId;

  return (
    <>
      <Navbar />
      <main className="bg-[#00011E] text-white min-h-screen px-4 py-6 md:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1 bg-[#0C0E3C] p-4 rounded-2xl text-center shadow-lg">
            <div className="border-4 border-purple-500 rounded-full w-28 h-28 mx-auto overflow-hidden mb-4">
              <img
                src="/images/user.png"
                alt="User"
                className="object-cover w-full h-full"
              />
            </div>
            <h2 className="text-lg font-bold">
              {userData.firstName} {userData.lastName}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{userData.email}</p>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                My Badges
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {userData.badges?.length > 0 ? (
                  userData.badges.map((badge, i) => (
                    <img
                      key={i}
                      src={`./images/img${badge.badgeId}.png`}
                      alt={badge.badgeId}
                      className={`w-12 h-12 rounded-full border-2 cursor-pointer ${
                        selectedBadgeId === badge.badgeId
                          ? "border-purple-500"
                          : "border-transparent"
                      }`}
                      onClick={() => setSelectedBadgeId(badge.badgeId)}
                      title={badge.name}
                    />
                  ))
                ) : (
                  <p className="text-gray-400 text-xs col-span-full">No badges</p>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="md:col-span-4 grid gap-6">
            {/* Achievements */}
            <div className="bg-[#0C0E3C] p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">Achievements</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-gray-300">
                <li>Completed 6 courses in Red Teaming, OSINT & Forensics</li>
                <li>Completed Red Teaming Career Path</li>
                <li>Completed Cyber Titan Workshops (Level 1 & 2)</li>
                <li>6 months fellowship as Red Teamer at Deepcytes</li>
              </ul>
            </div>

            {/* Badge Details */}
            {selectedBadge && (
              <div className="bg-[#0C0E3C] p-6 rounded-2xl shadow-md">
                <h3 className="text-xl font-semibold mb-4">
                  {isLatestBadge ? "Latest Badge" : "Badge Details"}
                </h3>
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <img
                    src={`/images/img${selectedBadge.badgeId}.png`}
                    alt={`Badge ${selectedBadge.badgeId}`}
                    className="w-24 h-24 mx-auto md:mx-0"
                  />

                  <div className="md:col-span-2 text-sm text-gray-300 space-y-2">
                    <p>
                      <span className="text-white font-semibold">Name:</span>{" "}
                      {selectedBadge.name}
                    </p>
                    <p>
                      <span className="text-white font-semibold">Description:</span>{" "}
                      {selectedBadge.description}
                    </p>
                    <div className="flex gap-6 mt-2">
                      <div>
                        <p className="text-white font-semibold">Earned</p>
                        <p>{new Date(selectedBadge.earnedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Level</p>
                        <p>{selectedBadge.level}</p>
                      </div>
                      {/* If you have "earners" data, add it here */}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Courses */}
            <div className="bg-[#0C0E3C] p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">Courses</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-gray-300">
                <li>Cybersecurity Essentials</li>
                <li>Graduation in Social Engineering</li>
                <li>Spyware & Ransomware Deep Dive</li>
                <li>iOS & Android Security Fundamentals</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
