import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUsers,
  faTasks,
  faFolder,
  faComments,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import useOnClickOutside from "../hooks/useOnClickOutside";
import "../styles/components/SearchBar.css";

const SearchBar = ({ onSearch, suggestions = [], isLoading }) => {
  const [query, setQuery] = useState("");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const searchTypes = [
    { id: "all", label: "All", icon: faSearch },
    { id: "teams", label: "Teams", icon: faUsers },
    { id: "tasks", label: "Tasks", icon: faTasks },
    { id: "projects", label: "Projects", icon: faFolder },
    { id: "messages", label: "Messages", icon: faComments },
  ];

  useOnClickOutside(containerRef, () => {
    setShowTypeSelector(false);
    setShowSuggestions(false);
  });

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "/" && !e.target.closest("input, textarea")) {
        e.preventDefault();
        containerRef.current?.querySelector("input")?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value, selectedType);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setShowTypeSelector(false);
    onSearch(query, type);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    onSearch(suggestion.title, selectedType);
  };

  return (
    <div ref={containerRef} className="search-container">
      <div className="search-input-wrapper">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />

        <div className="search-type-selector">
          <button
            className="type-selector-button"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
          >
            <FontAwesomeIcon
              icon={
                searchTypes.find((t) => t.id === selectedType)?.icon || faSearch
              }
            />
            <FontAwesomeIcon icon={faChevronDown} size="xs" />
          </button>

          {showTypeSelector && (
            <div className="search-types-dropdown">
              {searchTypes.map((type) => (
                <div
                  key={type.id}
                  className={`type-option ${
                    selectedType === type.id ? "active" : ""
                  }`}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <FontAwesomeIcon icon={type.icon} />
                  {type.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="search-shortcut">
          <span className="shortcut-key">/</span>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="suggestion-icon">
                <FontAwesomeIcon
                  icon={
                    searchTypes.find((t) => t.id === suggestion.type)?.icon ||
                    faSearch
                  }
                />
              </div>
              <div className="suggestion-content">
                <div className="suggestion-title">{suggestion.title}</div>
                {suggestion.subtitle && (
                  <div className="suggestion-subtitle">
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
