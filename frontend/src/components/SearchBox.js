import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search } from "lucide-react";

function SearchBox({ onSearch }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
            const fetchData = async () => {
                try {
                  const token = localStorage.getItem("token");
                  let url = "";
                  if (query !== "") {
                    url = `${process.env.SERVER_URL}/users/autocomplete?q=${encodeURIComponent(query)}`;
                    console.log(url);
                  } else {
                    url = `${process.env.SERVER_URL}/users`;
                    console.log(url);
                  }
                  const response = await axios.get(
                    url,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      timeout: 10000,
                    }
                  );
                  // if (!response.ok || Array.isArray(response.data) ) {
                  if (!response) {
                    throw new Error('Network response was not ok');
                  }
                    const data = await response.data;
                    onSearch(data); // Pass the response data to the parent component
                } catch (error) {
                    console.error('Error fetching data:', error);
                  onSearch([]);
                }
            };
    const debounceTimer = setTimeout(fetchData, 100);
    return () => clearTimeout(debounceTimer);
  }, [query]);


  const handleInputChange = (event) => {
    const value = event.target.value;
    console.log("lakjsdfa", value);
    setQuery(value);
  };

  return (
    <div className="relative w-full md:max-w-md mb-4 md:mb-0">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search for users..."
        className={`bg-[#1A1B2E] text-white placeholder-gray-400 rounded-lg 
          ${query === "" ? "pl-10" : "pl-4"} pr-4 py-2
          focus:outline-none focus:ring-2 focus:ring-cyan-500 
          w-full transition-all duration-300`}
        autoComplete="off"
      />
      {query === "" && (
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      )}
    </div>
  );
}

export default SearchBox;
