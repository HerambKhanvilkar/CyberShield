import React from "react";
import Link from "next/link";


function BadgesBlock({ data, updateBadgeDetails, onSelect }) {

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
        <h1 className="text-base md:text-l font-bold text-white">{data?.name}</h1>
        <h1 className="text-base md:text-l font-bold text-white-200">{data?.description && `${truncateText(data?.description, 30)}`}</h1>

          <span className="text-base md:text-l font-thin font-mono mt-2 text-gray-400">{data?.difficulty}</span>
      </div>
    </div>
  );
}

export default BadgesBlock;
