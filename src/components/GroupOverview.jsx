import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChatCalls } from "../api";
import { DATA_REFRESH_INTERVAL } from "../Constants";
import { createUserFriendlyErrorMessage } from "../utils/errorUtils";
import "../App.css";

const GroupOverview = () => {
  const { groupName } = useParams();
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const loadData = async (isRetry = false) => {
    try {
      setLoading(true);
      setError("");

      console.log(
        ">>> GroupOverview: Loading data for group:",
        groupName,
        isRetry ? "(retry attempt)" : "",
      );

      const data = await fetchChatCalls(groupName);

      // Extract calls and chat info from the API response
      setCalls(data.calls);
      setChatInfo(data.chat);
      setRetryCount(0); // Reset retry count on success

      console.log(
        ">>> GroupOverview: Successfully loaded",
        data.calls.length,
        "calls for group:",
        groupName,
      );
      console.log(">>> GroupOverview: Chat info:", data.chat);
    } catch (err) {
      console.error(">>> GroupOverview: Error loading group data:", err);

      // Provide user-friendly error messages
      const userMessage = createUserFriendlyErrorMessage(err, "group data");

      setError(userMessage);

      // Increment retry count for failed attempts
      if (!isRetry) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      // Only retry automatically if we have an error and haven't exceeded retry limit
      if (error && retryCount < 3) {
        console.log(
          ">>> GroupOverview: Auto-retrying due to error (attempt",
          retryCount + 1,
          "of 3)",
        );
        loadData(true);
      } else if (!error) {
        // Normal refresh when no error
        loadData();
      }
    }, DATA_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [groupName, error, retryCount]);

  // Manual retry function
  const handleRetry = () => {
    console.log(">>> GroupOverview: Manual retry requested");
    setRetryCount(0);
    loadData();
  };

  // Navigate to detailed view
  const handleViewDetails = () => {
    navigate(`/group/${groupName}/page`);
  };

  // Navigate back to main groups list
  const handleBackToGroups = () => {
    navigate("/");
  };

  // Show loading state
  if (loading && calls.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading group overview for {groupName}...</p>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="error-container">
        <div className="error-banner">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Unable to Load Group Overview</h3>
            <p>{error}</p>
            {retryCount > 0 && (
              <p className="retry-info">Retry attempts: {retryCount}/3</p>
            )}
            <button
              onClick={handleRetry}
              className="retry-button"
              disabled={loading}
            >
              {loading ? "Retrying..." : "Try Again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group-overview">
      <div className="navigation-bar">
        <button onClick={handleBackToGroups} className="back-button">
          ← Back to Groups
        </button>
      </div>

      <h1>{chatInfo?.title || groupName} - Overview</h1>
      {chatInfo?.username && (
        <p className="chat-username">@{chatInfo.username}</p>
      )}

      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-label">Total Calls:</span>
          <span className="stat-value">{calls.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Latest Call:</span>
          <span className="stat-value">
            {calls.length > 0
              ? new Date(calls[0].message_date * 1000).toLocaleString()
              : "No calls"}
          </span>
        </div>
      </div>

      <div className="overview-actions">
        <button onClick={handleViewDetails} className="view-details-button">
          View Detailed Calls
        </button>
      </div>

      <div className="quick-summary">
        <h2>Quick Summary</h2>
        {calls.length === 0 ? (
          <div className="no-data">
            <p>No calls found for this group</p>
            <p className="help-text">
              This could mean there are no recent calls for {groupName} or the
              data is empty.
            </p>
          </div>
        ) : (
          <div className="summary-stats">
            <p>This group has {calls.length} total calls.</p>
            <p>
              Click "View Detailed Calls" to see the full call history with
              performance metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupOverview;
