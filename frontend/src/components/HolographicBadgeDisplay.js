import React, { useState, useEffect, useRef, useContext } from 'react';
import { ChevronLeft, ChevronRight, Award, Share2, Shield, Code } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './HolographicBadgeDisplay.css';
import { AuthContext } from "../context/AuthContext";
import { useSwipeable } from 'react-swipeable';

const HolographicBadgeDisplay = () => {
  const [badges, setBadges] = useState([]);
  const [shareUrl, setShareUrl] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const hologramRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  const { isAuthenticated, user, logout } = useContext(AuthContext);

  // Fetch badges from backend
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);

    const fetchBadges = async () => {
      try {
        setIsDataLoading(true);

        // Fetch all badges
        const responseBadges = await axios.get(`${process.env.REACT_APP_SERVER_URL}/badges`);
        console.log("Fetched badges:", responseBadges.data);
        setBadges(responseBadges.data.badges);

        // Fetch earned badges for the user
        if (user && user.username) {
          const responseEarnedBadges = await axios.get(`${process.env.REACT_APP_SERVER_URL}/badges-earned/${user.username}`);
          console.log("Fetched earned badges:", responseEarnedBadges.data);
          setEarnedBadges(responseEarnedBadges.data.badges || []); // Store earned badges
        }

        setIsDataLoading(false);
      } catch (err) {
        console.error("Error fetching badges:", err);
        setError("Failed to load badges from database. Please try again later.");
        setIsDataLoading(false);

        // Fallback to hardcoded data if API fails
        setBadges([
          { 
            id: 1, 
            name: "Cyber Titan Level I", 
            image: "/images/img1.png", 
            difficulty: "Easy", 
            description: "Awarded for completing basic cybersecurity challenges.",
            category: "Amateur",
            skillsEarned: ["Basic Security", "Web Awareness"]
          },
          { 
            id: 2, 
            name: "Cyber Warrior", 
            image: "/images/img2.png", 
            difficulty: "Medium", 
            description: "Earned after passing the second level of security defenses.",
            category: "Intermediate",
            skillsEarned: ["Network Security", "Threat Identification"]
          },
          { 
            id: 3, 
            name: "Cyber Defender", 
            image: "/images/img3.jpg", 
            difficulty: "Medium", 
            description: "Awarded for identifying and mitigating cyber threats.",
            category: "Intermediate",
            skillsEarned: ["Threat Prevention", "Security Policy"]
          },
          { 
            id: 4, 
            name: "Cyber Elite", 
            image: "/images/img4.jpg", 
            difficulty: "Hard", 
            description: "For advanced penetration testing and security analysis.",
            category: "Professional",
            skillsEarned: ["Penetration Testing", "Vulnerability Assessment"]
          }
        ]);
      }
    };

    fetchBadges();

    return () => window.removeEventListener('resize', handleResize);
  }, [user]); // Run the effect whenever the `user` changes

  // Mapping difficulty to color
  const difficultyColors = {
    "Easy": "#4CAF50",
    "Medium": "#2196F3",
    "Hard": "#FF9800",
    "Expert": "#9C27B0",
    "Extreme": "#F44336"
  };

  // Get skill icon based on skill name
  const getSkillIcon = (skill) => {
    if (skill === "Basic Security") return <Shield className="icon-small" />;
    if (skill === "Web Awareness") return <Code className="icon-small" />;
    return <Shield className="icon-small" />;
  };

  // Handle hologram loading when changing badges
  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentBadgeIndex]);

  // Get current badge
  const currentBadge = badges.length > 0 ? badges[currentBadgeIndex] : {
    id: 0,
    name: "Loading...",
    image: "",
    difficulty: "Medium",
    description: "Loading badge information...",
    category: "Loading...",
    skillsEarned: []
  };

  // Find the earned badge for the current badge
const earnedBadge = earnedBadges.find(badge => badge.id === currentBadge.id);

  // If initial data is loading, show loading state
  if (isDataLoading) {
    return (
      <div className="badge-view-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading Badge Gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="badge-view-page">
      <Navbar />
      <div className="badge-main-content">
        {/* Left Column */}
        <div className="badge-left-column">
          <h2 className="section-title">Skills Earned</h2>
          <div className="skills-grid">
            {currentBadge.skillsEarned?.map((skill, idx) => (
              <div key={idx} className="skill-item">
                {getSkillIcon(skill)}
                <span>{skill}</span>
              </div>
            ))}
          </div>

          <h2 className="section-title">Badge Details</h2>
          <div className="badge-detailed-description">
            This badge recognizes excellence in cybersecurity fundamentals.
            Earners have demonstrated practical knowledge of core security concepts
            and have successfully applied these skills in various defensive scenarios.
          </div>
        </div>

        {/* Center Column - Badge Display */}
        <div className="badge-center-column">
          <div className="hologram-container">
            <button className="nav-button prev" onClick={() => setCurrentBadgeIndex(prev => prev === 0 ? badges.length - 1 : prev - 1)}>
              <ChevronLeft />
            </button>

            <div className="badge-hologram">
              {!isLoading ? (
                <img src={currentBadge.image} alt={currentBadge.name} className="badge-image" />
              ) : (
                <div className="loading-spinner"></div>
              )}
            </div>

            <button className="nav-button next" onClick={() => setCurrentBadgeIndex(prev => prev === badges.length - 1 ? 0 : prev + 1)}>
              <ChevronRight />
            </button>
          </div>

          <div className="hologram-base">
            <div className="base-ring ring1"></div>
            <div className="base-ring ring2"></div>
            <div className="base-ring ring3"></div>
          </div>
          <h1 className="badge-title">{currentBadge.name}</h1>

          <div className="difficulty-badge" style={{ backgroundColor: difficultyColors[currentBadge.difficulty] }}>
            {currentBadge.difficulty}
          </div>

          <div className="badge-info-boxes">
            <div className="info-box">
              <span className="info-label">Vertical</span>
              <span className="info-value">{currentBadge.category}</span>
            </div>

            <div className="info-box">
              <span className="info-label">Branch</span>
              <span className="info-value">{currentBadge.skillsEarned[0] || "General"}</span>
            </div>

            <div className="info-box">
              <span className="info-label">Earners</span>
              <span className="info-value">43</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="badge-right-column">
          <h2 className="section-title">Badge Actions</h2>

          <div className="badge-actions">
            {earnedBadge ? (
              <div className="action-button get-badge earned-badge">
                <Award className="action-icon" />
                <span>
                  {earnedBadge.earnedDate ? `Earned on ${new Date(earnedBadge.earnedDate).toLocaleDateString()}` : "Not Earned Yet"}
                </span>
              </div>
            ) : (
              <button
                className="action-button get-badge"
                onClick={() => window.location.href = "https://learn.deepcytes.io/"}
              >
                <Award className="action-icon" />
                <span>Get this Badge</span>
              </button>
            )}

            <button
              className="action-button share-badge"
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginMessage(true);
                  setTimeout(() => setShowLoginMessage(false), 3000);
                } else {
                  const user = localStorage.getItem("user");
                  const userObject = JSON.parse(user);
                  const shareUrl = `${window.location.origin}/badge/shared/${currentBadge.id}/${userObject.username}/${Math.floor(Date.now()/1000)}`;
                  console.log(shareUrl);
                  setShowShareSuccess(true);
                  setTimeout(() => setShowShareSuccess(false), 3000);
                }
              }}
            >
              <Share2 className="action-icon" />
              <span>Generate Share Link</span>
            </button>

            {showShareSuccess && <div className="share-success">Link copied to clipboard!</div>}
            {showLoginMessage && <div className="share-success">Please login to share!</div>}
          </div>
         <h2 className="section-title">Related Badges</h2>
          <div className="related-badges">
            {badges
              .filter(badge => badge.id !== currentBadge.id)
              .slice(0, 3)
              .map(badge => (
                <div 
                  key={badge.id} 
                  className="related-badge"
                  onClick={() => setCurrentBadgeIndex(badges.findIndex(b => b.id === badge.id))}
                >
                  <img src={badge.image} alt={badge.name} />
                  <span>{badge.name}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
      
      {/* Badge Collection */}
      <div className="badge-collection">
        <div className="collection-info">
          <span>Badge Collection</span>
          <span className="badge-counter">{currentBadgeIndex + 1} / {badges.length}</span>
        </div>
        
        <div className="badge-thumbnails">
          {badges.map((badge, index) => (
            <div 
              key={badge.id}
              className={`badge-thumbnail ${index === currentBadgeIndex ? 'active' : ''}`}
              onClick={() => setCurrentBadgeIndex(index)}
            >
              <img src={badge.image} alt={badge.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  <Footer/>
};
export default HolographicBadgeDisplay;
