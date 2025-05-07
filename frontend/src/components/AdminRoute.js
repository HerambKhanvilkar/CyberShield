import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);
  
  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }
  
  // Check if user is authenticated and has admin privileges
  // If not, redirect to admin login page
  return isAuthenticated && user?.isAdmin ? children : <Navigate to="/admin/login" />;
};

export default AdminRoute;