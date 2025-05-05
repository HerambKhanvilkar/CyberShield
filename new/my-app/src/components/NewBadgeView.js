import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './NewBadgeView.css';

const NewBadgeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareLink, setShowShareLink] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareError, setShareError] = useState('');
  
  // Get logged-in username
  const username = localStorage.getItem('username');
 
  // Convert difficulty to level
  const difficultyToLevel = {
    'Easy': 'Amateur',
    'Medium': 'Intermediate',
    'Hard': 'Professional',
    'Expert': 'Expert',
    'Extreme': 'Expert'
  };
  
  // Fetch badges
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/badges`);
        
        if (id && response.data.badges) {
          const badgeIndex = response.data.badges.findIndex(b => b.id === parseInt(id));
          if (badgeIndex >= 0) {
            setCurrentBadgeIndex(badgeIndex);
          }
        }
        
        setBadges(response.data.badges || []);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching badges:", err);
        setIsLoading(false);
        // Fallback badges
        setBadges([
          { 
            id: 1, 
            name: "Cyber Titan Level I", 
            image: "/images/img1.png", 
            difficulty: "Easy", 
            description: "Awarded for completing basic cybersecurity challenges.",
            category: "Fundamentals",
            skillsRequired: ["Basic Security", "Web Awareness"]
          },
          { 
            id: 2, 
            name: "Cyber Warrior", 
            image: "/images/img2.png", 
            difficulty: "Medium", 
            description: "Earned after passing the second level of security defenses.",
            category: "Defense",
            skillsRequired: ["Network Security", "Threat Identification"]
          }
        ]);
      }
    };
    
    fetchBadges();
  }, [id]);
  
  // Generate share link
  const generateShareLink = async () => {
    // Reset previous states
    setShareError('');
    setShareLink('');

    // Check if user is logged in
    if (!username) {
      setShareError('Please log in to generate a share link.');
      return;
    }

    try {
      const badge = badges[currentBadgeIndex];
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/generate-share-link`, 
        { badgeId: badge.id },
        { 
          headers: { 
            'username': username 
          } 
        }
      );

      // Construct full share link
      const fullShareLink = `${window.location.origin}${response.data.shareLink}`;

      // Copy to clipboard
      navigator.clipboard.writeText(fullShareLink);

      // Set share link for display
      setShareLink(fullShareLink);
      
      // Show share link panel
      setShowShareLink(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      setShareError(
        error.response?.data?.message || 
        'Failed to generate share link. Please try again.'
      );
    }
  };

  // Handle copy to clipboard
  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="new-badge-view">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading badge information...</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!badges || badges.length === 0) {
    return (
      <div className="new-badge-view">
        <Navbar />
        <div className="empty-state">
          <h2>No badges found</h2>
          <Link to="/badges" className="btn-return">Browse All Badges</Link>
        </div>
      </div>
    );
  }
  
  const currentBadge = badges[currentBadgeIndex];
  
  return (
    <div className="new-badge-view">
      <Navbar />
      
      <div className="badge-view-container">
        <div className="badge-view-header">
          <Link to="/badges" className="back-link">
            ← Back to Badges
          </Link>
        </div>
        
        <div className="badge-view-content">
          {/* Left Column - Badge Info */}
          <div className="badge-info-column">
            <h1 className="badge-title">{currentBadge.name}</h1>
            <div className="badge-difficulty">{currentBadge.difficulty}</div>
            <p className="badge-description">{currentBadge.description}</p>
            
            <div className="section">
              <h2 className="section-title">Required Skills</h2>
              <div className="skills-list">
                {currentBadge.skillsRequired?.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <div className="skill-icon"></div>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="section">
              <h2 className="section-title">Badge Details</h2>
              <div className="details-grid">
                <div className="detail-box">
                  <span className="detail-label">Category</span>
                  <div className="detail-value">{currentBadge.category}</div>
                </div>
                <div className="detail-box">
                  <span className="detail-label">Challenge</span>
                  <div className="detail-value">Active</div>
                </div>
                <div className="detail-box">
                  <span className="detail-label">Users Earned</span>
                  <div className="detail-value">43</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center Column - Badge Display */}
          <div className="badge-display-column">
            <button className="nav-button prev" onClick={() => 
              setCurrentBadgeIndex(prev => prev === 0 ? badges.length - 1 : prev - 1)
            }>
              ◄
            </button>
            
            <div className="badge-display">
              <div className="badge-image-container">
                <img src={currentBadge.image} alt={currentBadge.name} className="badge-image" />
                <div className="scan-line"></div>
              </div>
              
              <div className="badge-platform">
                <div className="platform-ring ring1"></div>
                <div className="platform-ring ring2"></div>
                <div className="platform-ring ring3"></div>
              </div>
              
              <div className="badge-level-info">
                <div className="level-item">
                  <span className="level-label">Level</span>
                  <span className="level-value">{difficultyToLevel[currentBadge.difficulty] || 'Amateur'}</span>
                </div>
                <div className="level-item">
                  <span className="level-label">Branch</span>
                  <span className="level-value">{currentBadge.category}</span>
                </div>
              </div>
            </div>
            
            <button className="nav-button next" onClick={() => 
              setCurrentBadgeIndex(prev => prev === badges.length - 1 ? 0 : prev + 1)
            }>
              ►
            </button>
          </div>
          
          {/* Right Column - Actions */}
          <div className="badge-actions-column">
            <h2 className="section-title">Badge Actions</h2>
            
            <div className="actions-container">
              <button className="action-button get-badge">
                <span className="action-icon">🏆</span>
                <span>Get this Badge</span>
              </button>
              
              <button 
                className="action-button share-badge" 
                onClick={generateShareLink}
              >
                <span className="action-icon">🔗</span>
                <span>Generate Share Link</span>
              </button>
              
              {shareError && (
                <div className="share-error">{shareError}</div>
              )}
              
              {showShareLink && shareLink && (
                <div className="share-panel">
                  <p>Share your badge achievement:</p>
                  <div className="share-input-group">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareLink} 
                      className="share-input" 
                    />
                    <button 
                      className="copy-button"
                      onClick={handleCopyLink}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="related-badges-section">
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
                      <img src={badge.image} alt={badge.name} className="related-badge-img" />
                      <span className="related-badge-name">{badge.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Badge Carousel */}
        <div className="badge-carousel">
          <div className="carousel-header">
            <h3>Badge Collection</h3>
            <span className="badge-count">{currentBadgeIndex + 1} / {badges.length}</span>
          </div>
          
          <div className="carousel-items">
            {badges.map((badge, index) => (
              <div 
                key={badge.id}
                className={`carousel-item ${index === currentBadgeIndex ? 'active' : ''}`}
                onClick={() => setCurrentBadgeIndex(index)}
              >
                <img src={badge.image} alt={badge.name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBadgeView;
