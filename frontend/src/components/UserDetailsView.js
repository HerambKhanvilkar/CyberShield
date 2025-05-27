import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import AssignBadgePopUp from "@/components/AssignBadgePopUp";
import RevokeBadgePopUp from "@/components/RevokeBadgePopUp";
import DeleteUserPopUp from "@/components/DeleteUserPopUp";

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

  if (!selectedUser) {
    return <p className="text-gray-400">Select a user to view details.</p>;
  }

  return (
    <div className="text-white">
      <h2 className="text-xl font-bold mb-4">User Details</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <EditableField label="First Name" value={form.firstName} onChange={(val) => handleChange("firstName", val)} />
        <EditableField label="Last Name" value={form.lastName} onChange={(val) => handleChange("lastName", val)} />
        <EditableField label="Email" value={form.email} onChange={(val) => handleChange("email", val)} />
        <EditableField label="Password" value={form.password} onChange={(val) => handleChange("password", val)} />
      </div>
      <div className="flex mb-6 mr-2">
        <div className="flex w-1/3 items-center justify-start mb-2">
          <AssignBadgePopUp user={selectedUser} updateUserDetails={updateUserDetails} />
          <RevokeBadgePopUp user={selectedUser} updateUserDetails={updateUserDetails} />
          <DeleteUserPopUp user={selectedUser} updateUserDetails={updateUserDetails} />
        </div>
        <div className="w-2/3 mt-6">
          <h3 className="text-lg font-semibold mb-2">Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedUser.badges && selectedUser.badges.length > 0 ? (
              selectedUser.badges.map((badge, index) => (
                <div key={index} className="flex flex-col items-center bg-[#1A1B2E] p-4 rounded-lg">
                <img src={`./images/img${badge.badgeId}.png`} alt={`Badge ${badge.badgeId}`} className="w-16 h-16 mb-2" />
                  <span className="text-sm font-medium">{badge.name}</span>
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
