import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import { Shield, Award, CheckCircle, ArrowRight } from 'lucide-react';
import './HolographicBadgeDisplay.css';

const SharedBadgePage = () => {
  const { id, username, timestamp } = useParams();
  const [badge, setBadge] = useState(null);
  const [user, setUser] = useState("");
  const [issuerData, setIssuerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  
  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch badge details
        const badgeResponse = await axios.get(`${process.env.REACT_APP_SERVER_URL}/badge/${id}`);
        setBadge(badgeResponse.data);
        
        // Static issuer data
        setIssuerData({
          name: "CyberBadge Academy",
          logo: "/logo.png",
          website: "https://cyberbadge.example.com"
        });
        
        // Optional: Verify badge authenticity
        try {
          const verifyResponse = await axios.get(
            `${process.env.REACT_APP_SERVER_URL}/verify-badge/${id}/${username}/${timestamp}`
          );
          setVerificationStatus(verifyResponse.data.verified);
          setUser(verifyResponse.data.firstName + " " + verifyResponse.data.lastName);
        } catch (verifyError) {
          console.error("Verification error:", verifyError);
          setVerificationStatus(false);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching badge:", err);
        setError("Failed to load badge information. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchBadgeData();
  }, [id, username, timestamp]);
  
  // Format date from timestamp
  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };
  
  // Verification render helper
  const renderVerificationStatus = () => {
    if (verificationStatus === null) {
      return (
        <div className="verification-status verifying">
          <span>Verifying badge...</span>
        </div>
      );
    }
    
    return (
      <div className={`verification-status ${verificationStatus ? 'verified' : 'unverified'}`}>
        {verificationStatus ? (
          <>
            <CheckCircle color="green" />
            <span>Badge Verified</span>
          </>
        ) : (
          <>
            <Shield color="red" />
            <span>Unable to Verify Badge</span>
          </>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="badge-view-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading verification details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !badge) {
    return (
      <div className="badge-view-page">
        <div className="container" style={{textAlign: 'center', padding: '50px 20px'}}>
          <div className="glass-card" style={{maxWidth: '600px', margin: '0 auto', padding: '30px'}}>
            <h2 className="neon-text">Badge Not Found</h2>
            <p>{error || "The shared badge could not be found or verified."}</p>
            <Link to="/badges" className="glass-button">
              Explore All Badges
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="badge-view-page">
      
      <div className="shared-badge-container" style={{maxWidth: '1000px', margin: '20px auto', padding: '0 20px'}}>
        {/* Verification Header */}
        <div className="verification-header glass-card" style={{
          padding: '15px 25px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={24} />
            </div>
            <div>
              <p style={{margin: '0'}}>
                This badge was issued to <strong>{user}</strong> on {formatDate(timestamp)}
              </p>
            </div>
          </div>
          
          <div className="verification-actions">
            {renderVerificationStatus()}
          </div>
        </div>
        
        {/* Badge Content */}
        <div className="badge-content glass-card" style={{padding: '30px'}}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '350px 1fr',
            gap: '30px'
          }}>
            {/* Badge Image */}
            <div className="badge-image-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              <div style={{
                maxWidth: '300px',
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <img 
                  src={badge.image} 
                  alt={badge.name} 
                  style={{
                    width: '100%',
                    display: 'block'
                  }}
                />
              </div>
            </div>
            
            {/* Badge Details */}
            <div className="badge-details">
              <div style={{
                marginBottom: '20px',
                color: 'rgba(255,255,255,0.7)'
              }}>
                Badge issued to <strong>{user}</strong> on {formatDate(timestamp)}
              </div>

              <h1 style={{
                fontSize: '2.2rem',
                marginTop: '0',
                marginBottom: '15px',
                color: '#00d4ff'
              }}>{badge.name}</h1>
              
              <div style={{marginBottom: '20px'}}>
                <p style={{margin: '0'}}>
                  Issued by <a href="#" style={{color: '#00d4ff', textDecoration: 'none'}}>{issuerData.name}</a>
                </p>
              </div>
              
              <div style={{marginBottom: '30px', lineHeight: '1.6'}}>
                <p>
                  {issuerData.name} verifies the earner of this badge successfully completed the {badge.name} course. 
                  The holder of this {badge.difficulty}-level credential has knowledge of cybersecurity,
                  including the implications of cyber threats, vulnerabilities and defense strategies.
                </p>
                <p>
                  {badge.description}
                </p>
              </div>
              
              <div style={{marginBottom: '30px'}}>
                <h2 style={{
                  fontSize: '1.3rem',
                  marginBottom: '15px',
                  color: '#00d4ff'
                }}>Skills</h2>
                
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  {badge.skillsEarned?.map((skill, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '0.9rem'
                    }}>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 style={{
                  fontSize: '1.3rem',
                  marginBottom: '15px',
                  color: '#00d4ff'
                }}>Earning Criteria</h2>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle size={20} style={{color: '#00d4ff'}} />
                  <span>Passing score on {badge.category} level assessment in cybersecurity challenges.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <Link to={`/badge-view/${badge.id}`} className="glass-button">
            View in 3D Gallery
          </Link>
          <Link to="/badges" className="glass-button">
            Explore All Badges
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedBadgePage;
