"use client";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import axios from "axios";
// import { useAuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function Page() {
  const [userData, setUserData] = useState(null);
  const { user, loading, logout } = useAuthContext();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.SERVER_URL}/user/info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(response.data.user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUser();
  }, []);

  if (!userData) {
    return (
      <main className="bg-[#00011E] text-white min-h-screen p-4 flex items-center justify-center">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#00011E] text-white min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1 bg-[#0C0E3C] p-4 rounded-xl flex flex-col items-center">
            <div className="border-4 border-purple-500 rounded-full p-1 mb-4">
              <img
                src="/images/user.png"
                alt="User Image"
                className="rounded-full w-24 h-24 object-cover"
              />
            </div>
            <h2 className="text-lg font-bold text-center">{userData.firstName} {userData.lastName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 items-center mt-6 gap-4">
              {userData.badges && userData.badges.length > 0 ? (
                userData.badges.map((badge, i) => (
                  <div key={i} className="flex justify-center">
                    <img
                      src={badge.imageUrl || `/images/img${i + 1}.png`}
                      alt={badge.name}
                      className="w-15 md:w-20 rounded-full border-2 border-purple-500"
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm col-span-full">No badges yet</p>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <section className="md:col-span-4 grid gap-6">
            {/* Achievements */}
            <div className="bg-[#0C0E3C] p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Achievements</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                <li>Completed 6 courses in Red Teaming, OSINT & Forensics Verticals</li>
                <li>Completed Red Teaming Career Path</li>
                <li>Completed Level 1 and Level 2 Cyber Titan Workshops</li>
                <li>Completed 6 months fellowship as Red Teamer in Deepcytes</li>
              </ul>
            </div>

            {/* Dynamic Badge Info (First badge as example) */}
            {userData.badges?.[0] && (
              <div className="bg-[#0C0E3C] p-6 rounded-xl grid md:grid-cols-3 gap-6">
                <div className="flex items-center justify-center md:justify-start">
                  <img
                    src={userData.badges[0].imageUrl || "/images/img1.png"}
                    alt="Badge"
                    className="w-20 h-20"
                  />
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-2">Badge Info</h3>
                  <div className="flex justify-between text-sm text-gray-300">
                    <div>
                      <p className="font-semibold text-white">Date</p>
                      <p>{new Date(userData.badges[0].date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Level</p>
                      <p>{userData.badges[0].level || "Medium"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Earners</p>
                      <p>{userData.badges[0].earners || "N/A"}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm">
                    This badge was earned by <span className="text-green-400 font-semibold">{userData.firstName}</span> for completing{" "}
                    <span className="font-semibold text-blue-400">{userData.badges[0].description || "a course"}</span>.
                  </p>
                  <a href="#" className="text-blue-400 text-sm underline mt-2 inline-block">
                    View this badge
                  </a>
                </div>
              </div>
            )}

            {/* Courses (Static, can be dynamic if needed) */}
            <div className="bg-[#0C0E3C] p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Courses</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                <li>Cybersecurity Essentials</li>
                <li>Graduation in Social Engineering</li>
                <li>Spyware & Ransomware</li>
                <li>Everything about iOS & Android Security</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
