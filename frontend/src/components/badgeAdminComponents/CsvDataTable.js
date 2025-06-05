"use client";

import React, { useState} from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Save,
  X,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const statusCodes = [
  { statusCode: 100, category: "informational", description: "Continue" },
  {
    statusCode: 101,
    category: "informational",
    description: "Switching Protocols",
  },
  { statusCode: 200, category: "success", description: "OK" },
  { statusCode: 201, category: "success", description: "Created" },
  { statusCode: 202, category: "success", description: "Accepted" },
  { statusCode: 204, category: "success", description: "No Content" },
  { statusCode: 300, category: "redirection", description: "Multiple Choices" },
  {
    statusCode: 301,
    category: "redirection",
    description: "Moved Permanently",
  },
  { statusCode: 302, category: "redirection", description: "Found" },
  { statusCode: 304, category: "redirection", description: "Not Modified" },
  { statusCode: 400, category: "clientError", description: "Bad Request" },
  { statusCode: 401, category: "clientError", description: "Unauthorized" },
  { statusCode: 403, category: "clientError", description: "Forbidden" },
  { statusCode: 404, category: "clientError", description: "Not Found" },
  {
    statusCode: 500,
    category: "serverError",
    description: "Internal Server Error",
  },
  { statusCode: 501, category: "serverError", description: "Not Implemented" },
  { statusCode: 502, category: "serverError", description: "Bad Gateway" },
  {
    statusCode: 503,
    category: "serverError",
    description: "Service Unavailable",
  },
  // Add more status codes here...
];


const categoryColors = {
  informational: "bg-blue-500/10 border border-blue-800 text-blue-300",
  success: "bg-green-500/10 border border-green-800  text-green-300",
  redirection: "bg-yellow-500/10 border border-yellow-800 text-yellow-300",
  clientError: "bg-orange-500/10 border border-orange-800 text-orange-300",
  serverError: "bg-red-500/10 border border-red-800 text-red-300"
}


const categoryIcons = {
  informational: <Info className="w-5 h-5" />,
  success: <CheckCircle className="w-5 h-5" />,
  redirection: <AlertTriangle className="w-5 h-5" />,
  clientError: <XCircle className="w-5 h-5" />,
  serverError: <XCircle className="w-5 h-5" />,
};

const ErrorTable = ({ users,  onUpdateUser }) => {

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = users.filter(
    (user) =>
      user.badgeIds.toString().includes(searchTerm) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);


  // State to track which row is in edit mode, based on user email (or any unique identifier)
  const [editRows, setEditRows] = useState({}); // Format: { [email]: { ...editedValues } }
  // State to track final changed rows
  // const [changedRows, setChangedRows] = useState({}); // Format: { [email]: { ...changedData } }
    
  // Handler for starting editing a row.
  const handleEditClick = (user) => {
    setEditRows((prev) => ({
      ...prev,
      [user.row]: { ...user } // initialize editing with current row data
    }));
  };


  // Handler for canceling editing a row.
  const handleCancelClick = (user) => {
    // Remove row from editRows when the user cancels.
    setEditRows((prev) => {
      const updated = { ...prev };
      delete updated[user.row];
      return updated;
    });
  };


  // Handler for when a field changes during editing.
  const handleInputChange = (e, row) => {
    const { name, value } = e.target;
    setEditRows((prev) => ({
      ...prev,
      [row]: {
        ...prev[row],
        [name]: value,
      },
    }));
  };

  // Handler for saving changes for a row.
  const handleSaveClick = (user) => {
     const updatedUserData = editRows[user.row];
    // Save updated data locally
    // setChangedRows((prev) => ({
    //   ...prev,
    //   [user.row]: { ...updatedUserData },
    // }));

    // Call the parent's update function to update the main data
    if (onUpdateUser) {
      onUpdateUser(updatedUserData);
    }

    // Exit edit mode by removing entry from editRows
    setEditRows((prev) => {
      const updated = { ...prev };
      delete updated[user.row];
      return updated;
    });
  };



  return (
    <div className="w-full">
    {/*
        <table className="w-full text-sm text-left rtl:text-right text-gray-400 ">
          <thead className="text-xs uppercase bg-gray-700 text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">First Name</th>
              <th scope="col" className="px-6 py-3">Last Name</th>
              <th scope="col" className="px-6 py-3">Badges</th>
              <th scope="col" className="px-6 py-3">Error</th>
              <th scope="col" className="px-6 py-3">Edit</th>
            </tr>
          </thead>
      {(users && users.length > 0) ?  (
          <tbody>
        {users.map((user, index) => {
              const inEditMode = editRows.hasOwnProperty(user.row);
              const rowData = inEditMode ? editRows[user.row] : user;
              return (
                <tr
                  className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700"
                  key={index}
                >
                  <td className="px-6 py-3">
                    {inEditMode ? (
                      <input
                        type="text"
                        name="email"
                        value={rowData.email}
                        onChange={(e) => handleInputChange(e, user.row)}
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                      />
                    ) : (
                      rowData.email
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {inEditMode ? (
                      <input
                        type="text"
                        name="firstName"
                        value={rowData.firstName}
                        onChange={(e) => handleInputChange(e, user.row)}
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                      />
                    ) : (
                      rowData.firstName
                    )}
                  </td>
                 <td className="px-6 py-3">
                    {inEditMode ? (
                      <input
                        type="text"
                        name="lastName"
                        value={rowData.lastName}
                        onChange={(e) => handleInputChange(e, user.row)}
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                      />
                    ) : (
                      rowData.lastName
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {inEditMode ? (
                      <input
                        type="text"
                        name="badgeIds"
                        value={rowData.badgeIds}
                        onChange={(e) => handleInputChange(e, user.row)}
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                      />
                    ) : (
                      rowData.badgeIds
                    )}
                  </td>

                <td className="px-6 py-3">
                    <div className="flex items-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${ 
                          !user.error 
                            ? 'bg-green-500'
                            : user.error.includes('User already exist')
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        } me-2`}
                      ></div>
                      {rowData.error || 'User Ready for import'}
                    </div>
                 </td>

                <td className="px-6 py-3">
                    {inEditMode ? (
                      <div className="flex space-x-2">
                        <button
                          className="font-medium text-green-500 hover:underline"
                          onClick={() => handleSaveClick(user)}
                        >
                          Save
                        </button>
                        <button
                          className="font-medium text-red-500 hover:underline"
                          onClick={() => handleCancelClick(user)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="font-medium text-blue-500 hover:underline"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
        ) : (
          <tbody>
          { ['1', '2', '3'].map((row, index) => (
            <tr key={index} className="max-w-md p-4 space-y-4 border divide-y rounded-sm shadow-sm animate-pulse divide-gray-700 md:p-6 border-gray-700">
          { ['1', '2', '3', 4, 5].map((row, index) => (
              <td key={index} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                </div>
              </td>
          ))}
            </tr>
          ))}
          </tbody>
      )}
        </table>
        */}

    <Card className="w-full max-w-4xl mx-auto backdrop-blur-md  border border-white/20 shadow-xl">
      <CardContent className="p-6">
        <Input
          type="text"
          placeholder="Search status codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="font-semibold">Email</div>
          <div className="font-semibold">First Name</div>
          <div className="font-semibold">Last Name</div>
          <div className="font-semibold">Badges</div>
          <div className="font-semibold">Error</div>
          <div className="font-semibold border-b-2 border-gray-500 md:border-b-0">Actions</div>
          {currentItems.map((user, index) => {
              const inEditMode = editRows.hasOwnProperty(user.row);
              const rowData = inEditMode ? editRows[user.row] : user;
              return (
                <>
              <div className="flex items-center truncate"> 
                    {inEditMode ? (
                      <Input 
                        type="text"
                        name="email"
                        value={rowData.email}
                        onChange={(e) => handleInputChange(e, user.row)}
                      />
                    ) : (
                      rowData.email
                    )}
                  </div>
              <div className="flex items-center capitalize"> 
                    {inEditMode ? (
                      <Input
                        type="text"
                        name="firstName"
                        value={rowData.firstName}
                        onChange={(e) => handleInputChange(e, user.row)}
                      />
                    ) : (
                      rowData.firstName
                    )}
                  </div>
              <div className="flex items-center capitalize"> 
                    {inEditMode ? (
                      <Input
                        type="text"
                        name="lastName"
                        value={rowData.lastName}
                        onChange={(e) => handleInputChange(e, user.row)}
                      />
                    ) : (
                      rowData.lastName
                    )}
                  </div>
              <div className="flex items-center capitalize"> 
                    {inEditMode ? (
                      <Input
                        type="text"
                        name="badgeIds"
                        value={rowData.badgeIds}
                        onChange={(e) => handleInputChange(e, user.row)}
                      />
                    ) : (
                      rowData.badgeIds
                    )}
                  </div>

              <div className="flex items-center capitalize"> 
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${ 
                          !user.error 
                            ? 'bg-green-500'
                            : user.error.includes('User already exist')
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        } me-2`}
                      ></span>
                      {rowData.error || 'User Ready for import'}
                 </div>

              <div className="flex capitalize border-b-2 border-gray-500 md:border-b-0"> 
                    {inEditMode ? (
                      <span >
                      <Button className="hover:bg-green-500" variant="outline"  onClick={() => handleSaveClick(user)} ><Save className="mr-2 h-4 w-4" /></Button>
                      <Button className="hover:bg-red-500" onClick={() => handleCancelClick(user)} variant="outline"><X className="mr-2 h-4 w-4" /></Button>
                      </span>
                    ) : (
                      <Button className="hover:bg-blue-500" variant="outline" onClick={() => handleEditClick(user)} ><Edit className="mr-2 h-4 w-4" /></Button>
                    )}
                  </div>
                </>
              );
          })}
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default ErrorTable;
