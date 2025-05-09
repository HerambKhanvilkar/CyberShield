import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Use only the AuthContext for authentication state
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  
  const handleLogout = () => {
    // Use the logout function from AuthContext
    logout();
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
            
            {/* Dropdown menu */}
            <li className="dropdown1">
              <span onClick={() => setDropdownOpen(!dropdownOpen)}>
                More <i className="dropdown-icon1"></i>
              </span>
              {dropdownOpen && (
                <div className="dropdown-menu1">
                  <div 
                    className="dropdown-item1" 
                    onClick={() => {
                      navigate("/about");
                      setDropdownOpen(false);
                    }}
                  >
                    About Us
                  </div>
                  <div 
                    className="dropdown-item1" 
                    onClick={() => {
                      navigate("/admin/login");
                      setDropdownOpen(false);
                    }}
                  >
                    Admin Login
                  </div>
                  <div 
                    className="dropdown-item1" 
                    onClick={() => {
                      navigate("/contact");
                      setDropdownOpen(false);
                    }}
                  >
                    Contact
                  </div>
                  {isAuthenticated && user?.isAdmin && (
                    <div 
                      className="dropdown-item1" 
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
          {isAuthenticated && user ? (
            <>
              <div 
                className="user-profile" 
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="username-display">{user.username}</span>
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
              onClick={() => {
                console.log("Navigating to login page");
                navigate("/login");
              }}
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