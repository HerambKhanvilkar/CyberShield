"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search } from "lucide-react";

function SearchBox({ onUserSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setError("");
        return;
      }

      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_URL}/users/autocomplete?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        if (Array.isArray(response.data)) {
          setResults(response.data);
          setError("");
          setShowDropdown(true);
        } else {
          setResults([]);
          setError("Unexpected API response");
        }
      } catch (err) {
        setError("Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (user) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    setShowDropdown(false);
    setQuery(`${user.username} (${user.email})`);
  };

  return (
    <div ref={searchRef} className="relative flex flex-auto">
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for Users"
          className="grow w-full bg-[#1A1B2E] text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          autoComplete="off"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {showDropdown && (
        <div className="absolute w-full top-full mt-1 bg-[#1A1B2E] rounded-lg shadow-lg border border-gray-800 z-50">
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
            </div>
          )}

          {error && <div className="p-4 text-red-500 text-sm">{error}</div>}

          {!loading && !error && results.length > 0 && (
            <div className="py-2">
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">
                Users
              </h3>
              {results.slice(0, 5).map((user) => (
                <button
                  key={user.username}
                  onClick={() => handleSelect(user)}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-cyan-600 rounded-lg"
                >
                  {user.username} ({user.email})
                </button>
              ))}
              <a
                className="block px-4 py-2 text-sm text-cyan-400 hover:underline"
                href="/search"
              >
                See more
              </a>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-2 text-gray-400 text-sm">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBox;
