import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChatCalls } from "../api";
import { DATA_REFRESH_INTERVAL } from "../Constants";
import { createUserFriendlyErrorMessage } from "../utils/errorUtils";
import "../App.css";

// Pure helper: calculate average performance across available timeframes
const calculateAveragePerformance = (call) => {
  const values = [
    call.performance_1m,
    call.performance_5m,
    call.performance_15m,
  ].filter((val) => val !== null && val !== undefined);

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

const GroupPage = () => {
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
        ">>> GroupPage: Loading detailed data for group:",
        groupName,
        isRetry ? "(retry attempt)" : "",
      );

      const data = await fetchChatCalls(groupName);

      // Extract calls and chat info from the API response
      setCalls(data.calls);
      setChatInfo(data.chat);
      setRetryCount(0); // Reset retry count on success

      console.log(
        ">>> GroupPage: Successfully loaded",
        data.calls.length,
        "calls for group:",
        groupName,
      );
      console.log(">>> GroupPage: Chat info:", data.chat);
    } catch (err) {
      console.error(">>> GroupPage: Error loading group data:", err);

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
          ">>> GroupPage: Auto-retrying due to error (attempt",
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
    console.log(">>> GroupPage: Manual retry requested");
    setRetryCount(0);
    loadData();
  };

  // Navigate back to main groups list
  const handleBackToGroups = () => {
    navigate("/");
  };

  // Helper function to format performance data safely
  const formatPerformance = (value) => {
    if (value == null || value === undefined) {
      return "N/A";
    }
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Helper function to get performance class for styling
  const getPerformanceClass = (value) => {
    if (value == null || value === undefined) {
      return "neutral";
    }
    return value >= 0 ? "positive" : "negative";
  };

  // Memoize performance calculations to avoid unnecessary recalculations
  const performanceData = useMemo(() => {
    if (calls.length === 0) {
      return { bestCallWithAvg: null, worstCallWithAvg: null };
    }

    // Calculate best and worst performer calls once to avoid redundant calculations
    const validCalls = calls.filter(
      (call) =>
        call.performance_1m != null ||
        call.performance_5m != null ||
        call.performance_15m != null,
    );

    // Precompute average performance for each call to avoid redundant calculations
    const callsWithAvg = validCalls.map((call) => ({
      call,
      avg: calculateAveragePerformance(call),
    }));

    const bestCallWithAvg =
      callsWithAvg.length > 0
        ? callsWithAvg.reduce((best, current) =>
            current.avg > best.avg ? current : best,
          )
        : null;

    const worstCallWithAvg =
      callsWithAvg.length > 0
        ? callsWithAvg.reduce((worst, current) =>
            current.avg < worst.avg ? current : worst,
          )
        : null;

    return { bestCallWithAvg, worstCallWithAvg };
  }, [calls]);

  // Show loading state
  if (loading && calls.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading detailed data for {groupName}...</p>
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
            <h3>Unable to Load Group Details</h3>
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
    <div className="group-page">
      <div className="page-header">
        <h1>{chatInfo?.title || groupName} - Detailed Calls</h1>
        {chatInfo?.username && (
          <p className="chat-username">@{chatInfo.username}</p>
        )}
      </div>

      <div className="navigation-bar">
        <button onClick={handleBackToGroups} className="back-button">
          ← Back to Groups
        </button>
      </div>

      {/* Performance Summary Section */}
      {calls.length > 0 && (
        <div className="performance-summary">
          <h2>Performance Overview</h2>

          {/* Best and Worst Performing Tokens */}
          <div className="performance-tokens">
            <div className="best-token">
              <h3>Best Performer</h3>
              <div className="token-info">
                <div className="token-address">
                  {performanceData.bestCallWithAvg?.call.contract_address ||
                    "N/A"}
                </div>
                <div className="token-performance">
                  {performanceData.bestCallWithAvg ? (
                    <span className="positive">
                      +{performanceData.bestCallWithAvg.avg.toFixed(2)}% avg
                    </span>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </div>

            <div className="worst-token">
              <h3>Worst Performer</h3>
              <div className="token-info">
                <div className="token-address">
                  {performanceData.worstCallWithAvg?.call.contract_address ||
                    "N/A"}
                </div>
                <div className="token-performance">
                  {performanceData.worstCallWithAvg ? (
                    <span className="negative">
                      {performanceData.worstCallWithAvg.avg.toFixed(2)}% avg
                    </span>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Averages */}
          <div className="performance-averages">
            <h3>Average Performance</h3>
            <div className="averages-grid">
              <div className="average-item">
                <span className="timeframe">1 Minute</span>
                <span className="average-value">
                  {(() => {
                    const validCalls = calls.filter(
                      (call) => call.performance_1m != null,
                    );
                    if (validCalls.length === 0) return "N/A";
                    const avg =
                      validCalls.reduce(
                        (sum, call) => sum + call.performance_1m,
                        0,
                      ) / validCalls.length;
                    return (
                      <span className={getPerformanceClass(avg)}>
                        {formatPerformance(avg)}
                      </span>
                    );
                  })()}
                </span>
              </div>

              <div className="average-item">
                <span className="timeframe">5 Minutes</span>
                <span className="average-value">
                  {(() => {
                    const validCalls = calls.filter(
                      (call) => call.performance_5m != null,
                    );
                    if (validCalls.length === 0) return "N/A";
                    const avg =
                      validCalls.reduce(
                        (sum, call) => sum + call.performance_5m,
                        0,
                      ) / validCalls.length;
                    return (
                      <span className={getPerformanceClass(avg)}>
                        {formatPerformance(avg)}
                      </span>
                    );
                  })()}
                </span>
              </div>

              <div className="average-item">
                <span className="timeframe">15 Minutes</span>
                <span className="average-value">
                  {(() => {
                    const validCalls = calls.filter(
                      (call) => call.performance_15m != null,
                    );
                    if (validCalls.length === 0) return "N/A";
                    const avg =
                      validCalls.reduce(
                        (sum, call) => sum + call.performance_15m,
                        0,
                      ) / validCalls.length;
                    return (
                      <span className={getPerformanceClass(avg)}>
                        {formatPerformance(avg)}
                      </span>
                    );
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-label">Number of Calls:</span>
          <span className="stat-value">
            {
              calls.filter(
                (call) =>
                  call.performance_1m != null ||
                  call.performance_5m != null ||
                  call.performance_15m != null,
              ).length
            }
          </span>
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

      <div className="calls-list">
        <h2>Recent Calls</h2>
        {calls.length === 0 ? (
          <div className="no-data">
            <p>No calls found for this group</p>
            <p className="help-text">
              This could mean there are no recent calls for {groupName} or the
              data is empty.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-container">
              <thead>
                <tr>
                  <th>Time</th>
                  {/* <th>Contract</th> */}
                  <th>
                    Call Price
                    <span
                      className="info-tooltip"
                      title="This is the price when the group called the token"
                    >
                      ℹ️
                    </span>
                  </th>
                  <th>1m Performance</th>
                  <th>5m Performance</th>
                  <th>15m Performance</th>
                  <th>DEXS</th>
                </tr>
              </thead>
              <tbody>
                {calls
                  .filter((call) => {
                    // Only show calls that have at least one performance metric
                    return (
                      call.performance_1m != null ||
                      call.performance_5m != null ||
                      call.performance_15m != null
                    );
                  })
                  .map((call, index) => (
                    <tr key={call._id || index}>
                      <td>
                        {new Date(call.message_date * 1000).toLocaleString()}
                      </td>
                      {/* <td className="contract-address">{call.contract_address}</td> */}
                      <td className="entry-price">
                        {call.entry_price
                          ? `$${call.entry_price.toFixed(8)}`
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={getPerformanceClass(call.performance_1m)}
                        >
                          {formatPerformance(call.performance_1m)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={getPerformanceClass(call.performance_5m)}
                        >
                          {formatPerformance(call.performance_5m)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={getPerformanceClass(call.performance_15m)}
                        >
                          {formatPerformance(call.performance_15m)}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`https://dexscreener.com/solana/${call.contract_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dexs-link"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupPage;
