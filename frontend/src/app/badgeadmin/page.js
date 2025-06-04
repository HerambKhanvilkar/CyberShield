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
import ImportPage from '@/components/ImportData/ImportPage';
import {UserPlus} from 'lucide-react';

const TABS = ['Users', 'Import', 'Badges'];
const ITEMS_PER_PAGE = 10;

export default function SettingsPage() {
  const [searchResults, setSearchResults] = useState([]); // Initialize as an empty array
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Badges');
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Users':
        return (
          <div className="p-4 rounded-xl bg-slate-900/60 backdrop-blur-xl shadow-lg border border-gray-700">
          {/* Top Row: Search + Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
            <div className="flex items-center gap-4">
              <SearchBox onSearch={handleSearch} className="h-10" />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors h-10 flex items-center justify-center"
                onClick={() => setSelectedUser('new')}
              >
                <UserPlus />
              </button>
            </div>
            <div className="flex-none">
          { /* <UsersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              */}
            </div>
          </div>

          {/* Main Content: Left = User List | Right = User Details */}
          <div className="flex flex-col md:flex-row gap-4 h-full md:h-[calc(100vh-200px)]">
            {/* Left: User List */}
            <div className="w-full md:w-1/3 bg-slate-800/60 rounded-lg p-2 border border-gray-700 flex flex-col max-h-[200px] md:max-h-none">
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
            <div className="w-full md:w-2/3 bg-slate-800/60 rounded-lg p-4 border border-gray-700 overflow-auto ">
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
          <ImportPage />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-full p-3 pb-0 pt-2">
        <div className="mb-4 border-b border-gray-700">
    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          {TABS.map((tab, index) => (
            <li key={index} className="me-2 inline-block px-2 md:px-4 rounded-lg">
            <button
              key={tab}
            className={`inline-block p-2 md:px-4 rounded-t-lg ${
                activeTab === tab
                  ? 'text-[#B9D9EB] border-b-2 border-[#B9D9EB]'
                  : 'text-gray-400 hover:border-gray-300 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
            </li>
          ))}
    </ul>
        </div>

        <div>{renderTabContent()}</div>
      </div>
        {/* User creation Modal Popup */}
        {showCreateUserModal && (
          <>
            {/* Backdrop with blur */}
            <div className="fixed inset-0 z-50 bg-opacity-40 backdrop-blur-md"></div>

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
