import React from 'react';

const ErrorTable = ({ data }) => {
  const { errors } = data;

  return (
    <div>
      <h2>Error Summary</h2>
      <h3>Invalid Badges</h3>
      {errors.invalidBadges.length > 0 ? (
        <table className="w-full text-sm text-left rtl:text-right text-gray-400 ">
          <thead className="text-xs uppercase bg-gray-700 text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">ID</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Badge ID</th>
              <th scope="col" className="px-6 py-3">Error</th>
              <th scope="col" className="px-6 py-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {errors.invalidBadges.map((error, index) => (
                <tr className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700" key={index}>
                <td className="px-6 py-3">{error.row}</td>
                <td className="px-6 py-3">{error.email}</td>
                <td className="px-6 py-3">{error.badgeId}</td>
                <td className="px-6 py-3">
                 <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 me-2"></div>{error.error}
                 </div>
              </td>
                <td className="px-6 py-3">
                  <button className="font-medium text-blue-500 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No invalid badges found.</p>
      )}
    </div>
  );
};

export default ErrorTable;
