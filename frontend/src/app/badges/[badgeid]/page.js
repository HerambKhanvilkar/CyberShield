"use client";
import React, { useRef,useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Award,Trophy, Share2, Shield} from 'lucide-react';
import axios from 'axios';
import Navbar from "@/components/Navbar";
import Footer from '@/components/Footer';
import { useAuthContext } from "@/components/AuthContext";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button"

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
    const truncateText = (text, maxLength) => {
  if (text === null || text === undefined) {
    return '';
  }
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

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
      <div className={(earnedBadges.length > 0 ? "display" : "hidden") + " container mx-auto mt-2 flex items-center justify-center md:justify-end md:-mx-4 space-x-5 "}>
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
        const responseBadges = await axios.get(`${process.env.SERVER_URL}/badges`);
        setBadges(responseBadges.data.badges);
        setAllBadges(responseBadges.data.badges);

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
            console.log(`Badge ID: ${badge.id}, Earned Date: ${badge.earnedDate}`);
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

    fetchAllBadges();
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
        (b) => String(b.id) === String(badgeId)
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

        const match = userBadges.find((b) => b.id === currentBadge?.id);
        if (match) {
          setEarnedBadge(match);
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }, [currentBadge?.id]);

    const handleGenerateShareLink = () => {
      // if (!isAuthenticated) {
      //   setShowLoginMessage(true);
      //   setTimeout(() => setShowLoginMessage(false), 3000);
      //   return;
      // }

      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const shareURL = `${window.location.origin}/badges/shared/${currentBadge?.id}/${user.username}/${Math.floor(Date.now() / 1000)}`;
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
        {/* <div className="bg-green-700 rounded-full mx-auto p-2 px-3 shadow-md flex items-center space-x-2 md:rounded-md md:p-3">
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
        </div> */}

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

// Badge Metrics Component
const BadgeMetrics = () => (
  <div className="w-full flex flex-col gap-2 md:flex-row md:justify-between mt-0 md:mt-15">
    {/* Mobile: Level + Earners side by side */}
    <div className="flex flex-row gap-2 md:flex-1">
      {[
        { label: "Level", value: currentBadge?.level || "N/A" },
        { label: "Earners", value: "43" },
      ].map(({ label, value }, index) => (
        <div
          key={index}
          className="flex-1 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg p-4 flex flex-col justify-between text-center min-h-[50px]
          transition-shadow duration-300 ease-in-out
          hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]"
        >
          <div className="text-sm uppercase text-gray-400">{label}</div>
          <div className="text-lg font-semibold my-auto text-cyan-500">{value}</div>
        </div>
      ))}
    </div>

    {/* Mobile: Vertical goes below, but aligns normally in row on md+ */}
    <div className="flex md:flex-1">
      <div className="flex-1 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg p-4 flex flex-col justify-between text-center min-h-[50px]
            transition-shadow duration-300 ease-in-out
            hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]">
        <div className="text-sm uppercase text-gray-400">Vertical</div>
        <div className="text-lg font-semibold text-cyan-500">{currentBadge?.vertical || "General"}</div>
      </div>
    </div>
  </div>
);

  // Badge Description Component
  const BadgeDescription = () => (
  <div className="space-y-4 p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg">
    <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2 text-white flex items-center gap-2">
      <Trophy/>
      Badge Details
    </h2>
    <div className="flex items-center space-x-2 text-lg text-blue-400 font-medium">
      <span className="text-gray-300">Course:</span>
      <span className="text-blue-300">{currentBadge?.course || 'N/A'}</span>
    </div>

    <p className="text-gray-300 max-h-[170px] overflow-y-auto scrollbar leading-relaxed text-sm font-medium">
      {currentBadge?.description || 'No description available for this badge.'}
    </p>
  </div>
);

// Skills Earned Component with glow on hover
const SkillsEarned = () => (
  <div className="space-y-2">
    <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2 text-white flex items-center gap-2">
      <Shield className="w-6 h-6 mr-1 text-blue-400" />
      Skills Earned
    </h2>
    <div className="grid grid-cols-2 gap-3">
      {currentBadge?.skillsEarned?.map((skill, idx) => (
        <div
          key={idx}
          className="flex items-center text-sm rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg px-3 py-2 text-white
            transition-shadow duration-300 ease-in-out
            hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)]"
        >
          <Shield className="w-5 h-5 mr-1 text-blue-400" />
          <span className="text-sm font-medium">{skill}</span>
        </div>
      ))}
    </div>
  </div>
);

 // Related Badges Component
const RelatedBadges = () => (
  <div>
    <h3 className="text-xl font-semibold border-b border-gray-700 pb-1 mt-6 text-white">Related Badges</h3>
    <div className="flex space-x-2 md:space-x-4 mx-auto overflow-auto py-2">
      {allBadges
        .filter((b) => b.id !== currentBadge?.id)
        .slice(0, 3)
        .map((relatedBadge) => (
          <div
            key={relatedBadge.id}
            className="flex-shrink-0 cursor-pointer flex flex-col items-center w-22 md:w-24 space-y-2 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg p-2
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
              className="rounded-lg shadow-md w-15 md:w-20 h-15 md:h-20 object-cover"
            />
            <span className="text-sm font-medium text-center text-white">{relatedBadge.name}</span>
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
              <img
                crossOrigin="anonymous"
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#000428] to-[#004e92] text-white">
      <Navbar />

      <AllBadgeMyBadgeFilter/>
      
      {/* Main content with responsive layout */}
      <main className="flex-grow" key={badgeId}>
        {/* Desktop Layout */}
        <div className="hidden md:hidden lg:flex md:flex-row max-w-7xl min-h-[calc(100vh-250px)] mx-auto p-6 gap-6">
          
          <section className="md:w-2/6 my-auto space-y-6">
            <BadgeDescription />
            <RelatedBadges />
          </section>
          &nbsp;
          &nbsp;

          <section className="md:w-2/6 flex flex-col items-center">
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
                          ? new Date(earnedBadge.earnedDate).toLocaleDateString()
                          : "Earned"}
                      </span>
                      <span className="hidden md:block">
                        {earnedBadge.earnedDate
                          ? `You earned this badge on ${new Date(
                              earnedBadge.earnedDate
                            ).toLocaleDateString()}`
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
            <div>
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
                          ? new Date(earnedBadge.earnedDate).toLocaleDateString()
                          : "Earned"}
                      </span>
                      <span className="hidden md:block">
                        {earnedBadge.earnedDate
                          ? `You earned this badge on ${new Date(
                              earnedBadge.earnedDate
                            ).toLocaleDateString()}`
                          : "You have earned this badge"}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
              <BadgeImage />
              <div className="flex flex-wrap justify-center gap-2">
                <BadgeActions currentBadge={currentBadge} isAuthenticated={isAuthenticated} />
              </div>
              <BadgeMetrics />
              <RelatedBadges />
            </div>
            &nbsp;
            &nbsp;

            {/* Description */}
            <section className="w-1/2 mt-20 mr-4">
              <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2">Badge Details</h2>
              <p className="text-gray-300 leading-relaxed">{currentBadge?.description}</p>
              <SkillsEarned />
            </section>
          </div>
        </section>

        {/* Mobile Layout */}
        <div className="flex sm:hidden flex-col max-w-sm mx-auto p-4 gap-4">
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
                          ? new Date(earnedBadge.earnedDate).toLocaleDateString()
                          : "Earned"}
                      </span>
                      <span className="hidden md:block">
                        {earnedBadge.earnedDate
                          ? `You earned this badge on ${new Date(
                              earnedBadge.earnedDate
                            ).toLocaleDateString()}`
                          : "You have earned this badge"}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
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

      {/* Desktop Badge Collection Thumbnails */}
      <div className="hidden md:block rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg p-2 flex flex-col items-center justify-between mt-4 mx-auto">
        {/* Scrollable badge row with chevrons */}
        <div className="w-full flex items-center gap-2">
          
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
            className="overflow-x-hidden overflow-y-hidden scrollbar-hide w-[275px]" // 5 badges
          >
            <div className="flex space-x-2 w-max">
              {badges.map((badge, index) => (
                <img
                  key={badge.id}
                  crossOrigin="anonymous"
                  src={
                    `${process.env.SERVER_URL}/badge/images/${badge?.id}` ||
                    badge.image?.data
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

        <div className="text-gray-300 mt-1 mx-auto text-center text-xs">
          {badges.length} Badges — Showing {currentBadgeIndex + 1} of {badges.length}
        </div>
      </div>

      {/* Mobile Badge Collection Thumbnails */}
      <div className="block md:hidden rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg p-2 flex flex-col items-center justify-between mt-4 w-full mx-auto">
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
            className="flex space-x-2 overflow-x-auto px-6 scroll-smooth cursor-grab active:cursor-grabbing"
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
  );
};

export default BadgeId;