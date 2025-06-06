import React from "react";
import Link from "next/link";

function UserBlock({ data, updateUserDetails, onSelect }) {

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  return (
    <div
      onClick={onSelect}
      className="w-full flex flex-col md:flex-row bg-slate-950/75 backdrop-blur-md rounded-lg border-2 border-gray-600 border-opacity-50 p-4 justify-between gap-4 hover:border-[#00CBF0]"
    >
      {/* Left Side */}
      <div className="flex flex-col w-2/3">
        {/* Container for names and email */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-base md:text-lg font-bold text-white-700 whitespace-nowrap">
            {data?.firstName} {data?.lastName}
          </h1>
          <span
            className="text-base md:text-lg font-thin font-mono text-gray-400 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
            title={data?.email} // shows full email on hover
          >
            {truncateText(data?.email, 20)}
          </span>
        </div>
        {/* <p className="text-base mt-2 font-mono text-gray-400">
          Badges: {data?.badges?.length}
        </p> */}
        {/* Badges section */}
        <div className="mt-2 flex items-center gap-2 text-gray-400 font-mono text-sm">
          <span>Badges: {data?.badges?.length || 0}</span>
          <div className="flex gap-1">
            <div className="flex items-center space-x-1">
              {data?.badges?.slice(0, 5).map((badge, index) => (
                <img
                  key={index}
                  src={`./images/img${badge.badgeId}.png`}
                  alt={badge.name || `Badge ${badge.badgeId}`}
                  title={badge.name || "Unnamed Badge"}
                  className="w-5 h-5 rounded-sm drop-shadow-md"
                />
              ))}

              {data?.badges?.length > 5 && (
                <span className="text-sm text-gray-400 font-semibold">
                  +{data.badges.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserBlock;
