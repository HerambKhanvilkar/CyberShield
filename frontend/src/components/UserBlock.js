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
    className="w-full flex flex-col md:flex-row bg-gradient-to-br from-black/30 to-black/15 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] rounded-xl p-4 justify-between gap-4 hover:shadow-blue-500/30 hover:border-[#00CBF0] transition-all duration-300 cursor-pointer"
  >
    {/* Left Side */}
    <div className="flex flex-col w-full">
      {/* Container for names and email */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-base md:text-lg font-bold text-white whitespace-nowrap">
          {data?.firstName} {data?.lastName}
        </h1>
        <span
          className="text-base md:text-lg font-mono text-gray-400 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
          title={data?.email}
        >
          {truncateText(data?.email, 20)}
        </span>
      </div>

      {/* Badges section */}
      <div className="mt-2 flex items-center gap-2 text-gray-400 font-mono text-sm">
        <span>Badges: {data?.badges?.length || 0}</span>
        <div className="flex gap-1">
          <div className="flex items-center space-x-1">
            {data?.badges?.slice(0, 5).map((badge, index) => (
              <img
                key={index}
                crossOrigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${badge.badgeId}` || badge.img?.data}
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
