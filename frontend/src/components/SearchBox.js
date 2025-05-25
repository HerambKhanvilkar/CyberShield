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
      <div className="flex justify-start h-10 text-sm bg-gray-800 rounded-full mx-4">
          {query.trim() === "" && <Search className="mt-2 ml-2 px-1" />}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for users..."
          className="text-sm w-full text-white-500 focus:outline-none sm:mx-4 my-2"
          autoComplete="off"
        />
      </div>
  );
}

export default SearchBox;
