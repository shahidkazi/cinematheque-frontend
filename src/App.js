import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// Detect if running on local network and adjust API URL accordingly
const getApiUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    console.log('Using API URL from env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // If accessing from localhost, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Using localhost API');
    return 'http://localhost:8000';
  }
  
  // If accessing from local network, use the same host with port 8000
  console.log('Using network host:', window.location.hostname);
  return `http://${window.location.hostname}:8000`;
};

const API_BASE = getApiUrl();
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

console.log('API Base URL:', API_BASE);
console.log('Current host:', window.location.hostname);

// Icons as SVG components
const FilmIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
    <line x1="7" y1="2" x2="7" y2="22"/>
    <line x1="17" y1="2" x2="17" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="2" y1="7" x2="7" y2="7"/>
    <line x1="2" y1="17" x2="7" y2="17"/>
    <line x1="17" y1="17" x2="22" y2="17"/>
    <line x1="17" y1="7" x2="22" y2="7"/>
  </svg>
);

const TvIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const DiskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const App = () => {
  console.log('App component rendered at:', new Date().toISOString());
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [username, setUsername] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [activeView, setActiveView] = useState('dashboard');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [media, setMedia] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    mediaType: 'all',
    seen: 'all',
    backedUp: 'all',
    quality: 'all'
  });
  const [sortBy, setSortBy] = useState('date_added'); // title, size, date_added
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [editingMedia, setEditingMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    
    const handleClickOutside = () => setShowUserMenu(false);
    
    // Small delay to prevent immediate closing when opening
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);
  
  // Helper to close Add Media modal and clear state
  const closeAddModal = useCallback(() => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowAddModal(false);
      setEditingMedia(null);
      setIsModalClosing(false);
    }, 300); // Wait for CSS transition
  }, []);
  
  // Use ref for notifications to prevent re-renders
  const notificationRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Show notification without causing re-render
  const showNotification = useCallback((message, type = 'success') => {
    console.log(`Notification: ${type} - ${message}`);
    
    // Clear existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    // Create notification element if it doesn't exist
    if (!notificationRef.current) {
      const notifDiv = document.createElement('div');
      notifDiv.id = 'notification-container';
      document.body.appendChild(notifDiv);
      notificationRef.current = notifDiv;
    }
    
    // Update notification
    notificationRef.current.className = `notification ${type} show`;
    notificationRef.current.textContent = message;
    
    // Auto-hide after 3 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      if (notificationRef.current) {
        notificationRef.current.className = `notification ${type}`;
      }
    }, 3000);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cinematheque_token');
    const savedUsername = localStorage.getItem('cinematheque_username');
    
    if (savedToken && savedUsername) {
      // Verify token is still valid
      fetch(`${API_BASE}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      })
        .then(response => {
          if (response.ok) {
            setAuthToken(savedToken);
            setUsername(savedUsername);
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('cinematheque_token');
            localStorage.removeItem('cinematheque_username');
          }
        })
        .catch(error => {
          console.error('Auth verification error:', error);
          localStorage.removeItem('cinematheque_token');
          localStorage.removeItem('cinematheque_username');
        })
        .finally(() => {
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, []);

  // Fetch media list
  const fetchMedia = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.mediaType !== 'all') params.append('media_type', filters.mediaType);
      if (filters.seen !== 'all') params.append('seen', filters.seen === 'seen');
      if (filters.backedUp !== 'all') params.append('backed_up', filters.backedUp);
      if (filters.quality !== 'all') params.append('quality', filters.quality);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${API_BASE}/media?${params}`);
      const data = await response.json();
      setMedia(data);
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification('Failed to fetch media', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters, searchQuery, showNotification, isAuthenticated]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      showNotification('Failed to fetch stats', 'error');
    }
  }, [showNotification, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMedia();
      fetchStats();
    }
  }, [fetchMedia, fetchStats, isAuthenticated]);

  // Login function
  const handleLogin = async (username, password, rememberMe) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, remember_me: rememberMe })
      });

      const data = await response.json();

      if (data.success && data.token) {
        setAuthToken(data.token);
        setUsername(data.username);
        setIsAuthenticated(true);

        // Save to localStorage if remember me is checked
        if (rememberMe) {
          localStorage.setItem('cinematheque_token', data.token);
          localStorage.setItem('cinematheque_username', data.username);
        }

        showNotification('Login successful!', 'success');
        return true;
      } else {
        showNotification(data.message || 'Login failed', 'error');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Login failed. Please try again.', 'error');
      return false;
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and storage
      setAuthToken(null);
      setUsername('');
      setIsAuthenticated(false);
      localStorage.removeItem('cinematheque_token');
      localStorage.removeItem('cinematheque_username');
      showNotification('Logged out successfully', 'success');
    }
  };


  // Get TMDB details - simplified to avoid multiple requests
  const getTMDBDetails = async (tmdbId, mediaType, retries = 1) => {  // Default to 1 attempt
    console.log('=== getTMDBDetails Called ===');
    console.log('TMDB ID:', tmdbId);
    console.log('Media Type:', mediaType);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      if (attempt > 1) {
        console.log(`Details retry ${attempt} of ${retries}`);
      }
      
      try {
        const url = `${API_BASE}/tmdb/details/${tmdbId}?media_type=${mediaType}`;
        console.log('Details URL:', url);
        
        // Create timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Details response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 429) {
            showNotification('Too many requests. Please wait.', 'warning');
            return null;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('TMDB details received successfully');
        return data;
        
      } catch (error) {
        console.error(`Details attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          showNotification('Could not fetch movie details. You can still add manually.', 'warning');
          return null;
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    return null;
  };

  // Save media
  const saveMedia = async (mediaData) => {
    try {
      console.log('Saving media data:', mediaData);
      
      // Convert cast_list to cast array for backend
      const castArray = (mediaData.cast_list || []).map(member => ({
        name: member.name,
        character: member.character,
        profile_path: null
      }));
      
      // Also create cast_names string for backward compatibility
      const castNamesString = (mediaData.cast_list || [])
        .map(member => member.name)
        .filter(name => name)
        .join(', ');
      
      // Process genres - ensure it's an array
      let genresArray = [];
      if (typeof mediaData.genres === 'string') {
        genresArray = mediaData.genres.split(',').map(g => g.trim()).filter(g => g);
      } else if (Array.isArray(mediaData.genres)) {
        genresArray = mediaData.genres;
      }
      
      // Helper function to convert empty strings to null
      const emptyToNull = (value) => (value === '' || value === undefined) ? null : value;
      
      // For TV series, only persist season/episode number and title for episodes (no plot)
      let cleanedEpisodeDetails = [];
      if (Array.isArray(mediaData.episode_details)) {
        cleanedEpisodeDetails = mediaData.episode_details
          .map((ep) => {
            if (!ep) return null;
            const season_number = ep.season_number ?? null;
            const episode_number = ep.episode_number ?? null;
            const title = ep.title ?? '';

            // Drop completely empty entries
            if (season_number === null && episode_number === null && !title) {
              return null;
            }

            return {
              season_number,
              episode_number,
              title,
            };
          })
          .filter(Boolean);
      }

      // Clean up the data to ensure proper format
      const cleanedData = {
        ...mediaData,
        media_type: mediaData.media_type || 'movie',
        backed_up: mediaData.backed_up || 'not_backed_up',
        seen: mediaData.seen || false,
        genres: genresArray,
        cast: castArray,
        cast_names: castNamesString || null,
        crew: mediaData.crew || [],
        user_rating: mediaData.user_rating ? parseFloat(mediaData.user_rating) : null,
        director: emptyToNull(mediaData.director),
        original_title: emptyToNull(mediaData.original_title),
        country: emptyToNull(mediaData.country),
        file_size: emptyToNull(mediaData.file_size),
        loaned_to: emptyToNull(mediaData.loaned_to),
        location: emptyToNull(mediaData.location),
        notes: emptyToNull(mediaData.notes),
        quality: emptyToNull(mediaData.quality),
        // Handle numeric fields
        runtime: mediaData.runtime ? parseInt(mediaData.runtime) : null,
        seasons: mediaData.seasons ? parseInt(mediaData.seasons) : null,
        episodes: mediaData.episodes ? parseInt(mediaData.episodes) : null,
        tmdb_id: mediaData.tmdb_id || null,
        tmdb_rating: mediaData.tmdb_rating ? parseFloat(mediaData.tmdb_rating) : null,
        tmdb_vote_count: mediaData.tmdb_vote_count || null,
        // Handle date fields
        release_date: emptyToNull(mediaData.release_date),
        date_watched: emptyToNull(mediaData.date_watched),
        // Handle optional string fields
        overview: emptyToNull(mediaData.overview),
        poster_path: emptyToNull(mediaData.poster_path),
        backdrop_path: emptyToNull(mediaData.backdrop_path),
        episode_details: cleanedEpisodeDetails,
      };
      
      // Remove cast_list from data sent to backend
      delete cleanedData.cast_list;
      
      console.log('Cleaned data to save:', cleanedData);
      
      const url = editingMedia 
        ? `${API_BASE}/media/${editingMedia.id}`
        : `${API_BASE}/media`;
      
      const method = editingMedia ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });
      
      const responseData = await response.json();
      console.log('Save response:', responseData);
      
      if (response.ok) {
        // Show notification immediately
        showNotification(`Media ${editingMedia ? 'updated' : 'added'} successfully`);
        
        // Close modal with smooth animation
        closeAddModal();
        
        // Refresh data after modal animation completes (300ms)
        // Use Promise.all to batch the requests and prevent multiple re-renders
        // Use silent refresh to avoid showing loading state
        setTimeout(async () => {
          try {
            await Promise.all([fetchMedia(true), fetchStats()]);
          } catch (fetchError) {
            console.error('Error refreshing data after save:', fetchError);
          }
        }, 300); // Wait for modal close animation
      } else {
        throw new Error(responseData.detail || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      showNotification(error.message || 'Failed to save media', 'error');
    }
  };

  // Delete media
  const deleteMedia = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/media/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('Media deleted successfully');
        // Batch refresh calls and use silent mode
        Promise.all([fetchMedia(true), fetchStats()]).catch(err => 
          console.error('Error refreshing after delete:', err)
        );
      }
    } catch (error) {
      showNotification('Failed to delete media', 'error');
    }
  };

  // Quick toggle functions
  const toggleSeen = async (item) => {
    const updatedItem = { ...item, seen: !item.seen };
    try {
      const response = await fetch(`${API_BASE}/media/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      
      if (response.ok) {
        await fetchMedia(true); // Silent refresh
        showNotification('Updated successfully');
      }
    } catch (error) {
      showNotification('Failed to update', 'error');
    }
  };

  const toggleBackup = async (item) => {
    const statuses = ['not_backed_up', 'backed_up', 'pending'];
    const currentIndex = statuses.indexOf(item.backed_up);
    const newStatus = statuses[(currentIndex + 1) % statuses.length];
    const updatedItem = { ...item, backed_up: newStatus };
    
    try {
      const response = await fetch(`${API_BASE}/media/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      
      if (response.ok) {
        await fetchMedia(true); // Silent refresh
        showNotification('Backup status updated');
      }
    } catch (error) {
      showNotification('Failed to update', 'error');
    }
  };

  // Dashboard Component
  const Dashboard = () => {
    if (!stats) return <div className="loading-spinner">Loading stats...</div>;
    
    const formatRuntime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    };
    
    return (
      <div className="dashboard">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-value">{stats.total_media}</div>
            <div className="stat-label">Total Collection</div>
            <div className="stat-detail">
              {stats.total_movies} movies · {stats.total_tv_series} series
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.seen_count}</div>
            <div className="stat-label">Watched</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(stats.seen_count / stats.total_media) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.backed_up_count}</div>
            <div className="stat-label">Backed Up</div>
            <div className="progress-bar">
              <div 
                className="progress-fill backed-up"
                style={{ width: `${(stats.backed_up_count / stats.total_media) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{formatRuntime(stats.total_runtime_minutes)}</div>
            <div className="stat-label">Total Runtime</div>
            <div className="stat-detail">
              {stats.total_runtime_minutes} minutes
            </div>
          </div>
        </div>
        
        <div className="dashboard-sections">
          {/* 1. Quality Distribution */}
          <div className="dashboard-section">
            <h3 className="section-title">Quality Distribution</h3>
            <div className="quality-bars">
              {Object.entries(stats.quality_distribution).map(([quality, count]) => (
                <div key={quality} className="quality-bar-container">
                  <div className="quality-label">{quality}</div>
                  <div className="quality-bar">
                    <div 
                      className="quality-fill"
                      style={{ 
                        width: `${(count / Math.max(...Object.values(stats.quality_distribution))) * 100}%` 
                      }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Pending Backup by Quality */}
          <div className="dashboard-section">
            <h3 className="section-title">Pending Backup by Quality</h3>
            <div className="quality-bars">
              {Object.keys(stats.pending_by_quality || {}).length === 0 ? (
                <div className="empty-state">No items pending backup</div>
              ) : (
                Object.entries(stats.pending_by_quality).map(([quality, count]) => (
                  <div key={quality} className="quality-bar-container">
                    <div className="quality-label">{quality}</div>
                    <div className="quality-bar">
                      <div
                        className="quality-fill pending"
                        style={{
                          width: `${(count / Math.max(...Object.values(stats.pending_by_quality))) * 100}%`
                        }}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Recently Added */}
          <div className="dashboard-section">
            <h3 className="section-title">Recently Added</h3>
            <div className="recent-list">
              {stats.recently_added.map(item => (
                <div key={item.id} className="recent-item">
                  {item.poster_path && (
                    <img 
                      src={`${TMDB_IMAGE_BASE}/w92${item.poster_path}`}
                      alt={item.title}
                      className="recent-poster"
                    />
                  )}
                  <div className="recent-info">
                    <div className="recent-title">{item.title}</div>
                    <div className="recent-type">{item.media_type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Top Rated */}
          <div className="dashboard-section">
            <h3 className="section-title">Top Rated</h3>
            <div className="top-rated-list">
              {stats.top_rated_by_user.map(item => (
                <div key={item.id} className="top-rated-item">
                  <div className="rating-badge">{item.user_rating}</div>
                  <div className="top-rated-title">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Media Detail Modal
  const MediaDetail = () => {
    if (!selectedMedia) return null;
    
    const formatRuntime = (minutes) => {
      if (!minutes) return 'N/A';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };
    
    return (
      <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}>
        <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{selectedMedia.title}</h2>
            <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="detail-content">
            <div className="detail-poster-section">
              {selectedMedia.poster_path ? (
                <img 
                  src={`${TMDB_IMAGE_BASE}/w342${selectedMedia.poster_path}`}
                  alt={selectedMedia.title}
                  className="detail-poster"
                />
              ) : (
                <div className="detail-poster-placeholder">
                  {selectedMedia.media_type === 'movie' ? <FilmIcon /> : <TvIcon />}
                </div>
              )}
              
              <div className="detail-quick-info">
                <div className="detail-badges">
                  {selectedMedia.seen && (
                    <span className="badge seen">Watched</span>
                  )}
                  {selectedMedia.backed_up === 'backed_up' && (
                    <span className="badge backed-up">Backed Up</span>
                  )}
                  {selectedMedia.quality && (
                    <span className="badge quality">{selectedMedia.quality}</span>
                  )}
                </div>
                
                {selectedMedia.user_rating && (
                  <div className="detail-rating">
                    <span>Your Rating:</span>
                    <strong>{selectedMedia.user_rating}/10</strong>
                  </div>
                )}
                
                {selectedMedia.tmdb_rating && (
                  <div className="detail-rating">
                    <span>TMDB:</span>
                    <strong>{parseFloat(selectedMedia.tmdb_rating).toFixed(1)}/10</strong>
                  </div>
                )}
              </div>
            </div>
            
            <div className="detail-info-section">
              {selectedMedia.original_title && selectedMedia.original_title !== selectedMedia.title && (
                <div className="detail-field">
                  <span className="detail-label">Original Title:</span>
                  <span className="detail-value">{selectedMedia.original_title}</span>
                </div>
              )}
              
              {selectedMedia.release_date && (
                <div className="detail-field">
                  <span className="detail-label">Release Date:</span>
                  <span className="detail-value">
                    {new Date(selectedMedia.release_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {selectedMedia.runtime && (
                <div className="detail-field">
                  <span className="detail-label">Runtime:</span>
                  <span className="detail-value">{formatRuntime(selectedMedia.runtime)}</span>
                </div>
              )}
              
              {selectedMedia.director && (
                <div className="detail-field">
                  <span className="detail-label">Director:</span>
                  <span className="detail-value">{selectedMedia.director}</span>
                </div>
              )}
              
              {selectedMedia.country && (
                <div className="detail-field">
                  <span className="detail-label">Country:</span>
                  <span className="detail-value">{selectedMedia.country}</span>
                </div>
              )}
              
              {selectedMedia.genres && selectedMedia.genres.length > 0 && (
                <div className="detail-field">
                  <span className="detail-label">Genres:</span>
                  <span className="detail-value">
                    {selectedMedia.genres.join(', ')}
                  </span>
                </div>
              )}
              
              {selectedMedia.overview && (
                <div className="detail-field detail-overview">
                  <span className="detail-label">Overview:</span>
                  <p className="detail-value">{selectedMedia.overview}</p>
                </div>
              )}
              
              {selectedMedia.cast_list && selectedMedia.cast_list.length > 0 && (
                <div className="detail-field">
                  <span className="detail-label">Cast:</span>
                  <div className="detail-cast-grid">
                    {selectedMedia.cast_list.slice(0, 6).map((person, idx) => (
                      <div key={idx} className="cast-item">
                        <strong>{person.name}</strong>
                        {person.character && <span> as {person.character}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="detail-divider"></div>
              
              <h3>Your Collection Details</h3>
              
              {selectedMedia.location && (
                <div className="detail-field">
                  <span className="detail-label">Storage Location:</span>
                  <span className="detail-value">{selectedMedia.location}</span>
                </div>
              )}
              
              {selectedMedia.file_size && (
                <div className="detail-field">
                  <span className="detail-label">File Size:</span>
                  <span className="detail-value">{selectedMedia.file_size}</span>
                </div>
              )}
              
              {selectedMedia.loaned_to && (
                <div className="detail-field">
                  <span className="detail-label">Loaned To:</span>
                  <span className="detail-value">{selectedMedia.loaned_to}</span>
                </div>
              )}
              
              {selectedMedia.date_watched && (
                <div className="detail-field">
                  <span className="detail-label">Date Watched:</span>
                  <span className="detail-value">
                    {new Date(selectedMedia.date_watched).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {selectedMedia.notes && (
                <div className="detail-field">
                  <span className="detail-label">Notes:</span>
                  <p className="detail-value">{selectedMedia.notes}</p>
                </div>
              )}
              
              {/* Episodes section for TV series */}
              {selectedMedia.media_type === 'tv_series' &&
                selectedMedia.episode_details &&
                selectedMedia.episode_details.length > 0 && (
                  <>
                    <div className="detail-divider"></div>
                    <h3>Episodes</h3>
                    <div className="detail-episodes-section">
                      <div className="detail-episodes-table-wrapper">
                        <table className="detail-episodes-table">
                          <thead>
                            <tr>
                              <th>Season</th>
                              <th>Episode</th>
                              <th>Title</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedMedia.episode_details.map((ep, idx) => (
                              <tr key={idx}>
                                <td>{ep.season_number != null ? ep.season_number : '-'}</td>
                                <td>{ep.episode_number != null ? ep.episode_number : '-'}</td>
                                <td>{ep.title || 'Episode'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              
              <div className="detail-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setEditingMedia(selectedMedia);
                    setShowDetailModal(false);
                    setShowAddModal(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => {
                    deleteMedia(selectedMedia.id);
                    setShowDetailModal(false);
                  }}
                >
                  Delete
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Sort media based on selected criteria
  const sortMedia = (mediaList) => {
    const sorted = [...mediaList];
    switch (sortBy) {
      case 'title':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'size':
        return sorted.sort((a, b) => {
          const sizeA = parseFloat(a.file_size) || 0;
          const sizeB = parseFloat(b.file_size) || 0;
          return sizeB - sizeA; // Descending order
        });
      case 'date_added':
      default:
        return sorted.sort((a, b) => new Date(b.date_added || 0) - new Date(a.date_added || 0));
    }
  };

  // Paginate media
  const paginateMedia = (mediaList) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return mediaList.slice(startIndex, endIndex);
  };

  // Get paginated and sorted media
  const getDisplayMedia = (mediaList) => {
    const sorted = sortMedia(mediaList);
    return paginateMedia(sorted);
  };

  // Calculate total pages
  const totalPages = Math.ceil(media.length / itemsPerPage);

  // Reset to page 1 when filters, search, or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, itemsPerPage]);

  // Export filtered media list to CSV
  const exportToCSV = () => {
    // Get the current filtered media (not paginated)
    const sorted = sortMedia(media);
    
    // Define CSV headers
    const headers = [
      'tmdb_id',
      'title',
      'original_title',
      'year',
      'watched',
      'backed_up',
      'storage',
      'size',
      'quality',
      'user_rating'
    ];
    
    // Convert media to CSV rows
    const rows = sorted.map(item => {
      const year = item.release_date ? new Date(item.release_date).getFullYear() : '';
      const watched = item.seen ? 'Yes' : 'No';
      const backedUp = item.backed_up === 'backed_up' ? 'Yes' : 
                       item.backed_up === 'pending' ? 'Pending' : 'No';
      
      return [
        item.tmdb_id || '',
        `"${(item.title || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${(item.original_title || '').replace(/"/g, '""')}"`,
        year,
        watched,
        backedUp,
        `"${(item.location || '').replace(/"/g, '""')}"`,
        item.file_size || '',
        item.quality || '',
        item.user_rating || ''
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `cinematheque_export_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Exported ${sorted.length} items to ${filename}`, 'success');
  };

  // Media List Component
  const MediaList = () => {
    const displayMedia = getDisplayMedia(media);
    
    return (
      <div className="media-list">
        <table className="media-table">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Title</th>
              <th>Type</th>
              <th>Year</th>
              <th>Rating</th>
              <th>Size</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayMedia.map(item => (
              <tr key={item.id} className="media-row">
                <td>
                  {item.poster_path ? (
                    <img 
                      src={`${TMDB_IMAGE_BASE}/w92${item.poster_path}`}
                      alt={item.title}
                      className="list-poster"
                      onClick={() => {
                        setSelectedMedia(item);
                        setShowDetailModal(true);
                      }}
                    />
                  ) : (
                    <div className="list-poster-placeholder">
                      {item.media_type === 'movie' ? <FilmIcon /> : <TvIcon />}
                    </div>
                  )}
                </td>
                <td>
                  <div className="list-title-wrapper">
                    <div 
                      className="list-title"
                      onClick={() => {
                        setSelectedMedia(item);
                        setShowDetailModal(true);
                      }}
                    >
                      <strong>{item.title}</strong>
                      {item.original_title && item.original_title !== item.title && (
                        <small className="list-original-title">{item.original_title}</small>
                      )}
                    </div>
                    <button 
                      className="list-title-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMedia(item.id);
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </td>
                <td>
                  <span className="list-type">
                    {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                  </span>
                </td>
                <td>
                  {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                </td>
                <td>
                  <div className="list-ratings">
                    {item.user_rating && (
                      <span className="rating-user">★ {item.user_rating}</span>
                    )}
                    {item.tmdb_rating && (
                      <span className="rating-tmdb">◆ {parseFloat(item.tmdb_rating).toFixed(1)}</span>
                    )}
                  </div>
                </td>
                <td>{item.file_size ? `${item.file_size} GB` : '-'}</td>
                <td>{item.location || '-'}</td>
                <td>
                  <div className="list-status">
                    {item.seen && <span className="status-icon seen" title="Watched">✓</span>}
                    {item.backed_up === 'backed_up' && <span className="status-icon backed" title="Backed Up">💾</span>}
                    {item.loaned_to && <span className="status-icon loaned" title={`Loaned to ${item.loaned_to}`}>📤</span>}
                  </div>
                </td>
                <td>
                  <div className="list-actions">
                    <button 
                      className="list-action-btn"
                      onClick={() => toggleSeen(item)}
                      title={item.seen ? 'Mark as unwatched' : 'Mark as watched'}
                    >
                      <CheckIcon />
                    </button>
                    <button 
                      className="list-action-btn"
                      onClick={() => toggleBackup(item)}
                      title="Toggle backup status"
                    >
                      <DiskIcon />
                    </button>
                    <button 
                      className="list-action-btn"
                      onClick={() => {
                        setEditingMedia(item);
                        setShowAddModal(true);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="list-action-btn delete"
                      onClick={() => deleteMedia(item.id)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Media Grid Component - with click to view details
  const MediaGrid = () => {
    const displayMedia = getDisplayMedia(media);
    
    return (
      <div className="media-grid">
        {displayMedia.map(item => (
          <div key={item.id} className="media-card">
            <div 
              className="media-poster-container"
              onClick={() => {
                setSelectedMedia(item);
                setShowDetailModal(true);
              }}
            >
              {item.poster_path ? (
                <img 
                  src={`${TMDB_IMAGE_BASE}/w342${item.poster_path}`}
                  alt={item.title}
                  className="media-poster"
                />
              ) : (
                <div className="media-poster-placeholder">
                  {item.media_type === 'movie' ? <FilmIcon /> : <TvIcon />}
                  <div>{item.title}</div>
                </div>
              )}
              
              <div className="media-overlay">
                <div className="media-badges">
                  {item.seen && (
                    <span className="badge seen" title="Watched">
                      <CheckIcon />
                    </span>
                  )}
                  {item.backed_up === 'backed_up' && (
                    <span className="badge backed-up" title="Backed up">
                      <DiskIcon />
                    </span>
                  )}
                  {item.quality && (
                    <span className="badge quality">{item.quality}</span>
                  )}
                </div>
                
                <div className="media-actions">
                  <button 
                    className="action-btn"
                    onClick={() => toggleSeen(item)}
                    title={item.seen ? 'Mark as unwatched' : 'Mark as watched'}
                  >
                    <CheckIcon />
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => toggleBackup(item)}
                    title="Toggle backup status"
                  >
                    <DiskIcon />
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => {
                      setEditingMedia(item);
                      setShowAddModal(true);
                    }}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => deleteMedia(item.id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            
            <div className="media-info">
              <h3 className="media-title">{item.title}</h3>
              <div className="media-meta">
                <span className="media-year">
                  {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                </span>
                {item.user_rating && (
                  <span className="media-rating">
                    <StarIcon filled={true} /> {item.user_rating}/10
                  </span>
                )}
              </div>
              {item.loaned_to && (
                <div className="media-loaned">Loaned to: {item.loaned_to}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, media.length)} of {media.length} items
        </div>
        
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {getPageNumbers().map((page, idx) => (
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          ))}
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
        
        <div className="pagination-size">
          <label>Items per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="pagination-select"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    );
  };

  // Add/Edit Modal - Memoized to prevent re-renders
  const MediaModal = React.memo(() => {
    console.log('MediaModal rendered/re-rendered');
    
    // Track mount/unmount
    useEffect(() => {
      console.log('MediaModal mounted');
      return () => {
        console.log('MediaModal unmounted');
        // Clean up any pending search timeout
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, []);
    
    // Convert cast to cast_list when editing
    let initialCastList = [];
    if (editingMedia && editingMedia.cast_list) {
      initialCastList = editingMedia.cast_list.map(member => ({
        name: member.name || '',
        character: member.character || ''
      }));
    }
    
    const [formData, setFormData] = useState(
      editingMedia ? {
        ...editingMedia,
        genres: editingMedia.genres || [],
        cast_list: editingMedia.cast_list || [],
        crew: editingMedia.crew || [],
        director: editingMedia.director || '',
        original_title: editingMedia.original_title || '',
        cast_names: editingMedia.cast_names || '',
        cast_list: initialCastList,
        country: editingMedia.country || '',
        file_size: editingMedia.file_size || '',
        episode_details: editingMedia.episode_details || []
      } : {
        title: '',
        original_title: '',
        media_type: 'movie',
        seen: false,
        user_rating: null,
        loaned_to: '',
        backed_up: 'not_backed_up',
        quality: '',
        notes: '',
        location: '',
        genres: [],
        cast_list: [],
        crew: [],
        director: '',
        cast_names: '',
        cast_list: [],
        country: '',
        file_size: '',
        release_date: '',
        runtime: null,
        overview: '',
        poster_path: '',
        backdrop_path: '',
        tmdb_rating: null,
        tmdb_id: null,
        seasons: null,
        episodes: null,
        episode_details: []
      }
    );
    const [tmdbQuery, setTmdbQuery] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [localTmdbResults, setLocalTmdbResults] = useState([]);
    
    // Debounce ref to prevent rapid clicks
    const searchTimeoutRef = useRef(null);
    
    const handleTmdbSearch = async (e) => {
      if (e) e.preventDefault();
      
      // Clear any pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Prevent multiple simultaneous searches
      if (isImporting) {
        console.log('Search already in progress, ignoring');
        return;
      }
      
      const searchTerm = tmdbQuery || formData.title;
      if (!searchTerm) {
        showNotification('Please enter a title to search', 'error');
        return;
      }
      
      // Debounce - wait 300ms before actually searching
      searchTimeoutRef.current = setTimeout(async () => {
        console.log('MediaModal: Executing TMDB search for:', searchTerm);
        setIsImporting(true);
      
      try {
        const url = `${API_BASE}/tmdb/search?query=${encodeURIComponent(searchTerm)}&media_type=${formData.media_type}`;
        console.log('Making single TMDB request to:', url);
        
        // Single request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 429) {
            showNotification('Too many requests. Please wait a moment.', 'warning');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('TMDB response received:', data);
        
        if (data.error) {
          showNotification(data.error, 'error');
          // Don't clear existing results
        } else if (data.results && data.results.length > 0) {
          setLocalTmdbResults(data.results);
          showNotification(`Found ${data.results.length} results`, 'success');
        } else {
          setLocalTmdbResults([]);
          showNotification('No results found. Try different keywords.', 'info');
        }
      } catch (error) {
        console.error('TMDB search error:', error);
        if (error.name === 'AbortError') {
          showNotification('Search timed out. Please try again.', 'error');
        } else {
          showNotification('Search failed. You can still add manually.', 'warning');
        }
        // Don't clear existing results on error
      } finally {
        setIsImporting(false);
      }
      }, 300);  // End of setTimeout for debounce
    };
    
    const handleTmdbSelect = async (item) => {
      console.log('Selected TMDB item:', item);
      
      // Don't reset the form or close anything
      setIsImporting(true);
      
      try {
        const details = await getTMDBDetails(item.tmdb_id, formData.media_type);
        
        if (details) {
          console.log('Processing TMDB details:', details);
          
          // Extract director from crew
          const director = details.crew?.find(person => person.job === 'Director');
          
          // Format cast as array of objects with name and character
          const castList = details.cast_list?.slice(0, 10).map(person => ({
            name: person.name || '',
            character: person.character || ''
          })) || [];
          
          // Format release_date for date input (YYYY-MM-DD)
          let formattedReleaseDate = details.release_date || '';
          if (formattedReleaseDate && formattedReleaseDate.length >= 10) {
            formattedReleaseDate = formattedReleaseDate.substring(0, 10);
          }
          
          // Merge TMDB data with existing form data (don't replace everything)
          setFormData(prevData => {
            // 1) Original Title should be the title fetched from TMDB
            const tmdbOriginalTitle = details.original_title || details.title || '';
            
            // 2) Title should keep the user's input if present;
            //    if empty, fall back to the TMDB original title
            const userTitle = (prevData.title && prevData.title.trim()) ? prevData.title : '';
            const finalTitle = userTitle || tmdbOriginalTitle || prevData.title || '';
            const finalOriginalTitle = tmdbOriginalTitle || prevData.original_title || userTitle || prevData.original_title || '';

            const updatedData = {
              ...prevData,  // Keep ALL existing data
              tmdb_id: details.tmdb_id || prevData.tmdb_id,
              title: finalTitle,
              original_title: finalOriginalTitle,
              overview: details.overview || prevData.overview,
              release_date: formattedReleaseDate || prevData.release_date,
              runtime: details.runtime || prevData.runtime,
              genres: Array.isArray(details.genres) ? details.genres : (details.genres ? [details.genres] : prevData.genres || []),
              poster_path: details.poster_path || prevData.poster_path,
              backdrop_path: details.backdrop_path || prevData.backdrop_path,
              tmdb_rating: details.tmdb_rating || prevData.tmdb_rating,
              tmdb_vote_count: details.tmdb_vote_count || prevData.tmdb_vote_count,
              crew: details.crew || prevData.crew,
              director: director?.name || prevData.director,
              cast_list: castList.length > 0 ? castList : prevData.cast_list,
              // 3) Country from TMDB details
              country: details.country || prevData.country,
              // 4) TV series: seasons & episode count
              seasons: details.seasons !== undefined ? details.seasons : prevData.seasons,
              episodes: details.episodes !== undefined ? details.episodes : prevData.episodes,
              // 5) Episode-level details from TMDB (if provided)
              episode_details: Array.isArray(details.episode_details)
                ? details.episode_details
                : (prevData.episode_details || [])
            };
            
            console.log('Updated formData:', updatedData);
            return updatedData;
          });
          
          console.log('TMDB data merged successfully');
          showNotification('TMDB data imported! Review and save.', 'success');
        } else {
          console.log('No details returned, keeping form data as is');
          showNotification('Could not import TMDB data. You can continue manually.', 'warning');
        }
        
        // Clear local search results but keep search query
        setLocalTmdbResults([]);
        
      } catch (error) {
        console.error('Error importing TMDB data:', error);
        showNotification('Error importing data. Your entered information is preserved.', 'warning');
        // Don't reset anything on error
      } finally {
        setIsImporting(false);
      }
    };
    
    const handleSubmit = (e) => {
      e.preventDefault(); // Always prevent form submission
      e.stopPropagation(); // Stop event bubbling
      
      console.log('Form submission attempted');
      console.log('Form data:', formData);
      
      if (!formData.title) {
        showNotification('Please enter a title', 'error');
        return;
      }
      saveMedia(formData);
    };
    
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission on Enter
        e.stopPropagation();
        if (e.target.name === 'tmdb-search' && (tmdbQuery || formData.title)) {
          handleTmdbSearch(e);
        }
      }
    };
    
    return (
      <div className={`modal-backdrop ${isModalClosing ? 'closing' : ''}`} onClick={() => closeAddModal()}>
        <div className={`modal ${isModalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{editingMedia ? 'Edit Media' : 'Add New Media'}</h2>
            <button className="modal-close" onClick={() => closeAddModal()}>×</button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit} className="media-form" noValidate>
            {/* Show selected TMDB poster if available */}
            {formData.poster_path && (
              <div className="selected-poster-preview">
                <img 
                  src={`${TMDB_IMAGE_BASE}/w200${formData.poster_path}`}
                  alt={formData.title}
                  className="poster-preview"
                />
                <div className="poster-details">
                  <h3>{formData.title}</h3>
                  {formData.release_date && (
                    <p>Release: {new Date(formData.release_date).getFullYear()}</p>
                  )}
                  {formData.tmdb_rating && (
                    <p>TMDB Rating: {parseFloat(formData.tmdb_rating).toFixed(1)}/10</p>
                  )}
                  {formData.genres && formData.genres.length > 0 && (
                    <p>Genres: {formData.genres.join(', ')}</p>
                  )}
                  {formData.runtime && (
                    <p>Runtime: {formData.runtime} minutes</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="form-section">
              <h3>Search TMDB (Optional)</h3>
              <p className="form-hint">Choose Movie or TV Series, search TMDB to auto-fill details, or enter them manually below</p>
              <div className="tmdb-search">
                <select 
                  value={formData.media_type}
                  onChange={(e) => setFormData({...formData, media_type: e.target.value})}
                  className="form-select tmdb-type-select"
                >
                  <option value="movie">Movie</option>
                  <option value="tv_series">TV Series</option>
                </select>
                <input
                  type="text"
                  name="tmdb-search"
                  placeholder="Search TMDB (optional)..."
                  value={tmdbQuery}
                  onChange={(e) => setTmdbQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input"
                />
                <button 
                  type="button" 
                  onClick={(e) => handleTmdbSearch(e)} 
                  className="btn-search"
                  disabled={(!tmdbQuery && !formData.title) || isImporting}
                >
                  {isImporting ? '...' : <SearchIcon />}
                </button>
              </div>
              
              {localTmdbResults.length > 0 && (
                <div className="tmdb-results">
                  {localTmdbResults.map(item => (
                    <div 
                      key={item.tmdb_id}
                      className="tmdb-result"
                      onClick={() => handleTmdbSelect(item)}
                    >
                      {item.poster_path && (
                        <img 
                          src={`${TMDB_IMAGE_BASE}/w92${item.poster_path}`}
                          alt={item.title}
                        />
                      )}
                      <div className="tmdb-result-info">
                        <div className="tmdb-result-title">{item.title}</div>
                        <div className="tmdb-result-year">
                          {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                        </div>
                        {item.vote_average > 0 && (
                          <div className="tmdb-result-rating">
                            ★ {item.vote_average.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Original/Local Title"
                  value={formData.original_title || ''}
                  onChange={(e) => setFormData({...formData, original_title: e.target.value})}
                  className="form-input"
                  title="The title you know it by (if different from official title)"
                />
              </div>
              
              <div className="form-row">
                <input
                  type="date"
                  placeholder="Release Date"
                  value={formData.release_date || ''}
                  onChange={(e) => setFormData({...formData, release_date: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Runtime (minutes)"
                  value={formData.runtime !== null && formData.runtime !== undefined ? formData.runtime : ''}
                  onChange={(e) => setFormData({...formData, runtime: e.target.value ? parseInt(e.target.value) : null})}
                  className="form-input"
                />
                {formData.media_type === 'tv_series' && (
                  <>
                    <input
                      type="number"
                      placeholder="Seasons"
                      value={formData.seasons !== null && formData.seasons !== undefined ? formData.seasons : ''}
                      onChange={(e) => setFormData({...formData, seasons: e.target.value ? parseInt(e.target.value) : null})}
                      className="form-input"
                    />
                    <input
                      type="number"
                      placeholder="Episodes"
                      value={formData.episodes !== null && formData.episodes !== undefined ? formData.episodes : ''}
                      onChange={(e) => setFormData({...formData, episodes: e.target.value ? parseInt(e.target.value) : null})}
                      className="form-input"
                    />
                  </>
                )}
              </div>
              
              <textarea
                placeholder="Overview / Description"
                value={formData.overview || ''}
                onChange={(e) => setFormData({...formData, overview: e.target.value})}
                className="form-textarea"
                rows="3"
              />
              
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Director"
                  value={formData.director || ''}
                  onChange={(e) => setFormData({...formData, director: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Genres (comma separated, e.g., Action, Drama, Thriller)"
                  value={Array.isArray(formData.genres) ? formData.genres.join(', ') : formData.genres || ''}
                  onChange={(e) => {
                    const genreString = e.target.value;
                    // Only split on actual submission or when user is done typing
                    // Keep the string as-is while typing
                    setFormData({...formData, genres: genreString});
                  }}
                  onBlur={(e) => {
                    // Split into array when user leaves the field
                    const genreString = e.target.value;
                    const genreArray = genreString.split(',').map(g => g.trim()).filter(g => g);
                    setFormData({...formData, genres: genreArray});
                  }}
                  className="form-input"
                  style={{flex: 2}}
                />
                <input
                  type="number"
                  placeholder="TMDB Rating"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.tmdb_rating !== null && formData.tmdb_rating !== undefined ? formData.tmdb_rating : ''}
                  onChange={(e) => setFormData({...formData, tmdb_rating: e.target.value ? parseFloat(e.target.value) : null})}
                  className="form-input"
                />
              </div>
              
              <div className="form-section-subsection">
                <h4>Cast & Characters</h4>
                <div className="cast-table">
                  <div className="cast-header">
                    <span>Actor Name</span>
                    <span>Character</span>
                    <span></span>
                  </div>
                  {(formData.cast_list || []).map((castMember, index) => (
                    <div key={index} className="cast-row">
                      <input
                        type="text"
                        placeholder="Actor name"
                        value={castMember.name || ''}
                        onChange={(e) => {
                          const newCastList = [...(formData.cast_list || [])];
                          newCastList[index] = {...newCastList[index], name: e.target.value};
                          setFormData({...formData, cast_list: newCastList});
                        }}
                        className="form-input cast-input"
                      />
                      <input
                        type="text"
                        placeholder="Character name"
                        value={castMember.character || ''}
                        onChange={(e) => {
                          const newCastList = [...(formData.cast_list || [])];
                          newCastList[index] = {...newCastList[index], character: e.target.value};
                          setFormData({...formData, cast_list: newCastList});
                        }}
                        className="form-input cast-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newCastList = formData.cast_list.filter((_, i) => i !== index);
                          setFormData({...formData, cast_list: newCastList});
                        }}
                        className="btn-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newCastList = [...(formData.cast_list || []), {name: '', character: ''}];
                      setFormData({...formData, cast_list: newCastList});
                    }}
                    className="btn-add-cast"
                  >
                    + Add Cast Member
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Custom Fields</h3>
              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.seen}
                    onChange={(e) => setFormData({...formData, seen: e.target.checked})}
                  />
                  <span>Watched</span>
                </label>
                
                <select
                  value={formData.backed_up}
                  onChange={(e) => setFormData({...formData, backed_up: e.target.value})}
                  className="form-select"
                >
                  <option value="not_backed_up">Not Backed Up</option>
                  <option value="backed_up">Backed Up</option>
                  <option value="pending">Pending</option>
                </select>
                
                <select
                  value={formData.quality || ''}
                  onChange={(e) => setFormData({...formData, quality: e.target.value})}
                  className="form-select"
                >
                  <option value="">Quality</option>
                  <option value="SD">SD</option>
                  <option value="HD">HD</option>
                  <option value="FHD">Full HD</option>
                  <option value="4K">4K</option>
                  <option value="8K">8K</option>
                </select>
              </div>
              
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Your Rating (0-10)"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.user_rating !== null && formData.user_rating !== undefined ? formData.user_rating : ''}
                  onChange={(e) => setFormData({...formData, user_rating: e.target.value ? parseFloat(e.target.value) : null})}
                  className="form-input"
                />
                
                <input
                  type="text"
                  placeholder="Loaned to"
                  value={formData.loaned_to || ''}
                  onChange={(e) => setFormData({...formData, loaned_to: e.target.value})}
                  className="form-input"
                />
                
                <input
                  type="text"
                  placeholder="Storage Location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="form-input"
                />
                
                <input
                  type="text"
                  placeholder="File Size (e.g., 4.5 GB)"
                  value={formData.file_size || ''}
                  onChange={(e) => setFormData({...formData, file_size: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <textarea
                placeholder="Notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="form-textarea"
                rows="3"
              />
            </div>
            
            {/* Episode Details Section - Separate with divider */}
            {formData.media_type === 'tv_series' && (
              <div className="form-section episode-section">
                <div className="episode-section-header">
                  <h3>Episodes</h3>
                  <p className="form-hint">
                    Capture specific episodes you care about (e.g. pilots, finales, favourite episodes).
                  </p>
                </div>
                
                {formData.episode_details && formData.episode_details.length > 5 && (
                  <div className="episode-more-note">
                    Showing first 5 episodes. All episodes will still be saved.
                  </div>
                )}
                
                <div className="episode-cards-container">
                  {(formData.episode_details || []).slice(0, 5).map((ep, index) => (
                    <div key={index} className="episode-card">
                      <div className="episode-card-inputs">
                        <div className="episode-numbers">
                          <input
                            type="number"
                            placeholder="Season #"
                            value={ep.season_number ?? ''}
                            onChange={(e) => {
                              const newEpisodes = [...(formData.episode_details || [])];
                              newEpisodes[index] = {
                                ...newEpisodes[index],
                                season_number: e.target.value ? parseInt(e.target.value, 10) : null
                              };
                              setFormData({ ...formData, episode_details: newEpisodes });
                            }}
                            className="form-input episode-number-input"
                          />
                          <input
                            type="number"
                            placeholder="Episode #"
                            value={ep.episode_number ?? ''}
                            onChange={(e) => {
                              const newEpisodes = [...(formData.episode_details || [])];
                              newEpisodes[index] = {
                                ...newEpisodes[index],
                                episode_number: e.target.value ? parseInt(e.target.value, 10) : null
                              };
                              setFormData({ ...formData, episode_details: newEpisodes });
                            }}
                            className="form-input episode-number-input"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Episode title"
                          value={ep.title || ''}
                          onChange={(e) => {
                            const newEpisodes = [...(formData.episode_details || [])];
                            newEpisodes[index] = {
                              ...newEpisodes[index],
                              title: e.target.value
                            };
                            setFormData({ ...formData, episode_details: newEpisodes });
                          }}
                          className="form-input episode-title-input"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newEpisodes = (formData.episode_details || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, episode_details: newEpisodes });
                        }}
                        className="btn-remove-episode"
                        title="Remove episode"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const newEpisodes = [
                      ...(formData.episode_details || []),
                      { season_number: null, episode_number: null, title: '' }
                    ];
                    setFormData({ ...formData, episode_details: newEpisodes });
                  }}
                  className="btn-add-episode"
                >
                  + Add Episode
                </button>
              </div>
            )}
            
            <div className="form-actions">
              <button type="button" onClick={() => closeAddModal()} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingMedia ? 'Update' : 'Add'} Media
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    );
  });  // End of MediaModal React.memo

  // Login Component
  const LoginPage = () => {
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoggingIn(true);
      await handleLogin(loginUsername, loginPassword, rememberMe);
      setIsLoggingIn(false);
    };

    return (
      <div className="login-page">
        <div className="film-grain"></div>
        <div className="login-container">
          <div className="login-header">
            <FilmIcon />
            <h1>CINEMATHEQUE</h1>
            <p>Media Collection Manager</p>
          </div>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>
            
            <div className="login-remember">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            </div>
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Show loading screen while checking auth
  if (checkingAuth) {
    return (
      <div className="loading-container">
        <div className="film-reel-loader">
          <div className="reel"></div>
          <div className="reel"></div>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Main app (only shown when authenticated)
  return (
    <div className="app">
      <div className="film-grain"></div>
      
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <FilmIcon />
            <span>CINEMATHEQUE</span>
          </div>
          
          <nav className="nav">
            <button 
              className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${activeView === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveView('collection')}
            >
              Collection
            </button>
          </nav>
          
          <div className="header-user-menu">
            <button 
              className="user-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              title="User Menu"
            >
              <UserIcon />
            </button>
            
            {showUserMenu && (
              <div 
                className="user-menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="user-menu-header">
                  <UserIcon />
                  <span className="user-menu-name">{username}</span>
                </div>
                
                <button 
                  className="user-menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    setEditingMedia(null); // Clear any editing state
                    setShowAddModal(true);
                  }}
                >
                  <span className="user-menu-icon">+</span>
                  Add Media
                </button>
                
                <button 
                  className="user-menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    exportToCSV();
                  }}
                >
                  <DownloadIcon />
                  Export to CSV
                </button>
                
                <div className="user-menu-divider"></div>
                
                <button 
                  className="user-menu-logout"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    await handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Mobile user FAB button - bottom right */}
      <button 
        className="user-btn-mobile" 
        onClick={(e) => {
          e.stopPropagation();
          setShowUserMenu(!showUserMenu);
        }}
        title="User Menu"
      >
        <UserIcon />
      </button>
      
      {activeView === 'collection' && (
        <div className="filters">
          <div className="search-bar">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search title, notes, or storage location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-chips">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="2"/>
                  <rect x="3" y="11" width="18" height="2"/>
                  <rect x="3" y="18" width="18" height="2"/>
                </svg>
              </button>
            </div>
            
            <div className="filter-select-group">
              <select 
                value={filters.mediaType}
                onChange={(e) => setFilters({...filters, mediaType: e.target.value})}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="movie">Movies</option>
                <option value="tv_series">TV Series</option>
              </select>
              
              <select 
                value={filters.seen}
                onChange={(e) => setFilters({...filters, seen: e.target.value})}
                className="filter-select"
              >
                <option value="all">All Items</option>
                <option value="seen">Watched</option>
                <option value="unseen">Unwatched</option>
              </select>
              
              <select 
                value={filters.backedUp}
                onChange={(e) => setFilters({...filters, backedUp: e.target.value})}
                className="filter-select"
              >
                <option value="all">All Backup Status</option>
                <option value="backed_up">Backed Up</option>
                <option value="not_backed_up">Not Backed Up</option>
                <option value="pending">Pending</option>
              </select>
              
              <select 
                value={filters.quality}
                onChange={(e) => setFilters({...filters, quality: e.target.value})}
                className="filter-select"
              >
                <option value="all">All Qualities</option>
                <option value="SD">SD</option>
                <option value="HD">HD</option>
                <option value="FHD">Full HD</option>
                <option value="4K">4K</option>
                <option value="8K">8K</option>
              </select>
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date_added">Sort: Date Added</option>
                <option value="title">Sort: Title</option>
                <option value="size">Sort: Size</option>
              </select>
            </div>

            <button
              type="button"
              className="mobile-filters-btn"
              onClick={() => setShowMobileFilters(true)}
            >
              Filters &amp; Sort
            </button>
          </div>
        </div>
      )}
      
      <main className="main">
        {loading ? (
          <div className="loading-container">
            <div className="film-reel-loader">
              <div className="reel"></div>
              <div className="reel"></div>
            </div>
            <p>Loading your collection...</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' ? <Dashboard /> : 
             viewMode === 'list' ? <MediaList /> : <MediaGrid />}
            {activeView === 'collection' && <Pagination />}
          </>
        )}
      </main>
      
      {showAddModal && <MediaModal />}
      {showDetailModal && <MediaDetail />}
      {showMobileFilters && (
        <div className="modal-backdrop" onClick={() => setShowMobileFilters(false)}>
          <div className="modal mobile-filters-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Filters &amp; Sort</h2>
              <button className="modal-close" onClick={() => setShowMobileFilters(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="media-form">
                <div className="form-section">
                  <h3>Filter Collection</h3>
                  <div className="form-row">
                    <div className="mobile-filter-field">
                      <label>Type</label>
                      <select
                        value={filters.mediaType}
                        onChange={(e) => setFilters({...filters, mediaType: e.target.value})}
                        className="form-select"
                      >
                        <option value="all">All Types</option>
                        <option value="movie">Movies</option>
                        <option value="tv_series">TV Series</option>
                      </select>
                    </div>
                    <div className="mobile-filter-field">
                      <label>Watched</label>
                      <select
                        value={filters.seen}
                        onChange={(e) => setFilters({...filters, seen: e.target.value})}
                        className="form-select"
                      >
                        <option value="all">All Items</option>
                        <option value="seen">Watched</option>
                        <option value="unseen">Unwatched</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="mobile-filter-field">
                      <label>Backup</label>
                      <select
                        value={filters.backedUp}
                        onChange={(e) => setFilters({...filters, backedUp: e.target.value})}
                        className="form-select"
                      >
                        <option value="all">All</option>
                        <option value="backed_up">Backed Up</option>
                        <option value="not_backed_up">Not Backed Up</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div className="mobile-filter-field">
                      <label>Quality</label>
                      <select
                        value={filters.quality}
                        onChange={(e) => setFilters({...filters, quality: e.target.value})}
                        className="form-select"
                      >
                        <option value="all">All</option>
                        <option value="SD">SD</option>
                        <option value="HD">HD</option>
                        <option value="FHD">Full HD</option>
                        <option value="4K">4K</option>
                        <option value="8K">8K</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="form-section">
                  <h3>Sort</h3>
                  <div className="form-row">
                    <div className="mobile-filter-field">
                      <label>Order By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-select"
                      >
                        <option value="date_added">Date Added</option>
                        <option value="title">Title</option>
                        <option value="size">Size</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowMobileFilters(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
