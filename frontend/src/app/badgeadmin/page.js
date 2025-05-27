'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import React, { useState,useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
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

const TABS = ['Users', 'Import', 'Badges'];
const ITEMS_PER_PAGE = 10;

export default function SettingsPage() {
  const [searchResults, setSearchResults] = useState([]); // Initialize as an empty array
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Users');
  const [redirectCountdown, setRedirectCountdown] = useState(5); // 5-second timer
  const router = useRouter();

  // Page status
  const [currentPage, setCurrentPage] = useState(1);
  //Page specific values
  const totalPages = Math.ceil(100 / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const [userInfo, setUserInfo] = useState(null);
  const currentUsers = users;
  // const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
  const [data, setData] = useState([]);

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

      setData(response.data.data);
      toast.success('File uploaded successfully!'); // Success message
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
            <div className="flex-1">
              <SearchBox onSearch={handleSearch} />
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
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left: User List */}
            <div className="w-full md:w-1/3 bg-slate-800/60 rounded-lg p-2 border border-gray-700">
              <h2 className="text-white font-semibold mb-2">User List</h2>
              <ScrollArea className="h-[500px] pr-2 overflow-y-auto">
                <div className="flex flex-col space-y-2 w-full">
                  {Array.isArray(searchResults) && searchResults.length > 0 ? (
                    searchResults.map((user, index) => (
                      <UserBlock
                        key={index}
                        className="w-full"
                        data={user}
                        updateUserDetails={updateUserDetails}
                        onSelect={() => setSelectedUser(user)}
                      />
                    ))
                  ) : (
                    <p className="text-gray-400">No data available.</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: User Details (replace this with your final enhanced user details section) */}
            <div className="w-full md:w-2/3 bg-slate-800/60 rounded-lg p-4 border border-gray-700">
              {/* Mount your user details JSX here */}
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
                  { file ? ( 
                    <button  onClick={handleUpload} className="bg-blue-500 text-white text-sm px-4 py-1 rounded">
                      Upload CSV                    
                    </button>
                  ) : ( 
                    null
                  )}
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
             {data.length > 0 && (
                <table className="w-full text-sm text-left rtl:text-right text-gray-400 ">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">ID</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">First Name</th>
                            <th scope="col" className="px-6 py-3">Last Name</th>
                            <th scope="col" className="px-6 py-3">Badge IDs</th>
                            <th scope="col" className="sr-only">Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700" key={item._id}>
                                <td className="px-6 py-3">{item._id}</td>
                                <td className="px-6 py-3">{item.email}</td>
                                <td className="px-6 py-3">{item.firstName}</td>
                                <td className="px-6 py-3">{item.lastName}</td>
                                <td className="px-6 py-3">{item.badgeIds}</td>
                                <td className="px-6 py-3">
                                  <button className="font-medium text-blue-500 hover:underline">
                                    Edit
                                  </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
              </div>
          )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };


    // Simulate fetching user (replace this with your actual user fetching logic)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUserInfo(storedUser);
  }, []);

  // Countdown and redirect logic
  useEffect(() => {
    if (userInfo && (!userInfo.isAdmin || !userInfo)) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/');
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [userInfo]);

  // Show timer message if not admin
  if (userInfo && !userInfo.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
        <p>You will be redirected to the homepage in {redirectCountdown} seconds...</p>
      </div>
    );
  }

  // If still loading or no user yet, show loading
  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-full p-6">
        <div className="border-b border-gray-300 mb-2 flex flex-wrap gap-4 text-sm pt-2">
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
      <Footer />
    </>
  );
}
