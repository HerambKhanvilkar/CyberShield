// components/UsersPagination.js
import React from 'react';
import {ChevronLeft, ChevronRight } from "lucide-react";

const UsersPagination = ({ currentPage, totalPages, onPageChange }) => {
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  return (
        <div className="flex flex-col h-10 md:flex-row justify-between items-center p-2 sm:p-4">
          <div className="flex flex-row gap-5 items-center text-lg justify-center">
            <button
              className="mx-2 my-2 px-2 w-1/4 sm:w-24 py-1 bg-blue-500 text-sm text-white rounded disabled:opacity-50 hover:bg-blue-600"
              disabled={currentPage === 1}
              onClick={() =>
                onPageChange(currentPage - 1)
              }
            >
              <span className="sm:hidden"><ChevronLeft/></span>
             <span className="hidden sm:block">Previous</span>

            </button>
            <span className="text-sm w-full sm:w-max">
            Page {currentPage} of {totalPages}
            </span>
            <button
              className="mx-2 my-2 px-2 w-1/4 sm:w-24 py-1 bg-blue-500 text-sm text-white rounded disabled:opacity-50 hover:bg-blue-600"
              disabled={currentPage === totalPages}
              onClick={() =>
                onPageChange(currentPage + 1)
              }
            >
              <span className="sm:hidden"><ChevronRight/></span>
             <span className="hidden sm:block">Next</span>
            </button>
          </div>
        </div>
  );
};

export default UsersPagination;
