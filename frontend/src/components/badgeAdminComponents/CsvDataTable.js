import React, { useState} from 'react';

const ErrorTable = ({ data,  onUpdateUser }) => {
  const invalidUsers = data?.invalidUsers || [];
  const validUsers = data?.validUsers || [];
  const users = [...invalidUsers, ...validUsers]

  // State to track which row is in edit mode, based on user email (or any unique identifier)
  const [editRows, setEditRows] = useState({}); // Format: { [email]: { ...editedValues } }
  // State to track final changed rows
  const [changedRows, setChangedRows] = useState({}); // Format: { [email]: { ...changedData } }
    
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
    setChangedRows((prev) => ({
      ...prev,
      [user.row]: { ...updatedUserData },
    }));

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
    <div>
      <h2>Error Summary</h2>
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
     {/* Displaying changed rows for debug/information purposes */}
      <div className="mt-6 p-4 bg-gray-800 text-white">
        <h3 className="mb-2">Changed Rows:</h3>
        <pre>{JSON.stringify(changedRows, null, 2)}</pre>
      </div>
    </div>
  );
};

export default ErrorTable;
