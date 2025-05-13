import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; // Import axios for API requests
import Navbar from "./Navbar";
import "./MainPage.css";
import logo from "./logo.png";
// Keep image imports for fallback
import img1 from "./img1.png";
import img2 from "./img2.png";
import img3 from "./img3.png";
import img4 from "./img4.png";
import img5 from "./img5.png";
import img6 from "./img6.png";
import img7 from "./img7.png";
import img8 from "./img8.png";

// Import the particle effect
import { initParticles } from "./effects/particleEffect";

const MainPage = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [badges, setBadges] = useState([]);
  const [totalBadges, setTotalBadges] = useState(0);
  const [visibleBadges] = useState(5); // Number of badges visible at a time
  const [startIndex, setStartIndex] = useState(0);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Initialize particles
    initParticles();
    
    // Check if user is logged in
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
    
    // Fetch badges from API
    const fetchBadges = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/badges`);
        console.log("Fetched badges:", response.data);
        setBadges(response.data.badges);
        setTotalBadges(response.data.badges.length);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching badges:", err);
        setError("Failed to load badges. Please try again later.");
        setIsLoading(false);
        
        // Fallback to hardcoded data if API fails
        const fallbackBadges = [
          { id: 1, name: "Cyber Titan Level I", image: img1 },
          { id: 2, name: "Cyber Warrior", image: img2 },
          { id: 3, name: "Cyber Defender", image: img3 },
          { id: 4, name: "Cyber Elite", image: img4 },
          { id: 5, name: "Cyber Guardian", image: img5 },
          { id: 6, name: "Cyber Commander", image: img6 },
          { id: 7, name: "Cyber Legend", image: img7 },
          { id: 8, name: "Cyber Master", image: img8 },
        ];
        setBadges(fallbackBadges);
        setTotalBadges(fallbackBadges.length);
      }
    };
    
    fetchBadges();
  }, []);
  
  // Set up auto-rotate for badges
  useEffect(() => {
    if (badges.length === 0) return;
    
    const rotateInterval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % totalBadges);
    }, 5000);
    
    return () => clearInterval(rotateInterval);
  }, [badges, totalBadges]);

  // Move carousel forward
  const handleNext = () => {
    if (startIndex + visibleBadges < totalBadges) {
      setStartIndex(startIndex + 1);
    }
  };

  // Move carousel backward
  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1);
    }
  };

  // Update the main display when clicking a badge
  const handleBadgeClick = (index) => {
    setActiveIndex(index);
  };

  // If still loading, show loading spinner
  if (isLoading) {
    return (
      <div className="main-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading badges...</p>
        </div>
      </div>
    );
  }

  // If error and no fallback data, show error message
  if (error && badges.length === 0) {
    return (
      <div className="main-page">
        <Navbar />
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="glass-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-page">
      <Navbar />
      
      <div className="hero-section">
        <div className="hero-content">
          <img src={logo} alt="Deep Cytes Logo" className="hero-logo" />
          <h1 className="hero-title">Cyber Security <span className="neon-text">Badging System</span></h1>
          <p className="hero-subtitle">
            Earn badges, showcase your skills, and advance your cybersecurity career
          </p>
          
          <div className="hero-actions">
            {isLoggedIn ? (
              <button 
                className="glass-button primary"
                onClick={() => navigate(`/profile/${username}`)}
              >
                View My Badges
              </button>
            ) : (
              <button 
                className="glass-button primary"
                onClick={() => navigate("/login")}
              >
                Get Started
              </button>
            )}
            <button 
              className="glass-button secondary"
              onClick={() => navigate("/badges")}
            >
              Explore Badges
            </button>
          </div>
        </div>
      </div>
      
      {badges.length > 0 && (
        <section className="featured-badge-section">
          <div className="container">
            <h2>Featured Badge</h2>
            <div className="featured-badge glass-card">
              <div className="featured-badge-content">
                <div className="featured-badge-info">
                  <h3 className="neon-text">{badges[activeIndex].name}</h3>
                  <p className="featured-badge-description">
                    {badges[activeIndex].description || 
                      `This badge is awarded to cybersecurity professionals who have successfully 
                       completed the ${badges[activeIndex].name} challenge, demonstrating exceptional 
                       skills in this area.`
                    }
                  </p>
                  
                  <div className="badge-achievement">
                    <div className="achievement-stat">
                      <div className="stat-value">80</div>
                      <div className="stat-label">Cyber Agents</div>
                    </div>
                    <div className="achievement-stat">
                      <div className="stat-value">{badges[activeIndex].difficulty || "Amateur"}</div>
                      <div className="stat-label">Level</div>
                    </div>
                  </div>
                  
                  <button 
                    className="glass-button"
                    onClick={() => navigate("/badges")}
                  >
                    Learn More
                  </button>
                </div>
                
                <div className="featured-badge-image">
                  <img 
                    src={badges[activeIndex].image} 
                    alt={badges[activeIndex].name} 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {badges.length > 0 && (
        <section className="badge-carousel-section">
          <div className="container">
            <h2>All Badges</h2>
            <div className="badge-carousel glass-card">
              <button 
                className="carousel-nav prev" 
                onClick={handlePrev} 
                disabled={startIndex === 0}
              >
                ◀
              </button>
              
              <div className="carousel-container">
                <div 
                  className="carousel-track"
                  style={{
                    transform: `translateX(-${startIndex * 100}px)`,
                    transition: "transform 0.4s ease-in-out",
                  }}
                >
                  {badges.map((badge, index) => (
                    <div
                      key={index}
                      className={`carousel-item ${index === activeIndex ? "active" : ""}`}
                      onClick={() => handleBadgeClick(index)}
                    >
                      <img src={badge.image} alt={badge.name} />
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                className="carousel-nav next" 
                onClick={handleNext} 
                disabled={startIndex + visibleBadges >= totalBadges}
              >
                ▶
              </button>
            </div>
          </div>
        </section>
      )}
      
      <section className="features-section">
        <div className="container">
          <h2>Why Earn Badges?</h2>
          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon">🏆</div>
              <h3>Showcase Skills</h3>
              <p>Display your verified cybersecurity skills and knowledge to employers and peers.</p>
            </div>
            
            <div className="feature-card glass-card">
              <div className="feature-icon">🚀</div>
              <h3>Career Growth</h3>
              <p>Advance your career by earning increasingly advanced badges in your field.</p>
            </div>
            
            <div className="feature-card glass-card">
              <div className="feature-icon">🔍</div>
              <h3>Validate Expertise</h3>
              <p>Prove your capabilities through practical challenges and assessments.</p>
            </div>
            
            <div className="feature-card glass-card">
              <div className="feature-icon">🌐</div>
              <h3>Join Community</h3>
              <p>Connect with other cybersecurity professionals in a growing community.</p>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="main-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={logo} alt="Deep Cytes Logo" />
              <p>CyberBadge System</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Navigation</h4>
                <ul>
                  <li onClick={() => navigate("/")}>Home</li>
                  <li onClick={() => navigate("/badges")}>All Badges</li>
                  <li onClick={() => navigate("/leaderboard")}>Leaderboard</li>
                  {isLoggedIn && (
                    <li onClick={() => navigate(`/profile/${username}`)}>My Profile</li>
                  )}
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li>About Us</li>
                  <li>Contact</li>
                  <li>Help Center</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Connect</h4>
                <div className="social-links">
                  <span className="social-icon">🌐</span>
                  <span className="social-icon">📱</span>
                  <span className="social-icon">📧</span>
                  <span className="social-icon">📸</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2023 CyberBadge System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;
