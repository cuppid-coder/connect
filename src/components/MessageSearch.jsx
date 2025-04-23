import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { useMessage } from "../hooks/useMessage";
import "../styles/components/MessageSearch.css";

const MessageSearch = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { searchMessages } = useMessage();

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const searchResults = await searchMessages(query);
          setResults(searchResults);
        } catch (error) {
          console.error("Error searching messages:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, searchMessages]);

  const handleResultClick = (result) => {
    onSelect(result);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="message-search">
      <div className="search-input-container">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {(loading || results.length > 0) && (
          <div className="search-results">
            {loading ? (
              <div className="loading">Searching...</div>
            ) : (
              results.map((result) => (
                <div
                  key={result._id}
                  className="search-result"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-avatar">
                    {result.sender.avatar ? (
                      <img
                        src={result.sender.avatar}
                        alt={result.sender.name}
                      />
                    ) : (
                      result.sender.name.charAt(0)
                    )}
                  </div>
                  <div className="result-content">
                    <div className="result-name">{result.sender.name}</div>
                    <div className="result-preview">{result.content}</div>
                  </div>
                  <div className="result-meta">
                    {format(new Date(result.createdAt), "MMM d")}
                  </div>
                </div>
              ))
            )}
            {!loading && results.length === 0 && query.trim() && (
              <div className="no-results">No messages found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSearch;
