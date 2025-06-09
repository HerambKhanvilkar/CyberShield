import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import AssignBadgePopUp from "@/components/AssignBadgePopUp";
import RevokeBadgePopUp from "@/components/RevokeBadgePopUp";
import Achievements from "@/components/Achievements";
import Courses from "@/components/Courses";
import DeleteUserPopUp from "@/components/DeleteUserPopUp";
import { MinusCircle } from 'lucide-react';


function EditableField({ label, value, onChange, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [setUsers] = useState(false);
  return (
    <div className="`mb-4 group ${className}`">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full p-2 pr-10 rounded border focus:outline-none transition-all duration-200
            ${
              editing
                ? "bg-[#1A1B2E] text-white border-cyan-500 ring-2 ring-cyan-500"
                : "bg-[#1A1B2E]/60 text-gray-400 border-gray-600 cursor-not-allowed"
            }`}
          value={value}
          disabled={!editing}
          onChange={(e) => editing && onChange(e.target.value)}
        />
        <Pencil
          className={`absolute right-3 top-2.5 h-4 w-4 transition-colors duration-200 cursor-pointer
            ${editing ? "text-cyan-500" : "text-gray-400 group-hover:text-white"}`}
          onClick={() => setEditing((prev) => !prev)}
          title={editing ? "Disable editing" : "Enable editing"}
        />
      </div>
    </div>
  );
}

function UserDetailsView({ selectedUser, updateUserDetails }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (typeof(selectedUser) == typeof('new')){
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        sendMail: false, // Default to false
      });
    } else if (selectedUser) {
      setForm({
        firstName: selectedUser.firstName || "",
        lastName: selectedUser.lastName || "",
        email: selectedUser.email || "",
        password: "",
        sendMail: false, // Default to false
      });
    } else {
    }
  }, [selectedUser]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.SERVER_URL}/user/info`;

      // Prepare request body with changed fields only
      const body = { email: form.email };
      if (form.firstName.trim()) body.firstName = form.firstName;
      if (form.lastName.trim()) body.lastName = form.lastName;
      if (form.password.trim()) body.password = form.password;

      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      const updatedUser = response.data.user;

      updateUserDetails(form.email, updatedUser); // Let parent know
      toast.success(
        <div>
          Updated user <strong style={{ color: "#00CBF0" }}>{updatedUser.firstName}</strong>!
        </div>
      );

      // Reset password after saving for safety
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user.");
    }
  };

  const handleRevokeBadge = async (badgeId, userEmail, updateUserDetails) => {
  try {
    const token = localStorage.getItem("token");
    const url = `${process.env.SERVER_URL}/revoke-badge`;


    const response = await axios.post(
      url,
      {
        email: userEmail,
        badgeId: badgeId
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    // Update user details in parent component
    // updateUserDetails(userEmail, response.data.user);

    toast.success(
      <div>
        Badge revoked from <strong style={{ color: '#00CBF0' }}>{response.data.user.firstName}</strong>!
      </div>
    );
  } catch (error) {
    console.error("Error revoking badge:", error);
    toast.error("Failed to revoke badge.");
  }
};

  if (!selectedUser) {
    return <p className="text-gray-400">Select a user to view details.</p>;
  }

  return (
    <div className="text-white">
      <h2 className="text-xl font-bold mb-4">User Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-8 mb-3">
        <EditableField label="First Name" value={form.firstName} onChange={(val) => handleChange("firstName", val)} />
        <EditableField label="Last Name" value={form.lastName} onChange={(val) => handleChange("lastName", val)} />
        <EditableField label="Email" value={form.email} onChange={(val) => handleChange("email", val)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full items-start md:items-center">
        {/* Password field with checkbox */}
        <div className="flex flex-col w-full">
          <EditableField
            label="Password"
            value={form.password}
            onChange={(val) => handleChange("password", val)}
            className="flex"
          />
          <label className="checkbox-wrapper mt-3">
  <input
    id="send-mail-checkbox"
    type="checkbox"
    checked={form.sendMail}
    onChange={(e) => handleChange("sendMail", e.target.checked)}
    name="sendMail"
  />
  <span className="terms-label">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 200 200"
      className="checkbox-svg"
    >
      <mask fill="white" id="checkbox-mask">
        <rect height="200" width="200" />
      </mask>
      <rect
        mask="url(#checkbox-mask)"
        strokeWidth="40"
        className="checkbox-box"
        height="200"
        width="200"
      />
      <path
        strokeWidth="15"
        d="M52 111.018L76.9867 136L149 64"
        className="checkbox-tick"
      />
    </svg>
    <span className="label-text text-sm">Send mail to user</span>
  </span>
</label>

        </div>

        {/* Badge actions */}
        <AssignBadgePopUp user={selectedUser} updateUserDetails={updateUserDetails} />
        <RevokeBadgePopUp user={selectedUser} updateUserDetails={updateUserDetails} />
      </div>

      <div className="w-full flex flex-col lg:flex-row mt-2 gap-4">
        <div className="flex flex-col w-full lg:w-1/2 gap-4 items-start justify-start">
          <Achievements
            achievements={selectedUser.achievements}
            user={selectedUser}
            updateUserDetails={updateUserDetails}/>
          <Courses
          courses={selectedUser.courses}
          user={selectedUser}
          updateUserDetails={updateUserDetails} />
        </div>

        {/* show badges */}
        <div className="flex flex-col w-full lg:w-1/2 items-start justify-start mb-6">
          <h3 className="text-xl font-bold text-white mb-4 border-b border-blue-500 pb-1 tracking-wide">
            Assigned Badges
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 mx-auto w-full">
            {selectedUser.badges && selectedUser.badges.length > 0 ? (
              selectedUser.badges.map((badge, index) => (
                <div
                  key={index}
                  className="relative flex flex-col items-center justify-center p-4 transition-transform hover:scale-105"
                >
                  {/* Revoke Button */}
                  <button
                    onClick={() =>
                      handleRevokeBadge(badge.badgeId, selectedUser.email, updateUserDetails)
                    }
                    className="absolute top-1 right-5 text-pink-400 hover:text-red-500 transition-colors z-10"
                    title="Revoke badge"
                  >
                    <MinusCircle size={18} />
                  </button>

                  {/* Badge Image with glow effect on hover */}
                  <div className="group relative">
                    <img
                      crossOrigin="anonymous"
                      src={`${process.env.SERVER_URL}/badge/images/${badge.badgeId}` || badge.img?.data}
                      alt={`Badge ${badge.name || badge.badgeId}`}
                      className="w-16 h-16 rounded-full transition-all duration-300 drop-shadow-md group-hover:drop-shadow-[0_0_10px_rgba(56,200,248,0.8)]"
                    />
                  </div>

                  {/* Badge Name */}
                  <span className="text-sm text-gray-200 mt-2 text-center">
                    {badge.name || "Unnamed Badge"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 col-span-full text-center text-sm italic">
                No badges assigned.
              </p>
            )}
          </div>
        </div>
      </div>
        
      <br/>
      <button
        onClick={handleSave}
        className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 transition-colors"
      >
        Save Changes
      </button>
      <DeleteUserPopUp user={selectedUser} updateUserDetails={updateUserDetails} />
    </div>
  );
}

export default UserDetailsView;
