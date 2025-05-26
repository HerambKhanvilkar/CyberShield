// components/UserDetailsView.js
import React, { useState } from "react";
import { Pencil } from "lucide-react";

function EditableField({ label, value, onChange }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full p-2 pr-10 rounded bg-[#1A1B2E] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${!editing ? "cursor-not-allowed bg-opacity-70" : ""}`}
          value={value}
          disabled={!editing}
          onChange={(e) => onChange(e.target.value)}
        />
        <Pencil
          className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer"
          onClick={() => setEditing(!editing)}
        />
      </div>
    </div>
  );
}

function UserDetailsView({ selectedUser, updateUserDetails }) {
  const [form, setForm] = useState({
    firstName: selectedUser?.firstName || "",
    lastName: selectedUser?.lastName || "",
    email: selectedUser?.email || "",
    password: "",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateUserDetails({ ...selectedUser, ...form });
  };

  if (!selectedUser) {
    return <p className="text-gray-400">Select a user to view details.</p>;
  }

  return (
    <div className="text-white">
      <h2 className="text-xl font-bold mb-4">User Details</h2>
      <EditableField label="First Name" value={form.firstName} onChange={(val) => handleChange("firstName", val)} />
      <EditableField label="Last Name" value={form.lastName} onChange={(val) => handleChange("lastName", val)} />
      <EditableField label="Email" value={form.email} onChange={(val) => handleChange("email", val)} />
      <EditableField label="Password" value={form.password} onChange={(val) => handleChange("password", val)} />

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
