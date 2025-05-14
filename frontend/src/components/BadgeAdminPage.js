import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./AllBadgesPage.css"; // Reuse existing styles
import SearchBox from "./SearchBox";
import Select from "react-select";
import Navbar from "./Navbar";

const BadgeAdminPage = () => {
  const [badges, setBadges] = useState([]);
  const [assignableBadges, setAssignableBadges] = useState([]);
  const [revokableBadges, setRevokableBadges] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [selectedAssignBadge, setSelectedAssignBadge] = useState("");
  const [selectedRevokeBadge, setSelectedRevokeBadge] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [badgeAction, setBadgeAction] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [isLoading, setIsLoading] = useState(true);
  const adminUsername = localStorage.getItem("user");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch badges
        const badgesResponse = await axios.get(`${process.env.REACT_APP_SERVER_URL}/badges`);
        setBadges(badgesResponse.data.badges);
        setIsLoading(false);
      } catch (error) {
        setMessage("Error loading data");
        setMessageType("error");
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
  async function handleUserSelect() {
    setSelectedUser(userInfo.email);
        // Fetch users
        try {
          const e = selectedUser;
        const token = localStorage.getItem("token");
          
          const url = `${process.env.REACT_APP_SERVER_URL}/users`;
          const config = {                                                                       
              headers: {                                                            
                Authorization: `Bearer ${token}`,                                   
                "Content-Type": "application/json",                                 
              },                                                                    
              // Add a timeout to abort requests that take too long                 
              timeout: 10000,                                                       
              params: {
                email: e,
              }
          };
          const usersResponse = await axios.get(url, config)
          const userBadges = [];
          const notUserBadges = [];
          badges.forEach(bad => {
            const temp = usersResponse.data[0].badges.find(b => bad.id === b.badgeId)
            if(temp){
              userBadges.push(bad);
            } else {
              notUserBadges.push(bad);
            }
          });
          setAssignableBadges(notUserBadges);
          setRevokableBadges(userBadges);

          console.log("setRevokableBadges", revokableBadges);
          console.log("setRevokableBadges", userBadges);
          console.log("setAssignableBadges", assignableBadges);
          console.log("setAssignableBadges", notUserBadges);
        } catch (userError) {
          setMessage("Error loading users");
          setMessageType("error");
        }
    //console.log(e);
  }
    handleUserSelect();
  }, [userInfo]);

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
          email: selectedUser,
          badgeId: parseInt(selectedAssignBadge),
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
      setSelectedAssignBadge("");
      setSelectedUser(selectedUser);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error assigning badge");
      setMessageType("error");
      setSelectedAssignBadge("");
    }
  };

  const handleRevokeBadge = async (e) => {
    e.preventDefault();
    
    // if (!selectedBadge || !selectedUser) {
    //   setMessage("Please select both a user and a badge");
    //   setMessageType("error");
    //   return;
    // }
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/revoke-badge`,             
        {
          email: selectedUser,
          badgeId: parseInt(selectedRevokeBadge),
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
      setSelectedRevokeBadge("");
      setBadgeAction(true);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error assigning badge");
      setMessageType("error");
      setSelectedRevokeBadge("");
    }
  };


  const badgeOptionsAssign = assignableBadges.map(badge => ({
  value: badge.id,
  label: `${badge.name} (${badge.vertical})`
}));

  const badgeOptionsRevoke = revokableBadges.map(badge => ({
  value: badge.id,
  label: `${badge.name} (${badge.vertical})`
}));

const [editableFields, setEditableFields] = useState({
  firstName: false,
  lastName: false,
  password: false
});
const [editedUser, setEditedUser] = useState({});
const [hasChanges, setHasChanges] = useState(false);

const handleFieldChange = (field, value) => {
  setEditedUser(prev => ({ ...prev, [field]: value }));
  setHasChanges(true);
};

const toggleEdit = (field, action) => {
  setEditableFields(prev => ({
    ...prev,
    [field]: !prev[field]
  }));
  if (action === 'Cancel'){
    setHasChanges(
      editableFields["firstName"] ||
      editableFields["lastName"] ||
      editableFields["password"]
    )
  }
};

const handleSaveChanges = () => {
  // TODO: Save editedUser data to server
    try {
      setEditedUser(prev => ({ ...prev, ["email"]: userInfo.email }));
      console.log(editedUser);
      const token = localStorage.getItem("token");
      // console.log("alkdjflkajsd", editedUser);
      const response = 
        axios.post(
        `${process.env.REACT_APP_SERVER_URL}/user/info`,             
          {...editedUser, ["email"]: userInfo.email},
        {                                                                       
          headers: {                                                            
            Authorization: `Bearer ${token}`,                                   
            "Content-Type": "application/json",                                 
          },                                                                    
          // Add a timeout to abort requests that take too long                 
          timeout: 10000,                                                       
        });
      
      // setMessage(response.data.message);
      // setMessageType("success");
      
      // Reset form
      console.log("Save user changes:", editedUser);
      setHasChanges(false);
      setEditableFields({ firstName: false, lastName: false, email: false });
      setEditedUser({});
    } catch (error) {
      setMessage(error.response?.data?.message || "Error revoking badge");
      setMessageType("error");
    }
};

const darkThemeStyles = {
  control: (styles) => ({
    ...styles,
    backgroundColor: '#1A1A2E',
    borderColor: '#333',
    color: '#f1f1f1',
    borderRadius: '10px',
    zIndex: 100
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: '#1A1A2E',
    zIndex: 9999, // ensure it's above profile cards
    position: 'absolute'
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
};

  return (
    <div className="badges-page">
        <Navbar />
      <div className="badges-container">
        <h1 className="page-title">Badge Administration</h1>
        <br/><br/><br/>
        <p className="page-subtitle">Assign or Revoke badges. Edit user data.</p>
        
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
              <div className="form-group">
           <SearchBox 
              onUserSelect={(user) => setUserInfo(user)} 
          /> 
              </div>
              
            {selectedUser && (
              <div className="admin-form glass-card">
            <h2>Assign Badge to User</h2>
            <form>
              <div className="form-group">
                <label>Select Badge:</label>
           <Select options={badgeOptionsAssign} 
              value={badgeOptionsAssign.find( option => option.value === selectedAssignBadge) || ""} 
            onChange={option => setSelectedAssignBadge(option.value)} styles={darkThemeStyles} 
            /> 
              </div>
              
              <button type="submit" 
          onClick={handleAssignBadge}
          className="glass-button">
                Assign Badge
              </button>
            </form>

            <h2>Revoke Badge from User</h2>
            <form>
              <div className="form-group">
                <label>Select Badge:</label>
           <Select options={badgeOptionsRevoke} 
              value={badgeOptionsRevoke.find( option => option.value === selectedRevokeBadge) || ""} 
            onChange={option => setSelectedRevokeBadge(option.value)} styles={darkThemeStyles} 
            /> 
              </div>
              
              <button type="submit" 
          onClick={handleRevokeBadge}
          className="glass-button">
                Revoke Badge
              </button>
            </form>

            {/* Bottom Section: Profile View - Only shown if a user is selected */}
                <h2>User Profile</h2>
                <div className="">
              {/* <div className="profile-photo"> */}
                    {/* <img src={selectedUser?.photo} alt="Profile" /> */}
              {/* <img src={"https://png.pngtree.com/png-clipart/20210129/ourmid/pngtree-default-male-avatar-png-image_2811083.jpg"} alt="Profile" /> */}
              {/* </div> */}
                  <div className="profile-info">

                    {["firstName", "lastName"].map(field => (
                      <div key={field} className="">


                        {editableFields[field] ? (
                          <span> Change {field.replace(/^\w/, c => c.toUpperCase())} From: </span>
                        ) : (
                        <label>{field.replace(/^\w/, c => c.toUpperCase())}:</label>
                        )}

                          <input
                            type="text"
                            value={userInfo[field] ?? userInfo?.[field] ?? ""}
                      readOnly
                      disabled
                          />

                        {editableFields[field] ? (
                          <span> to:
                          <input
                            type="text"
                            value={editedUser[field] ?? selectedUser?.[field] ?? ""}
                            onChange={e => handleFieldChange(field, e.target.value)}
                          />
                          </span>

                        ) : (
                          <span>{editedUser[field] ?? selectedUser?.[field]}</span>
                        )}
                        <button
                          className="glass-button edit-btn"
                          onClick={() => toggleEdit(field, editableFields["password"] ? "Cancel" : "New")}
                        >
                          {editableFields[field] ? "Cancel" : "Edit"}
                        </button>
                      </div>
                    ))}

                      <div key="password" className="">

                        <label>Password</label>

                        {editableFields["password"] ? (
                          <span> :
                          <input
                            type="text"
                            value={editedUser["password"] ?? ""}
                            onChange={e => handleFieldChange("password", e.target.value)}
                          />
                          </span>

                        ) : (
                          <div>{editedUser["password"] ?? selectedUser?.["password"]}</div>
                        )}
                        <button
                          className="glass-button edit-btn"
                          onClick={() => toggleEdit("password", editableFields["password"] ? "Cancel" : "New")}
                        >
                          {editableFields["password"] ? "Cancel" : "New"}
                        </button>
                      </div>

                    {hasChanges && (
                      <div className="profile-actions">
                        <button className="glass-button save-button" onClick={handleSaveChanges}>
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            )}
          </div>
        )}
            <Link to="/" className="glass-button back-button">Back to Home</Link>
          </div>
      </div>
);
}
export default BadgeAdminPage;
