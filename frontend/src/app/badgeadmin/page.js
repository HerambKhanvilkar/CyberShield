'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import React, { useState } from 'react';
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

const TABS = ['Users', 'Import', 'Badges', 'bar'];
const ITEMS_PER_PAGE = 10;

export default function SettingsPage() {
  const [searchResults, setSearchResults] = useState([]); // Initialize as an empty array

  const [activeTab, setActiveTab] = useState('Import');

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

  
  const updateUserDetails = (email, newUser) => {
    console.log("updateUserDetails", email, newUser);
      setSearchResults((prevUsers) =>
        prevUsers.map((user) =>
          user.email === email ? newUser : user
        )
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
          <div className="">
            <div className="md:flex md:justify-end rounded-xl shadow-lg hover:shadow-xl">
            <SearchBox onSearch={handleSearch}  />
            <UsersPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            </div>
            <ScrollArea className="h-[350px] pr-4">
            { Array.isArray(searchResults) && searchResults.length > 0 ? (
              searchResults.map((user, index) => (
              <UserBlock key={index} className="block" data={user} updateUserDetails={updateUserDetails}/>
              ))
            ) : (
              <p>No data available.</p>
            )}
            </ScrollArea>
          </div>
        );
      case 'Members':
        return (<p className="text-gray-600">Integration settings go here...</p>);
      case 'Badges':
        return (
          <p className="text-gray-600">Billing information goes here...</p>
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
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">CSV (MAX. 10MB).</p>

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

  return (
    <>
      <Navbar />
      <div className="min-h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Admin</h1>

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
      <Footer />
    </>
  );
}
