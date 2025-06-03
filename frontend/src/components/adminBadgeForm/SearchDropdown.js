import React, { useState, useEffect, useRef } from 'react';

const SkillsDropdown = ({ type, skillsEarned, formData, handleChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const dropDownInputRef = useRef(null);



  // Filter skills based on the search term (case-insensitive)
  const filteredSkills = Array.isArray(skillsEarned)
    ? skillsEarned.filter((skill) =>
        (skill.toLowerCase()).includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <>
      <div className="p-3 z-5">
        <label htmlFor="skill-input-group-search" className="sr-only">
          Search
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm4.7 2.3a8 8 0 1 1 1.4-1.4l3.2 3.2-1.4 1.4-3.2-3.2z"
              />
            </svg>
          </div>
          <input
            type="text"
            id="skill-input-group-search"
            ref={dropDownInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={type === 'vertical' ? 'Search vertical' :'Search Skill'}
            className="block w-full p-2 ps-10 text-sm bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <ul
        className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-200"
        aria-labelledby="dropdownSearchButton"
      >
        {filteredSkills.length > 0 ? (
          filteredSkills.map((skill, index) => (
            <li key={index}>
              <div className="flex items-center ps-2 rounded-sm hover:bg-gray-600">
                <input
                  id={`checkbox-item-${index}`}
                  name={type === 'vertical' ? 'vertical' : 'skillsEarned'}
                  value={skill}
                  checked={
                    type === 'vertical' ? 
                    formData.level === skill :
                    formData.skillsEarned.includes(skill)
                  }
                  onChange={handleChange}
                  type={type === 'vertical' ? 'radio' : 'checkbox'}
                  className="w-4 h-4 text-blue-600 rounded-sm ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                  aria-label={skill}
                  aria-checked={
                    type === 'vertical' ? 
                    formData.level === skill :
                    formData.skillsEarned.includes(skill)
                  }
                />
                <label
                  htmlFor={`checkbox-item-${index}`}
                  className="w-full py-2 ms-2 text-sm font-medium rounded-sm text-gray-300"
                >
                  {skill}
                </label>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-400">No data available.</p>
        )}
      </ul>
    </>
  );
};

export default SkillsDropdown;

