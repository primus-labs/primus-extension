import React, { useState, useCallback, useEffect } from 'react';
import { findXiaohongshuByTiktok, HandleMapping, getAllHandleMappings } from '@/services/firestore';
import { Timestamp } from 'firebase/firestore';
import './index.scss';

const HandleSearch: React.FC<{ theme?: string }> = ({ theme = 'light' }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<HandleMapping | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentMappings, setRecentMappings] = useState<HandleMapping[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load recent mappings on component mount
  useEffect(() => {
    const loadRecentMappings = async () => {
      try {
        setIsLoading(true);
        const mappings = await getAllHandleMappings(10);
        setRecentMappings(mappings);
        setError(null);
      } catch (error) {
        console.error('Error loading recent mappings:', error);
        setError('Failed to load recent mappings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentMappings();
  }, []);

  // Format timestamp to readable date
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle search submission
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a TikTok handle to search');
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      setSearchResult(null);

      // Clean the search query by removing @ if present
      const cleanQuery = searchQuery.trim().startsWith('@') 
        ? searchQuery.trim().substring(1) 
        : searchQuery.trim();

      const result = await findXiaohongshuByTiktok(cleanQuery);
      setSearchResult(result);
      
      if (!result) {
        setError(`No Xiaohongshu handle found for TikTok handle: @${cleanQuery}`);
      }
    } catch (error) {
      console.error('Error searching for handle mapping:', error);
      setError('An error occurred while searching. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  return (
    <div className={`handle-search-container ${theme}`}>
      <h2>Find Xiaohongshu Handles</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Enter TikTok handle (e.g., username)"
            className="search-input"
            disabled={isSearching}
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {searchResult && (
        <div className="search-result">
          <h3>Found Mapping:</h3>
          <div className="mapping-item">
            <div className="mapping-details">
              <div><strong>TikTok:</strong> @{searchResult.tiktokHandle}</div>
              <div><strong>Xiaohongshu:</strong> @{searchResult.xiaohongshuHandle}</div>
              <div><strong>Added:</strong> {formatDate(searchResult.createdAt)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="recent-mappings">
        <h3>Recent Mappings</h3>
        {isLoading ? (
          <div className="loading">Loading recent mappings...</div>
        ) : recentMappings.length > 0 ? (
          <ul className="mappings-list">
            {recentMappings.map((mapping, index) => (
              <li key={index} className="mapping-item">
                <div className="mapping-details">
                  <div><strong>TikTok:</strong> @{mapping.tiktokHandle}</div>
                  <div><strong>Xiaohongshu:</strong> @{mapping.xiaohongshuHandle}</div>
                  <div><strong>Added:</strong> {formatDate(mapping.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-mappings">No handle mappings found.</div>
        )}
      </div>
    </div>
  );
};

export default HandleSearch; 