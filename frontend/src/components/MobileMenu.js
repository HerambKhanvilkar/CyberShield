import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MobileMenu.css';

const MobileMenu = ({ isOpen, onClose, isLoggedIn, username }) => {
  const navigate = useNavigate();
  
  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };
  
  return (
    <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
      <div className="mobile-menu-header">
        <div className="mobile-menu-logo">CyberBadge</div>
        <button className="close-menu-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="mobile-menu-content">
        <nav className="mobile-nav">
          <ul>
            <li onClick={() => handleNavigation('/')}>Home</li>
            <li onClick={() => handleNavigation('/badges')}>All Badges</li>
            <li onClick={() => handleNavigation('/leaderboard')}>Leaderboard</li>
            {isLoggedIn && (
              <li onClick={() => handleNavigation(`/profile/${username}`)}>My Profile</li>
            )}
            <li onClick={() => handleNavigation('/about')}>About Us</li>
            <li onClick={() => handleNavigation('/contact')}>Contact</li>
          </ul>
        </nav>
        
        <div className="mobile-menu-actions">
          {isLoggedIn ? (
            <>
              <div className="mobile-user-info">
                <div className="mobile-avatar">{username.charAt(0).toUpperCase()}</div>
                <span>{username}</span>
              </div>
              <button 
                className="glass-button logout-btn" 
                onClick={() => {
                  localStorage.removeItem("username");
                  handleNavigation('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button 
              className="glass-button login-btn"
              onClick={() => handleNavigation('/login')}
            >
              Login / Signup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;