import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import "./SearchBox.css";

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
          throw new Error("Unexpected response");
        }
      } catch (err) {
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (user) => {
    onUserSelect?.(user);
    setShowDropdown(false);
    setQuery(`${user.username} (${user.email})`);
  };

  return (
    <section className="searchbox-container" ref={searchRef}>
      <div className="input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="    Search for users..."
          className="search-input"
          autoComplete="off"
        />
          {query.trim() === "" && <Search className="search-icon" />}
      </div>

      {showDropdown && (
        <div className="dropdown">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          )}

          {error && <div className="error-text">{error}</div>}

          {!loading && !error && results.length > 0 && (
            <div className="results-list">
              <h3 className="results-header">Users</h3>
              {results.slice(0, 5).map((user) => (
                <button
                  key={user.username}
                  onClick={() => handleSelect(user)}
                  className="result-item"
                >
                  {user.username}
                </button>
              ))}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="no-results">No results found</div>
          )}
        </div>
      )}
    </section>
  );
}

export default SearchBox;
