import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername("");
    navigate("/");
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <header className="navbar-glass">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <span className="neon-text">CyberBadge</span>
        </div>
        
        {/* Mobile menu toggle */}
        <div className="mobile-toggle" onClick={toggleMobileMenu}>
          <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        {/* Navigation links */}
        <nav className={`navbar-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
          <ul>
            <li onClick={() => navigate("/")}>Home</li>
            <li onClick={() => navigate("/badges")}>All Badges</li>
            <li onClick={() => navigate("/leaderboard")}>Leaderboard</li>
            
            
            {/* Dropdown menu */}
            <li className="dropdown">
              <span onClick={() => setDropdownOpen(!dropdownOpen)}>
                More <i className="dropdown-icon"></i>
              </span>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div 
                    className="dropdown-item" 
                    onClick={() => {
                      navigate("/about");
                      setDropdownOpen(false);
                    }}
                  >
                  <div 
                    className="dropdown-item" 
                    onClick={() => {
                      navigate("/admin/login");
                      setDropdownOpen(false);
                    }}
                    >
                    Admin Login
                  </div>
                    About Us
                  </div>
                  <div 
                    className="dropdown-item" 
                    onClick={() => {
                      navigate("/contact");
                      setDropdownOpen(false);
                    }}
                  >
                    Contact
                  </div>
                  {isLoggedIn && (
                    <div 
                      className="dropdown-item" 
                      onClick={() => {
                        navigate("/admin/badges");
                        setDropdownOpen(false);
                      }}
                    >
                      Badge Admin
                    </div>
                  )}
                </div>
              )}
            </li>
          </ul>
        </nav>
        
        {/* User section */}
        <div className="navbar-user">
          {isLoggedIn ? (
            <>
              <div 
                className="user-profile" 
                onClick={() => navigate(`/profile/${username}`)}
              >
                <div className="user-avatar">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="username-display">{username}</span>
              </div>
              <button 
                className="glass-button logout-btn" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <button 
              className="glass-button" 
              onClick={() => navigate("/login")}
            >
              Login / Signup
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
