import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import AssignBadgePopUp from "@/components/AssignBadgePopUp";
import RevokeBadgePopUp from "@/components/RevokeBadgePopUp";
import DeleteUserPopUp from "@/components/DeleteUserPopUp";
import { MinusCircle } from 'lucide-react';


function EditableField({ label, value, onChange }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mb-4 group">
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
    if (selectedUser) {
      setForm({
        firstName: selectedUser.firstName || "",
        lastName: selectedUser.lastName || "",
        email: selectedUser.email || "",
        password: "",
        sendMail: false, // Default to false
      });
      console.log("Selected user:", selectedUser);
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
    const [setUsers] = useState(false);

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

    updateUserDetails(userEmail, response.data.user);

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
      <div className="grid grid-cols-3 gap-4 mb-3">
        <EditableField label="First Name" value={form.firstName} onChange={(val) => handleChange("firstName", val)} />
        <EditableField label="Last Name" value={form.lastName} onChange={(val) => handleChange("lastName", val)} />
        <EditableField label="Email" value={form.email} onChange={(val) => handleChange("email", val)} />

        <div className="flex items-center space-x-2 relative">
          <EditableField
            label="Password"
            value={form.password}
            onChange={(val) => handleChange("password", val)}
            className="flex-1"
          />

          <div className="relative group">
            <input
              type="checkbox"
              checked={form.sendMail}
              onChange={(e) => handleChange("sendMail", e.target.checked)}
              className="form-checkbox text-blue-500"
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-black text-white text-xs px-2 py-1 rounded shadow-md z-10">
              Send mail to user
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row mb-6 mr-2">
        <div className="flex flex-col w-1/2 items-start justify-start mb-2">
          <div className="flex flex-row gap-4">
            <AssignBadgePopUp user={selectedUser} updateUserDetails={updateUserDetails} />
            <RevokeBadgePopUp user={selectedUser} updateUserDetails={updateUserDetails} />
          </div>
          <div className="flex flex-row mt-2">
            <DeleteUserPopUp user={selectedUser} updateUserDetails={updateUserDetails} />
          </div>
        </div>

        {/* show badges */}
        <div className="w-1/2 mt-6">
  <h3 className="text-lg font-semibold mb-2">Badges</h3>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {selectedUser.badges && selectedUser.badges.length > 0 ? (
      selectedUser.badges.map((badge, index) => (
        <div key={index} className="relative flex flex-col items-center bg-[#1A1B2E] p-4 rounded-lg">
          {/* Minus button top-right */}
          <button
            onClick={() => handleRevokeBadge(badge.badgeId, selectedUser.email, updateUserDetails)}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700"
            title="Revoke badge"
          >
            <MinusCircle size={18} />
          </button>

          {/* Badge image and name */}
          <img
            src={`./images/img${badge.badgeId}.png`}
            alt={`Badge ${badge.badgeId}`}
            className="w-16 h-16 mb-2"
          />
          <span className="text-sm font-medium text-center">{badge.name}</span>
        </div>
      ))
    ) : (
      <p className="text-gray-400 col-span-full">No badges assigned.</p>
    )}
  </div>
</div>

      </div>
        
      <br/>
      <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 transition-colors"
      >
        Save Changes
      </button>
    </div>
  );
}

export default UserDetailsView;
