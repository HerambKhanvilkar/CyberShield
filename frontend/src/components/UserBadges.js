import React from "react";
import "./UserBadges.css";

// Difficulty color mapping
const difficultyColors = {
  "Easy": "#4CAF50",
  "Medium": "#2196F3",
  "Hard": "#FF9800",
  "Expert": "#9C27B0",
  "Extreme": "#F44336"
};

const UserBadges = ({ 
  badges, 
  size = "medium", 
  showDates = true,
  showDetails = true,
  clickable = false,
  onBadgeClick = () => {},
  badgeActions = null // New prop for badge actions
}) => {
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate how long ago a badge was earned
  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    
    const earned = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - earned);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Handle empty badges array
  if (!badges || badges.length === 0) {
    return (
      <div className="no-badges glass-card">
        <div className="empty-badge-icon">🏆</div>
        <h3>No badges earned yet</h3>
        <p>Complete challenges and activities to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className={`user-badges-grid ${size}`}>
      {badges.map((badge) => (
        <div 
          key={badge.id} 
          className={`badge-item glass-card ${clickable ? 'clickable' : ''}`}
          onClick={clickable ? () => onBadgeClick(badge) : undefined}
        >
          <div className="badge-item-top">
            {badge.difficulty && (
              <span 
                className="badge-difficulty-tag"
                style={{
                  backgroundColor: difficultyColors[badge.difficulty] || difficultyColors.Medium
                }}
              >
                {badge.difficulty}
              </span>
            )}
            
            <div className="badge-image-container">
              <img 
                src={badge.image} 
                alt={badge.name} 
                className="badge-image" 
              />
            </div>

            <h3 className="badge-name">{badge.name}</h3>
            
            {badge.description && showDetails && (
              <p className="badge-description">{badge.description}</p>
            )}
          </div>
          
          {showDates && badge.earnedDate && (
            <div className="badge-earned-info">
              <span className="earned-date">
                {formatDate(badge.earnedDate)}
              </span>
              <span className="earned-ago">
                {getTimeAgo(badge.earnedDate)}
              </span>
            </div>
          )}
          
          {/* New section for badge actions */}
          {badgeActions && (
            <div className="badge-actions">
              {badgeActions(badge)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserBadges;