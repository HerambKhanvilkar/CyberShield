import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import "./LoginPage.css"; // Reuse existing styles
import logo from "./logo.png";

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_URL}/login`, { 
        identifier, 
        password 
      });

      const user = response.data.user;
      
      // Check if user is admin
      if (!user.isAdmin) {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }

      // Store user session with admin flag
      localStorage.setItem("username", user.username);
      localStorage.setItem("isAdmin", "true");

      // Navigate to admin page
      setLoading(false);
      navigate("/admin/badges");
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || "Something went wrong!";
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      
      <div className="auth-container">
        <div className="auth-card glass-card">
          <div className="auth-logo">
            <img src={logo} alt="Logo" />
          </div>
          
          <h2 className="auth-title">Admin Login</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="identifier">Admin Username or Email</label>
              <input
                type="text"
                id="identifier"
                placeholder="Enter your admin username or email"
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
            </div>
            
            <button 
              type="submit" 
              className={`glass-button submit-button ${loading ? 'disabled' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner-small"></span>
              ) : (
                "Admin Login"
              )}
            </button>
          </form>
          
          <div className="back-home">
            <Link to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
