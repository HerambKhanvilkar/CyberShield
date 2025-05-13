import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Navbar from "./Navbar";
import "./LoginPage.css";
import logo from "./logo.png";


const LoginPage = () => {
  const [identifier, setIdentifier] = useState(""); // Email
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Check for form validity
  useEffect(() => {
    // Login form validation
    if (!isSignup) {
      setFormValid(identifier.trim() !== "" && password.trim() !== "");
    } 
    // Signup form validation
    else {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const validFirstName = firstName.trim().length >= 3;
      const validLastName = lastName.trim().length >= 3;
      const validPassword = password.length >= 6;
      const passwordsMatch = password === confirmPassword;
      
      setFormValid(validEmail && validFirstName && validLastName && validPassword && passwordsMatch);
    }
  }, [identifier, firstName, lastName, email, password, confirmPassword, isSignup]);

// Check if already authenticated using AuthContext
const { isAuthenticated } = useContext(AuthContext);

useEffect(() => {
  if (isAuthenticated) {
    navigate("/");
  }
}, [isAuthenticated, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const url = isSignup ? `${process.env.REACT_APP_SERVER_URL}/signup` : `${process.env.REACT_APP_SERVER_URL}/login`;
      const data = isSignup 
        ? { email, firstName, lastName, password } 
        : { identifier, password };
  
      const response = await axios.post(url, data);
      
      // Extract token and user data
      const { token, user } = response.data;
      
      // Use the login function from context
      login(token, user);
      
      // Navigate to badges page
      setLoading(false);
      navigate("/badges");
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || "Something went wrong!";
      setError(errorMessage);
    }
  };

  // Swap between login and signup
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError(null);
    // Reset form fields
    setIdentifier("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-page">
      <Navbar />
      
      <div className="auth-container">
        <div className="auth-card glass-card">
          <div className="auth-logo">
            <img src={logo} alt="Logo" />
          </div>
          
          <h2 className="auth-title">{isSignup ? "Create Account" : "Welcome Back"}</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup ? (
              // Signup form fields
              <>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="FirstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    placeholder="Enter your First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="LastName">Last Name ( Optional )</label>
                  <input
                    type="text"
                    id="lastName"
                    placeholder="Enter your Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <small className="password-hint">
                    Password must be at least 6 characters
                  </small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              // Login form fields
              <>
                <div className="form-group">
                  <label htmlFor="identifier">Email</label>
                  <input
                    type="text"
                    id="identifier"
                    placeholder="Enter your email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="password-options">
                    <small className="forgot-password">
                      <a href="#">Forgot password?</a>
                    </small>
                  </div>
                </div>
              </>
            )}
            
            <button 
              type="submit" 
              className={`glass-button submit-button ${!formValid ? 'disabled' : ''}`}
              disabled={!formValid || loading}
            >
              {loading ? (
                <span className="loading-spinner-small"></span>
              ) : (
                isSignup ? "Create Account" : "Login"
              )}
            </button>
          </form>
          
          <div className="auth-toggle">
            <p>
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <button 
                type="button"
                className="toggle-button"
                onClick={toggleMode}
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
          
          <div className="back-home">
            <Link to="/">Back to Home</Link>
          </div>
        </div>
        
        <div className="auth-info glass-card">
          <h3>{isSignup ? "Join Our Community" : "Access Your Badges"}</h3>
          <p>
            {isSignup 
              ? "Create an account to track your progress, earn badges, and showcase your cybersecurity skills."
              : "Sign in to view your earned badges, check your progress, and continue your cybersecurity journey."
            }
          </p>
          
          <div className="benefits">
            <div className="benefit-item">
              <div className="benefit-icon">🏆</div>
              <div className="benefit-text">
                <h4>Earn Badges</h4>
                <p>Showcase your cybersecurity achievements</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">📊</div>
              <div className="benefit-text">
                <h4>Track Progress</h4>
                <p>Monitor your skills development</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">🔒</div>
              <div className="benefit-text">
                <h4>Secure Profile</h4>
                <p>Your data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
