import React, { useEffect, useState } from "react";
import { fetchInfo } from "../api";
import { DATA_REFRESH_INTERVAL } from "../Constants";
import { createUserFriendlyErrorMessage } from "../utils/errorUtils";
import "../App.css";

const formatRunningTime = (seconds) => {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0)
    parts.push(`${hours.toString().padStart(2, "0")}h`);
  if (minutes > 0 || hours > 0 || days > 0)
    parts.push(`${minutes.toString().padStart(2, "0")}m`);
  parts.push(`${remainingSeconds.toString().padStart(2, "0")}s`);

  return parts.join(":");
};

const Info = () => {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const loadInfo = async (isRetry = false) => {
    try {
      setLoading(true);
      setError("");

      console.log(
        ">>> Info: Loading info data...",
        isRetry ? "(retry attempt)" : "",
      );

      const data = await fetchInfo();
      console.log(">>> Info data received:", JSON.stringify(data, null, 2));
      setInfo(data);
      setRetryCount(0); // Reset retry count on success

      console.log(">>> Info: Successfully loaded info data");
    } catch (err) {
      console.error(">>> Info: Error loading info:", err);

      // Provide user-friendly error messages
      const userMessage = createUserFriendlyErrorMessage(err, "info");

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
    loadInfo();
    const interval = setInterval(() => {
      // Only retry automatically if we have an error and haven't exceeded retry limit
      if (error && retryCount < 3) {
        console.log(
          ">>> Info: Auto-retrying due to error (attempt",
          retryCount + 1,
          "of 3)",
        );
        loadInfo(true);
      } else if (!error) {
        // Normal refresh when no error
        loadInfo();
      }
    }, DATA_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [error, retryCount]);

  // Manual retry function
  const handleRetry = () => {
    console.log(">>> Info: Manual retry requested");
    setRetryCount(0);
    loadInfo();
  };

  // Show loading state
  if (loading && !info) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading system information...</p>
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
            <h3>Unable to Load System Information</h3>
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
    <div className="info-container">
      <h2>System Information</h2>
      <div className="info-card">
        <div className="info-item">
          <span className="info-label">Server Start Time:</span>
          <span className="info-value">
            {(() => {
              if (!info.serverStartTime) return "N/A";
              const date = new Date(info.serverStartTime);
              return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
            })()}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Contracts Found:</span>
          <span className="info-value">{info.scraperStats.totalCAFound}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Messages:</span>
          <span className="info-value">
            {info.scraperStats.totalMessagesRead}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Running time:</span>
          <span className="info-value">
            {formatRunningTime(info.uptime.totalSeconds)}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Uptime:</span>
          <span className="info-value">
            {info.uptime.days}d {info.uptime.hours}h {info.uptime.minutes}m{" "}
            {info.uptime.seconds}s
          </span>
        </div>
      </div>

      <h3>Database Statistics</h3>
      <div className="info-card">
        <div className="info-item">
          <span className="info-label">Total Calls in Database:</span>
          <span className="info-value">
            {info.databaseStats.totalCalls.toLocaleString()}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Chats in Database:</span>
          <span className="info-value">
            {info.databaseStats.totalChats.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Info;
