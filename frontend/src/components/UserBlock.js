import React from "react";
import Link from "next/link";
import AssignBadgePopUp from "@/components/AssignBadgePopUp";
import RevokeBadgePopUp from "@/components/RevokeBadgePopUp";
import DeleteUserPopUp from "@/components/DeleteUserPopUp";

function UserBlock({ data, updateUserDetails, onSelect }) {

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <div onClick={onSelect}   className="w-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-600 bg-slate-950/75 backdrop-blur-md rounded-lg border-2 border-gray-600 border-opacity-50 p-4 justify-between gap-4 hover:border-[#00CBF0]">
      
      {/* Left Side */}
      <div className="flex flex-col w-2/3">
        <h1 className="text-base md:text-l font-bold text-white-700">{data?.firstName} {data?.lastName}
          <span className="px-2 text-base md:text-l font-thin font-mono mt-2 text-gray-400">{"(" + data?.email + ")" }</span>
        </h1>
        <p className="text-base mt-2 font-mono text-gray-400">Badges: {data?.badges?.length}</p>
      </div>
    </div>
  );
}

export default UserBlock;
