"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Award, Share2, Shield, Code } from 'lucide-react';
import axios from 'axios';
import Navbar from "@/components/Navbar";
import Footer from '@/components/Footer';
import { useAuthContext } from "@/components/AuthContext";
import { useParams } from 'next/navigation';

const BadgeId = () => {
  const params = useParams();
  const badgeId = params?.badgeid;
  const [badges, setBadges] = useState([]);
  const [shareUrl, setShareUrl] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  const { isAuthenticated, user } = useAuthContext();
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
        setIsDataLoading(true);
        const responseBadges = await axios.get(`${process.env.SERVER_URL}/badges`);
        setBadges(responseBadges.data.badges);

        if (user?.username) {
          const token = localStorage.getItem('token');
          const responseEarnedBadges = await axios.get(
            `${process.env.SERVER_URL}/badges-earned`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );
          setEarnedBadges(responseEarnedBadges.data.badges || []);
          console.log('Earned Badges:', responseEarnedBadges.data.badges);
          earnedBadges.forEach((badge) => {
            console.log(`Badge ID: ${badge.badgeId}, Earned Date: ${badge.earnedDate}`);
          }
          );
        }
        setIsDataLoading(false);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges from database. Please try again later.');
        setIsDataLoading(false);
        setBadges([]);
      }
    };

    fetchBadges();
  }, [user]);

  const difficultyColors = {
    Easy: 'bg-green-500',
    Medium: 'bg-blue-600',
    Hard: 'bg-orange-500',
    Expert: 'bg-purple-700',
    Extreme: 'bg-red-600',
  };

  const getSkillIcon = (skill) => {
    if (skill === 'Basic Security') return <Shield className="w-5 h-5 mr-1" />;
    if (skill === 'Web Awareness') return <Code className="w-5 h-5 mr-1" />;
    return <Shield className="w-5 h-5 mr-1" />;
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [currentBadgeIndex]);

  useEffect(() => {
    if (badges.length > 0 && badgeId) {
      const index = badges.findIndex(
        (b) => String(b._id) === String(badgeId) || String(b.id) === String(badgeId)
      );
      if (index !== -1) setCurrentBadgeIndex(index);
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

  const earnedBadge = earnedBadges.find((badge) => badge.badgeId === currentBadge.id);

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
  const BadgeActions = ({ currentBadge, isAuthenticated }) => {
    const [earnedBadge, setEarnedBadge] = useState(null);
    const [showLoginMessage, setShowLoginMessage] = useState(false);
    const [showShareSuccess, setShowShareSuccess] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      try {
        const user = JSON.parse(userStr);
        const userBadges = user.badges || [];

        const match = userBadges.find((b) => b.id === currentBadge.id);
        if (match) {
          setEarnedBadge(match);
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }, [currentBadge.id]);

    const handleGenerateShareLink = () => {
      // if (!isAuthenticated) {
      //   setShowLoginMessage(true);
      //   setTimeout(() => setShowLoginMessage(false), 3000);
      //   return;
      // }

      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const shareURL = `${window.location.origin}/badges/shared/${currentBadge.id}/${user.username}/${Math.floor(Date.now() / 1000)}`;
      setShareUrl(shareURL);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);
      navigator.clipboard.writeText(shareURL);
    };

return (
  <div className="flex flex-row flex-wrap gap-2 md:flex-col md:space-y-4">
    {earnedBadge ? (
      <>
        {/* Earned Info Pill */}
        <div className="bg-green-700 rounded-full mx-auto p-2 px-3 shadow-md flex items-center space-x-2 md:rounded-md md:p-3">
          <Award className="w-5 h-5 md:w-6 md:h-6" />
          <span className="text-sm md:text-base whitespace-nowrap">
            <span className="block md:hidden">
              {earnedBadge.earnedDate
                ? new Date(earnedBadge.earnedDate).toLocaleDateString()
                : 'Earned'}
            </span>
            <span className="hidden md:block">
              {earnedBadge.earnedDate
                ? `You earned this badge on ${new Date(earnedBadge.earnedDate).toLocaleDateString()}`
                : 'You have earned this badge'}
            </span>
          </span>
        </div>

        {/* Share Link Pill */}
        <button
          className="bg-blue-600 hover:bg-blue-700 mx-auto transition rounded-full p-2 px-3 shadow-md flex items-center space-x-2 md:rounded-md md:p-3"
          onClick={handleGenerateShareLink}
        >
          <Share2 className="w-5 h-5 md:w-6 md:h-6" />
          <span className="text-sm md:text-base whitespace-nowrap">
            <span className="block md:hidden">Share</span>
            <span className="hidden md:block">Generate Share Link</span>
          </span>
        </button>
      </>
    ) : (
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
    )}

    {/* Feedback messages – keep as is */}
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

// Badge Metrics Component
const BadgeMetrics = () => (
  <div className="w-full flex flex-col gap-2 md:flex-row md:justify-between mt-4">
    {/* Mobile: Level + Earners side by side */}
    <div className="flex flex-row gap-2 md:flex-1">
      {[ 
        { label: "Level", value: currentBadge.level || "N/A" },
        { label: "Earners", value: "43" },
      ].map(({ label, value }, index) => (
        <div
          key={index}
          className="flex-1 bg-gray-800 rounded-md shadow-md p-4 flex flex-col justify-between text-center min-h-[50px]"
        >
          <div className="text-sm uppercase text-gray-400">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      ))}
    </div>

    {/* Mobile: Vertical goes below, but aligns normally in row on md+ */}
    <div className="flex md:flex-1">
      <div className="flex-1 bg-gray-800 rounded-md shadow-md p-4 flex flex-col justify-between text-center min-h-[50px]">
        <div className="text-sm uppercase text-gray-400">Vertical</div>
        <div className="text-lg font-semibold">{currentBadge.vertical || "General"}</div>
      </div>
    </div>
  </div>
);

  // Badge Description Component
  const BadgeDescription = () => (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2">Badge Details</h2>
      <p>Course: {currentBadge.course}</p>
      <p className="text-gray-300 leading-relaxed">
        {currentBadge.description || 'No description available for this badge.'}
      </p>
    </div>
  );

  // Skills Earned Component
  const SkillsEarned = () => (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2">Skills Earned</h2>
      <div className="grid grid-cols-2 gap-3">
        {currentBadge.skillsEarned?.map((skill, idx) => (
          <div
            key={idx}
            className="flex items-center bg-gray-800 rounded-md px-3 py-2 shadow-md"
          >
            {getSkillIcon(skill)}
            <span>{skill}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Related Badges Component
  const RelatedBadges = () => (
    <div>
      <h3 className="text-xl font-semibold border-b border-gray-700 pb-1 mt-6">Related Badges</h3>
      <div className="flex space-x-4 overflow-auto py-2">
        {badges
          .filter((b) => b.id !== currentBadge.id)
          .slice(0, 3)
          .map((relatedBadge) => (
            <div
              key={relatedBadge.id}
              className="flex-shrink-0 cursor-pointer flex flex-col items-center w-24 space-y-2"
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
                crossorigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${relatedBadge?.id}` || relatedBadge.image?.data}
                alt={relatedBadge.name}
                className="rounded-lg shadow-md w-20 h-20 object-cover"
              />
              <span className="text-sm text-center">{relatedBadge.name}</span>
            </div>
          ))}
      </div>
    </div>
  );

  // Badge Image Component with Navigation
  const BadgeImage = () => (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center w-full max-w-md">
        <button
          aria-label="Previous Badge"
          onClick={() =>
            setCurrentBadgeIndex((prev) => (prev === 0 ? badges.length - 1 : prev - 1))
          }
          className="absolute z-100 left-0 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* bg-gradient-to-tr from-blue-700 via-cyan-600 to-teal-600 */}
        <div className="w-64 h-64 rounded-full z-0  shadow-lg flex items-center justify-center relative overflow-hidden">
          {!isLoading ? (
            <>
              <img
                crossorigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${currentBadge?.id}` || currentBadge.image?.data}
                alt={currentBadge?.name}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-2 left-0 right-0 text-center text-white text-sm font-medium">
                {currentBadgeIndex + 1} of {badges.length}
              </div>
            </>
          ) : (
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-300 h-16 w-16 animate-spin"></div>
          )}
        </div>

        <button
          aria-label="Next Badge"
          onClick={() =>
            setCurrentBadgeIndex((prev) => (prev === badges.length - 1 ? 0 : prev + 1))
          }
          className="absolute right-0 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <h1 className="text-3xl font-bold text-center mt-2">{currentBadge.name}</h1>

      {/* <div
        className={`inline-block px-4 py-1 rounded-full text-white font-semibold ${difficultyColors[currentBadge.difficulty]} mt-2`}
      >
        {currentBadge.difficulty}
      </div> */}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar />
      
      {/* Main content with responsive layout */}
      <main className="flex-grow" key={badgeId}>
        {/* Desktop Layout */}
        <div className="hidden md:hidden lg:flex md:flex-row max-w-7xl mx-auto p-6 gap-6">
          <section className="md:w-2/6 my-auto space-y-6">
            <BadgeDescription />
            <RelatedBadges />
          </section>
          &nbsp;
          &nbsp;

          <section className="md:w-2/6 flex flex-col items-center space-y-6">
            <BadgeImage />
            <BadgeMetrics />
          </section>
          &nbsp;
          &nbsp;

          <section className="md:w-2/6 my-auto space-y-6">
            <SkillsEarned />
            <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2">Badge Actions</h2>
            <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} />
          </section>
        </div>

        {/* Tablet Layout */}
        <section className="hidden md:flex lg:hidden flex-col w-full gap-6 text-white">
          <div className="flex w-full gap-6">
            {/* Badge and Badge Actions */}
            <div className="flex flex-col items-center w-1/2 space-y-4">
              <BadgeImage />
              <div className="flex flex-wrap justify-center gap-2">
                <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} />
              </div>
              <BadgeMetrics />
            </div>
            &nbsp;
            &nbsp;

            {/* Description */}
            <section className="w-1/2 mt-20">
              <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2">Badge Details</h2>
              <p className="text-gray-300 leading-relaxed">{currentBadge.description}</p>
              <SkillsEarned />
              <RelatedBadges />
            </section>
          </div>
        </section>

        {/* Mobile Layout */}
        <div className="flex sm:hidden flex-col max-w-sm mx-auto p-4 gap-4">
          {/* Badge Image */}
          <section className="flex flex-col items-center">
            <BadgeImage />
            <div className="text-center text-sm text-gray-400 mt-2">
              {currentBadgeIndex + 1} of {badges.length} badges
            </div>
          </section>
          {/* Badge Actions */}
          <section className="space-y-4">
            <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} />
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

      {/* Badge Collection Thumbnails */}
      <div className="bg-gray-800 p-4 flex flex-col items-center justify-between w-full max-w-7xl mt-4 mx-auto">
        {/* Scrollable row container */}
        <div className="w-full overflow-x-auto overflow-y-hidden">
          {/* Row of badges — make width as wide as needed */}
          <div className="flex space-x-2 w-max px-1 mx-auto">
            {badges.map((badge, index) => (
              <img
                key={badge.id}
                crossOrigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge.image?.data}
                alt={badge.name}
                className={`w-14 h-14 object-cover rounded-md cursor-pointer shadow-md transition-transform ${
                  index === currentBadgeIndex ? 'border-2 border-cyan-500 scale-100' : 'opacity-70'
                }`}
                onClick={() => setCurrentBadgeIndex(index)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setCurrentBadgeIndex(index);
                  }
                }}
              />
            ))}
          </div>
        </div>
        <div className="text-gray-300 mt-2 text-sm">
          {badges.length} Badges — Showing {currentBadgeIndex + 1} of {badges.length}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BadgeId;












//////////////////////////////////////////////////

// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Award,
//   Share2,
//   Shield,
//   Code,
// } from "lucide-react";
// import axios from "axios";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { useAuthContext } from "@/components/AuthContext";
// import { useParams } from "next/navigation";

// const BadgeId = () => {
//   const params = useParams();
//   const badgeId = params?.badgeid;
//   const [badges, setBadges] = useState([]);
//   const [earnedBadges, setEarnedBadges] = useState([]);
//   const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isDataLoading, setIsDataLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showShareSuccess, setShowShareSuccess] = useState(false);
//   const [showLoginMessage, setShowLoginMessage] = useState(false);

//   const { isAuthenticated, user } = useAuthContext();

//   useEffect(() => {
//     const fetchBadges = async () => {
//       try {
//         setIsDataLoading(true);
//         const responseBadges = await axios.get(
//           `${process.env.SERVER_URL}/badges`
//         );
//         setBadges(responseBadges.data.badges);

//         if (user?.username) {
//           const token = localStorage.getItem("token");
//           const responseEarnedBadges = await axios.get(
//             `${process.env.SERVER_URL}/badges-earned`,
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "application/json",
//               },
//               timeout: 10000,
//             }
//           );
//           setEarnedBadges(responseEarnedBadges.data.badges || []);
//         }
//         setIsDataLoading(false);
//       } catch (err) {
//         console.error("Error fetching badges:", err);
//         setError("Failed to load badges from database. Please try again later.");
//         setIsDataLoading(false);
//         setBadges([]);
//       }
//     };

//     fetchBadges();
//   }, [user]);

//   const difficultyColors = {
//     Easy: "bg-green-700",
//     Medium: "bg-green-600",
//     Hard: "bg-green-800",
//     Expert: "bg-green-900",
//     Extreme: "bg-green-950",
//   };

//   const getSkillIcon = (skill) => {
//     if (skill === "Basic Security")
//       return <Shield className="w-5 h-5 mr-1 text-green-400" />;
//     if (skill === "Web Awareness")
//       return <Code className="w-5 h-5 mr-1 text-green-400" />;
//     return <Shield className="w-5 h-5 mr-1 text-green-400" />;
//   };

//   useEffect(() => {
//     setIsLoading(true);
//     const timer = setTimeout(() => setIsLoading(false), 1000);
//     return () => clearTimeout(timer);
//   }, [currentBadgeIndex]);

//   useEffect(() => {
//     if (badges.length > 0 && badgeId) {
//       const index = badges.findIndex(
//         (b) => String(b._id) === String(badgeId) || String(b.id) === String(badgeId)
//       );
//       if (index !== -1) setCurrentBadgeIndex(index);
//     }
//   }, [badges, badgeId]);

//   const currentBadge =
//     badges.length > 0
//       ? badges[currentBadgeIndex]
//       : {
//           id: 0,
//           name: "Loading...",
//           image: "",
//           difficulty: "Medium",
//           description: "Loading badge information...",
//           category: "Loading...",
//           skillsEarned: [],
//         };

//   const earnedBadge = earnedBadges.find((badge) => badge.badgeId === currentBadge.id);

//   if (isDataLoading) {
//     return (
//       <div className="min-h-screen flex flex-col bg-black text-green-400">
//         <Navbar />
//         <div className="flex-grow flex flex-col items-center justify-center">
//           <div className="loader ease-linear rounded-full border-8 border-t-8 border-green-700 h-16 w-16 mb-4 animate-spin"></div>
//           <p className="text-green-500 text-lg">Loading Badge Gallery...</p>
//         </div>
//       </div>
//     );
//   }

//   // Badge Actions Component
//   const BadgeActions = ({ currentBadge, isAuthenticated }) => {
//     const [earnedBadge, setEarnedBadge] = useState(null);
//     const [showLoginMessage, setShowLoginMessage] = useState(false);
//     const [showShareSuccess, setShowShareSuccess] = useState(false);
//     const [shareUrl, setShareUrl] = useState("");

//     useEffect(() => {
//       const userStr = localStorage.getItem("user");
//       if (!userStr) return;

//       try {
//         const user = JSON.parse(userStr);
//         const userBadges = user.badges || [];

//         const match = userBadges.find((b) => b.id === currentBadge.id);
//         if (match) {
//           setEarnedBadge(match);
//         }
//       } catch (err) {
//         console.error("Failed to parse user from localStorage", err);
//       }
//     }, [currentBadge.id]);

//     const handleGenerateShareLink = () => {
//       const userStr = localStorage.getItem("user");
//       if (!userStr) return;

//       const user = JSON.parse(userStr);
//       const shareURL = `${window.location.origin}/badges/shared/${currentBadge.id}/${user.username}/${Math.floor(
//         Date.now() / 1000
//       )}`;
//       setShareUrl(shareURL);
//       setShowShareSuccess(true);
//       setTimeout(() => setShowShareSuccess(false), 3000);
//       navigator.clipboard.writeText(shareURL);
//     };

//     return (
//       <div className="flex flex-col space-y-4">
//         {earnedBadge ? (
//           <>
//             <div className="flex items-center space-x-2 bg-green-900 rounded-md p-3 shadow-md border border-green-600">
//               <Award className="w-6 h-6 text-green-400" />
//               <span className="text-green-300">
//                 {earnedBadge.earnedDate
//                   ? `You earned this badge on ${new Date(
//                       earnedBadge.earnedDate
//                     ).toLocaleDateString()}`
//                   : "You have earned this badge"}
//               </span>
//             </div>

//             <button
//               className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 transition rounded-md p-3 shadow-md border border-green-500 text-green-100"
//               onClick={handleGenerateShareLink}
//             >
//               <Share2 className="w-6 h-6 text-green-300" />
//               <span>Generate Share Link</span>
//             </button>
//           </>
//         ) : (
//           <button
//             className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 transition rounded-md p-3 shadow-md border border-green-500 text-green-100"
//             onClick={() => (window.location.href = "https://learn.deepcytes.io/")}
//           >
//             <Award className="w-6 h-6 text-green-300" />
//             <span>Get this Badge</span>
//           </button>
//         )}

//         {showShareSuccess && (
//           <div className="bg-green-600 text-black p-2 rounded-md text-center animate-pulse">
//             Link generated! Share URL copied to clipboard.
//           </div>
//         )}

//         {showLoginMessage && (
//           <div className="bg-red-700 text-white p-2 rounded-md text-center animate-pulse">
//             Please log in to generate a share link.
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Badge Metrics Component
//   const BadgeMetrics = () => (
//     <div className="w-full flex justify-around mt-4 text-center text-green-300">
//       <div className="p-2 flex-1 shadow-md border border-green-700 rounded-md bg-black/60">
//         <div className="text-sm uppercase text-green-400">Level</div>
//         <div className="text-lg font-semibold">{currentBadge.level || "N/A"}</div>
//       </div>
//       <div className="p-2 flex-1 shadow-md border border-green-700 rounded-md bg-black/60">
//         <div className="text-sm uppercase text-green-400">Branch</div>
//         <div className="text-lg font-semibold">
//           {currentBadge.skillsEarned[0] || "General"}
//         </div>
//       </div>
//       <div className="p-2 flex-1 shadow-md border border-green-700 rounded-md bg-black/60">
//         <div className="text-sm uppercase text-green-400">Earners</div>
//         <div className="text-lg font-semibold">43</div>
//       </div>
//     </div>
//   );

//   // Badge Description Component
//   const BadgeDescription = () => (
//     <div className="space-y-2 text-green-300">
//       <h2 className="text-2xl font-bold">{currentBadge.name}</h2>
//       <p className="italic text-green-400">{currentBadge.category}</p>
//       <p>{currentBadge.description}</p>
//     </div>
//   );

//   // Badge Skills List
//   const BadgeSkillsList = () => (
//     <div className="mt-4">
//       <h3 className="text-green-400 font-semibold mb-2">Skills Earned</h3>
//       <ul className="list-disc list-inside space-y-1 text-green-300">
//         {currentBadge.skillsEarned?.map((skill, idx) => (
//           <li
//             key={idx}
//             className="flex items-center space-x-1 text-green-300"
//             title={skill}
//           >
//             {getSkillIcon(skill)}
//             <span>{skill}</span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );

//   // Navigation Controls
//   const NavigationControls = () => (
//     <div className="flex justify-between items-center mt-6">
//       <button
//         onClick={() =>
//           setCurrentBadgeIndex((prev) => (prev > 0 ? prev - 1 : prev))
//         }
//         disabled={currentBadgeIndex === 0}
//         className="flex items-center space-x-1 px-4 py-2 border border-green-600 rounded-md bg-black hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
//       >
//         <ChevronLeft className="w-5 h-5 text-green-400" />
//         <span>Previous</span>
//       </button>

//       <button
//         onClick={() =>
//           setCurrentBadgeIndex((prev) =>
//             prev < badges.length - 1 ? prev + 1 : prev
//           )
//         }
//         disabled={currentBadgeIndex === badges.length - 1}
//         className="flex items-center space-x-1 px-4 py-2 border border-green-600 rounded-md bg-black hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
//       >
//         <span>Next</span>
//         <ChevronRight className="w-5 h-5 text-green-400" />
//       </button>
//     </div>
//   );

//   return (
//     <div className="min-h-screen flex flex-col bg-black text-green-300 font-sans selection:bg-green-600 selection:text-black">
//       <Navbar />
//       <main className="container mx-auto px-4 py-6 flex-grow">
//         {error && (
//           <div className="bg-red-900 text-red-400 p-4 mb-4 rounded-md border border-red-600">
//             {error}
//           </div>
//         )}

//         <div className="max-w-4xl mx-auto bg-black/80 rounded-lg p-6 shadow-lg border border-green-800">
//           <div className="flex flex-col md:flex-row md:space-x-8">
//             {/* Badge Image */}
//             <div className="flex-shrink-0 mb-6 md:mb-0">
//               <img
                  //crossorigin="anonymous"
//                 src={currentBadge.image || "/default-badge.png"}
//                 alt={currentBadge.name}
//                 className="w-48 h-48 object-contain rounded-md border border-green-600 shadow-md"
//               />
//               <div
//                 className={`mt-3 text-center text-sm font-semibold text-black px-3 py-1 rounded-full ${
//                   difficultyColors[currentBadge.difficulty] || "bg-green-700"
//                 }`}
//               >
//                 {currentBadge.difficulty}
//               </div>
//             </div>

//             {/* Badge Info */}
//             <div className="flex flex-col flex-grow justify-between">
//               <BadgeDescription />
//               <BadgeSkillsList />
//               <BadgeMetrics />
//               <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} />
//               <NavigationControls />
//             </div>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default BadgeId;
