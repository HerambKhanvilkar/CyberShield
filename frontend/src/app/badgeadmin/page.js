'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import React, { useState, useRef } from 'react';
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

  const [activeTab, setActiveTab] = useState('Badges');

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

  const [isSkillsDropDownOpen, setIsSkillsDropDownOpen] = useState(false);
  const [isVerticalsDropDownOpen, setIsVerticalsDropDownOpen] = useState(false);
  const dropDownInputRef = useRef(null);

  const handleSkillsDropDownToggle = () => {
    setIsSkillsDropDownOpen(!isSkillsDropDownOpen);
  }

  const handleVerticalsDropDownToggle = () => {
    setIsVerticalsDropDownOpen(!isVerticalsDropDownOpen);
  }

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
          <div>
            <form className="max-w-md mx-auto">
  <div className="grid md:grid-cols-2 md:gap-6">
    <div className="relative z-0 w-full mb-5 group">
        <input 
          type="text" 
          name="id" 
          id="id" 
                      className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 peer" 
          placeholder=" " required />
        <label 
          for="id" 
                      className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
          Badge ID
          </label>
    </div>
    <div className="relative z-0 w-full mb-5 group">
        <input 
          type="text" 
          name="name" 
          id="name" 
                      className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 peer" 
          placeholder=" " required />
        <label 
          for="name" 
                      className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
          Badge Name
          </label>
    </div>
  </div>
              <div className="relative z-0 w-full mb-5 group">
            <textarea id="message" rows="4" className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Description"/>
              </div>
  <div className="grid md:grid-cols-2 md:gap-6">
    <div className="relative z-0 w-full mb-5 group">
          <label for="difficulty" className="block mb-2 text-sm font-medium text-white">Select badge difficulty </label>
  <select id="difficulty" className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500">

          { ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'].map(d => (
        <option key={d} value={d}>
          {d}
          </option>
          ))}
          </select>
    </div>
    <div className="relative z-0 w-full mb-5 group">
          <label for="level" className="block mb-2 text-sm font-medium text-white">Select badge level </label>
  <select id="level" className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500">

          { ['Amateur', 'Intermediate', 'Professional'].map(d => (
        <option key={d} value={d}>
          {d}
          </option>
          ))}
          </select>
    </div>
  </div>
  <div className="grid md:grid-cols-2 md:gap-6">

    <div className="relative z-0 w-full mb-5 group">
    <button 
          id="dropdownSearchButton" onClick={handleSkillsDropDownToggle} data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" 
          className={`${isSkillsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`} 
          type="button"
          >
              Skills
            <svg
              className="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
             >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 4 4 4-4"
            />
              </svg>
      </button>
    </div>
    <div className={`relative z-0 w-full mb-5 group ${isSkillsDropDownOpen ? '' : 'hidden' }`}>
<div id="dropdownSearch" className={`${isSkillsDropDownOpen ? '' : 'hidden' } z-50 absolute rounded-lg shadow-sm w-60 bg-gray-700`}>
    <div className="p-3">
      <label for="input-group-search" className="sr-only">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          </svg>
        </div>
        <input type="text" id="input-group-search"  ref={dropDownInputRef} className="block w-full p-2 ps-10 text-sm bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Search user"/>
      </div>
    </div>
    <ul className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-200" aria-labelledby="dropdownSearchButton">
      <li>
        <div className="flex items-center ps-2 rounded-sm hover:bg-gray-600">
          <input id="checkbox-item-11" type="checkbox" value="" className="w-4 h-4 text-blue-600 rounded-sm  ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"/>
          <label for="checkbox-item-11" className="w-full py-2 ms-2 text-sm font-medium rounded-sm text-gray-300">Bonnie Green</label>
        </div>
      </li>
    </ul>
          <a
          className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
          >
          <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
          <path d="M6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Zm11-3h-2V5a1 1 0 0 0-2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 0 0 2 0V9h2a1 1 0 1 0 0-2Z"/>
          </svg>
          Add new Skill
          </a>
    </div>

  </div>
  </div>
  <div className="grid md:grid-cols-2 md:gap-6">

    <div className="relative z-0 w-full mb-5 group">
    <button 
          id="dropdownSearchButton" onClick={handleVerticalsDropDownToggle} data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" 
          className={`${isVerticalsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`} 
          type="button"
          >
              Vertical
            <svg
              className="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
             >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 4 4 4-4"
            />
              </svg>
      </button>
    </div>
    <div className={`relative z-0 w-full mb-5 group ${isVerticalsDropDownOpen ? '' : 'hidden' }`}>
<div id="dropdownSearch" className={`${isVerticalsDropDownOpen ? '' : 'hidden' } z-50 absolute rounded-lg shadow-sm w-60 bg-gray-700`}>
    <div className="p-3">
      <label for="input-group-search" className="sr-only">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          </svg>
        </div>
        <input type="text" id="input-group-search"  ref={dropDownInputRef} className="block w-full p-2 ps-10 text-sm bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Search user"/>
      </div>
    </div>
    <ul className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-200" aria-labelledby="dropdownSearchButton">
      <li>
        <div className="flex items-center ps-2 rounded-sm hover:bg-gray-600">
          <input id="checkbox-item-11" type="checkbox" value="" className="w-4 h-4 text-blue-600 rounded-sm  ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"/>
          <label for="checkbox-item-11" className="w-full py-2 ms-2 text-sm font-medium rounded-sm text-gray-300">Bonnie Green</label>
        </div>
      </li>
    </ul>
          <a
          className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
          >
          <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
          <path d="M6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Zm11-3h-2V5a1 1 0 0 0-2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 0 0 2 0V9h2a1 1 0 1 0 0-2Z"/>
          </svg>
          Add new Vertical
          </a>
    </div>

  </div>
  </div>

          <button
          type="submit"
          className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
          >
          Submit
          </button>
</form>
          </div>
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
