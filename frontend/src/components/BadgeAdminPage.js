import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./AllBadgesPage.css"; // Reuse existing styles
import SearchBox from "./SearchBox";
import Select from "react-select";

const BadgeAdminPage = () => {
  const [badges, setBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [isLoading, setIsLoading] = useState(true);
  const adminUsername = localStorage.getItem("username");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch badges
        const badgesResponse = await axios.get(`${process.env.REACT_APP_SERVER_URL}/badges`);
        setBadges(badgesResponse.data.badges);
        
        // Fetch users
        try {
        const token = localStorage.getItem("token");
          const usersResponse = await axios.get(                                                                                        
            `${process.env.REACT_APP_SERVER_URL}/users`,             
            {                                                                       
              headers: {                                                            
                Authorization: `Bearer ${token}`,                                   
                "Content-Type": "application/json",                                 
              },                                                                    
              // Add a timeout to abort requests that take too long                 
              timeout: 10000,                                                       
            }                                                                       
          );
          setUsers(usersResponse.data);
        } catch (userError) {
          console.error("Error fetching users:", userError);
          setMessage("Error loading users");
          setMessageType("error");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage("Error loading data");
        setMessageType("error");
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAssignBadge = async (e) => {
    e.preventDefault();
    
    // if (!selectedBadge || !selectedUser) {
    //   setMessage("Please select both a user and a badge");
    //   setMessageType("error");
    //   return;
    // }
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/assign-badge`,             
        {
          username: selectedUser,
          badgeId: parseInt(selectedBadge),
          adminUsername: adminUsername // Send admin username for verification
        },
        {                                                                       
          headers: {                                                            
            Authorization: `Bearer ${token}`,                                   
            "Content-Type": "application/json",                                 
          },                                                                    
          // Add a timeout to abort requests that take too long                 
          timeout: 10000,                                                       
        });
      
      setMessage(response.data.message);
      setMessageType("success");
      
      // Reset form
      setSelectedBadge("");
      setSelectedUser("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error assigning badge");
      setMessageType("error");
    }
  };

  const badgeOptions = badges.map(badge => ({
  value: badge.id,
  label: `${badge.name} (${badge.difficulty})`
}));

const darkThemeStyles = {
  control: (styles) => ({
    ...styles,
    backgroundColor: '#1A1A2E',
    borderColor: '#333',
    color: '#f1f1f1',
    borderRadius: '10px',
  }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    backgroundColor: isSelected ? '#252545' : isFocused ? '#2c2c48' : '#1A1A2E',
    color: '#f1f1f1',
    cursor: 'pointer'
  }),
  singleValue: (styles) => ({
    ...styles,
    color: '#f1f1f1',
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: '#1A1A2E',
    zIndex: 100
  }),
};


  return (
    <div className="badges-page">
      <div className="badges-container">
        <h1 className="page-title">Badge Administration</h1>
        <br/><br/><br/>
        <p className="page-subtitle">Assign badges to users</p>
        
        {message && (
          <div className={`message ${messageType} glass-card`}>
            {message}
          </div>
        )}
        
        {isLoading ? (
          <div className="loading-container glass-card">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <div className="admin-form glass-card">
            <h2>Assign Badge to User</h2>
            <form onSubmit={handleAssignBadge}>
              <div className="form-group">
                <label>Select User:</label>
                <SearchBox onUserSelect={(user) => setSelectedUser(user.username)} />
              </div>
              
              <div className="form-group">
                <label>Select Badge:</label>
                <Select
                  options={badgeOptions}
                  value={badgeOptions.find(option => option.value === selectedBadge)}
                  onChange={option => setSelectedBadge(option.value)}
                  styles={darkThemeStyles}
                />
              </div>
              
              <button type="submit" className="glass-button">
                Assign Badge
              </button>
            </form>
          </div>
        )}
        
        <Link to="/" className="glass-button back-button">Back to Home</Link>
      </div>
    </div>
  );
};

export default BadgeAdminPage;
