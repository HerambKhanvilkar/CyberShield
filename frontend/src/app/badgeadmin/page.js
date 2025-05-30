'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UsersPagination from '@/components/UsersPagination';
import UserBlock from '@/components/UserBlock';
import SearchBox from '@/components/SearchBox';
import { users } from '@/lib/data';
import Link from "next/link";
import axios from 'axios';
import { toast } from 'react-toastify';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import UserDetailsView from '@/components/UserDetailsView';
import BadgeCreationForm from '@/components/BadgeCreationForm';
import ErrorTable from '@/components/badgeAdminComponents/CsvDataTable';
import {UserPlus} from 'lucide-react';

const TABS = ['Users', 'Import', 'Badges'];
const ITEMS_PER_PAGE = 10;

export default function SettingsPage() {
  const [searchResults, setSearchResults] = useState([]); // Initialize as an empty array
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Users');
  const [usersData, setUsersData] = useState(users);

  // Page status
  const [currentPage, setCurrentPage] = useState(1);
  //Page specific values
  const totalPages = Math.ceil(100 / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const [userInfo, setUserInfo] = useState(null);
  const currentUsers = users;
  // const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNewUser = async (email, firstName, lastName, password) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No auth token found.");
        return;
      }

      const response = await axios.post(
        `${process.env.SERVER_URL}/user/create`,
        {
          email,
          firstName,
          lastName,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("User created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(
        error.response?.data?.message || "Failed to create user. Please try again."
      );
      return null;
    }
  };
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const handleOpenModal = () => setShowCreateUserModal(true);
  const handleCloseModal = () => {
    setShowCreateUserModal(false);
    setNewUserData({ email: '', firstName: '', lastName: '', password: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, firstName, lastName, password } = newUserData;
    if (!email || !firstName || !lastName || !password) {
      toast.error("Please fill all fields.");
      return;
    }

    const result = await handleNewUser(email, firstName, lastName, password);
    if (result) {
      handleCloseModal();
      // Optionally refresh user list or add the new user to state
    }
  };

  const handleSearch = (data) => {
    // Ensure data is an array before setting it
    setSearchResults(Array.isArray(data)  ? data : []);
  };

  const updateUserDetails = (email, updatedUser) => {
    setUsers(prev =>
      prev.map(user => (user.email === email ? updatedUser : user))
    );
  };

  const handleDownload = async () => {
    const apiUrl = process.env.SERVER_URL + '/users/sample';
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(apiUrl, {
              responseType: 'blob', // Important for handling binary data
              headers: {
                  Authorization: `Bearer ${token}`, // Add the token to the headers
              },
          });

          const url = window.URL.createObjectURL(new Blob([response.data])); // Create a URL for the Blob
          toast.success("Sample CVS downloaded!");
          const a = document.createElement('a'); // Create an anchor element
          a.style.display = 'none';
          a.href = url;
          a.download = 'users_sample_data.csv'; // Set the file name
          document.body.appendChild(a); // Append the anchor to the body
          a.click(); // Programmatically click the anchor to trigger the download
          window.URL.revokeObjectURL(url); // Clean up the URL object
          document.body.removeChild(a); // Remove the anchor from the document
      } catch (error) {
          console.error('There was a problem with the download operation:', error);
          toast.error("Something went wrong!");
      }
    }

  // File Upload Code
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [data, setData] = useState({});

  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // Get the selected file
  };

  const handleUpload = async () => {
    const apiUrl = process.env.SERVER_URL + '/users/import';
    const token = localStorage.getItem("accessToken");

    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Append the file to the FormData object

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      setData(response.data);
      toast.success('File uploaded successfully!'); // Success message
    } catch (error) {
      console.error('There was a problem with the upload operation:', error);
      toast.error('Error uploading file.'); // Error message
    }
  };

  const handlePreviewCSV = async () => {
    const apiUrl = process.env.SERVER_URL + '/users/import/preview';
    const token = localStorage.getItem("accessToken");

    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Append the file to the FormData object

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      setData(response.data);
      toast.success('Preview Loaded successfully!'); // Success message
    } catch (error) {
      console.error('There was a problem with the upload operation:', error);
      toast.error('Error uploading file.'); // Error message
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Users':
        return (
          <div className="p-4 rounded-xl bg-slate-900/60 backdrop-blur-xl shadow-lg border border-gray-700">
          {/* Top Row: Search + Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div className="flex flex-row items-center gap-4">
              <SearchBox onSearch={handleSearch} />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                onClick={handleOpenModal}
              >
                <UserPlus/>
              </button>
            </div>
            <div className="flex-none">
              <UsersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          {/* Main Content: Left = User List | Right = User Details */}
          <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)]">
            {/* Left: User List */}
            <div className="w-full md:w-1/3 bg-slate-800/60 rounded-lg p-2 border border-gray-700 flex flex-col">
              <h2 className="text-white font-semibold mb-2">User List</h2>
              <ScrollArea className="flex-1 overflow-y-auto pr-2">
                <div className="flex flex-col space-y-2 w-full">
                  {Array.isArray(searchResults) && searchResults.length > 0 ? (
                    searchResults.map((user, index) => (
                      <UserBlock
                        key={index}
                        className="w-full"
                        data={user}
                        updateUserDetails={updateUserDetails}
                        onSelect={async () => {
                          try {
                            const token = localStorage.getItem("token");
                            if (!token) return toast.error("No token found!");

                            const badgesRes = await axios.get(`${process.env.SERVER_URL}/badges`, {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            });

                            const allBadges = badgesRes.data.badges;
                            const badgeMap = {};
                            allBadges.forEach((badge) => {
                              badgeMap[badge.id] = badge;
                            });

                            const enrichedUser = {
                              ...user,
                              badges: (user.badges || []).map((b) => ({
                                ...badgeMap[b.badgeId],
                                badgeId: b.badgeId,
                                earnedDate: b.earnedDate,
                              })),
                            };

                            setSelectedUser(enrichedUser);
                          } catch (err) {
                            console.error("Error enriching user badges:", err);
                            toast.error("Failed to enrich badge details");
                          }
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-gray-400">No data available.</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: User Details */}
            <div className="w-full md:w-2/3 bg-slate-800/60 rounded-lg p-4 border border-gray-700 overflow-auto">
              <UserDetailsView selectedUser={selectedUser} updateUserDetails={updateUserDetails} />
            </div>
          </div>
        </div>

        );
      case 'Badges':
        return (
          <BadgeCreationForm />
        );
      case 'Import':
        return (
          <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
            {/* Left side - Description and buttons */}
            <div className="flex flex-col justify-between space-y-4 lg:max-w-sm">
              <div>

          <label className="block mb-2 text-sm font-medium text-white-900" for="file_input">Select file</label>
          <Input
          aria-describedby="file_input_help" 
          placeholder="foobar"
          type="file" 
          accept=".csv" 
          id="file_input"
          onChange={handleFileChange} />
          <p className="mt-1 text-sm text-gray-300" id="file_input_help">CSV (MAX. 10MB).</p>
              </div>
              <div className="space-x-2">
                <button className="bg-green-700 text-white text-sm px-4 py-1 rounded"
                  onClick={handleDownload}
                >
                  Download Template
                </button>
              </div>
            </div>

            {/* Right side - CSV Preview Card */}
            <div className="flex-1">
          { !file ? (
              <div className="w-full h-64 border border-dashed border-gray-400 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                Select a File to preview.
              </div>
          ) : (
              <div className="relative scrollable shadow-md sm:rounded-lg h-full border-green-50 border-solid rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
             {data.errors && (
               <ErrorTable data={data} />
            )}
              </div>
          )}
          <div >
                  { file ? ( 
                    <button  onClick={handlePreviewCSV} className="bg-blue-500 text-white text-sm px-4 py-1 rounded">
                      Preview CSV                    
                    </button>
                  ) : ( 
                    null
                  )}
          </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-full p-6 pb-0 pt-2">
        <div className="border-b border-gray-300 mb-6 flex flex-wrap gap-4 text-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`pb-2 ${
                activeTab === tab
                  ? 'border-b-2 border-black font-semibold'
                  : 'text-gray-500 hover:text-black'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>{renderTabContent()}</div>
      </div>
        {/* User creation Modal Popup */}
        {showCreateUserModal && (
          <>
            {/* Backdrop with blur */}
            <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm"></div>

            {/* Modal box */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <h2 className="text-white text-xl font-semibold mb-4">Create New User</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={newUserData.email}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />
                  <input
                    name="firstName"
                    type="text"
                    placeholder="First Name"
                    value={newUserData.firstName}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />
                  <input
                    name="lastName"
                    type="text"
                    placeholder="Last Name"
                    value={newUserData.lastName}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={newUserData.password}
                    onChange={handleInputChange}
                    className="p-2 rounded bg-slate-800 text-white border border-gray-700"
                    required
                  />

                  <div className="flex justify-end gap-4 mt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

      <Footer />
    </>
  );
}
