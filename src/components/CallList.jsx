import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { fetchCalls, fetchInfo } from "../api";
import { DATA_REFRESH_INTERVAL } from "../Constants";
import { createUserFriendlyErrorMessage } from "../utils/errorUtils";
import "../App.css"; // Make sure your positive/negative styles are here

// Constants
const LOADING_TIMEOUT_MS = 30000; // 30 seconds

const CallList = () => {
  const [calls, setCalls] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sorting, setSorting] = useState([{ id: "message_date", desc: true }]);
  const [isRetrying, setIsRetrying] = useState(false);
  const intervalRef = useRef(null);
  const lastSuccessTime = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const loadData = async (isRetry = false) => {
    // Prevent multiple simultaneous requests using loading state
    if (loading) {
      console.log(
        ">>> CallList: Skipping loadData - already loading",
        isRetry ? "(retry blocked)" : "",
      );
      // If a retry was attempted but blocked, reset isRetrying state
      if (isRetry) {
        setIsRetrying(false);
      }
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    try {
      // Set loading state
      setLoading(true);
      setError(null);

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      console.log(
        ">>> CallList: Loading data...",
        isRetry ? "(retry attempt)" : "",
      );

      // Set a timeout to prevent infinite loading state
      loadingTimeoutRef.current = setTimeout(() => {
        console.log(
          ">>> CallList: Loading timeout reached, resetting loading state",
        );
        setLoading(false);
        setIsRetrying(false);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, LOADING_TIMEOUT_MS);

      const [callsData, infoData] = await Promise.all([
        fetchCalls(),
        fetchInfo(),
      ]);

      // Clear the timeout since we got a response
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Log datetime format details
      if (callsData.length > 0) {
        console.log(">>> Datetime format check:");
        console.log(">>> Raw message_date:", callsData[0].message_date);
        console.log(
          ">>> Parsed Date:",
          new Date(callsData[0].message_date * 1000).toISOString(),
        );
        console.log(">>> Date type:", typeof callsData[0].message_date);
      }

      setCalls(callsData);
      setInfo(infoData);
      setRetryCount(0); // Reset retry count on success
      lastSuccessTime.current = Date.now();

      console.log(
        ">>> CallList: Successfully loaded",
        callsData.length,
        "calls and info data",
      );
    } catch (err) {
      console.error(">>> CallList: Error loading data:", err);

      // Clear the timeout since we got an error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Don't set error state if request was aborted
      if (err.name === "AbortError") {
        console.log(">>> CallList: Request was aborted");
        return;
      }

      // Provide user-friendly error messages
      const userMessage = createUserFriendlyErrorMessage(err, "data");

      setError(userMessage);

      // Increment retry count for failed attempts
      if (!isRetry) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      // Ensure loading state is properly reset
      setLoading(false);
      setIsRetrying(false);

      // Clear timeout reference
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Clear abort controller reference
      abortControllerRef.current = null;
    }
  };

  // Function to handle retry with delay
  const handleRetryWithDelay = async () => {
    if (isRetrying || loading) {
      console.log(">>> CallList: Retry already in progress, skipping");
      return;
    }

    setIsRetrying(true);
    const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
    console.log(
      `>>> CallList: Scheduling retry in ${delayMs}ms (attempt ${retryCount + 1})`,
    );

    // Use a timeout ref to track the retry timeout
    const retryTimeoutRef = setTimeout(() => {
      loadData(true);
    }, delayMs);

    // Store the timeout ref for potential cleanup
    loadingTimeoutRef.current = retryTimeoutRef;
  };

  useEffect(() => {
    // Initial load
    loadData();

    // Set up interval for periodic refresh
    intervalRef.current = setInterval(() => {
      // Only refresh if we don't have an error and not currently loading
      if (!error && retryCount === 0 && !loading) {
        // Normal refresh when no error
        console.log(">>> CallList: Periodic refresh triggered");
        loadData();
      } else if (error && retryCount < 3 && !isRetrying && !loading) {
        // Retry on error with exponential backoff
        console.log(">>> CallList: Auto-retrying due to error");
        handleRetryWithDelay();
      } else if (error && retryCount >= 3) {
        // Stop auto-retrying after 3 attempts
        console.log(">>> CallList: Stopping auto-retry after 3 attempts");
      } else {
        console.log(
          ">>> CallList: Skipping refresh - loading:",
          loading,
          "retrying:",
          isRetrying,
          "error:",
          !!error,
        );
      }
    }, DATA_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [error, retryCount, isRetrying]);

  // Manual retry function
  const handleRetry = () => {
    console.log(">>> CallList: Manual retry requested");
    setRetryCount(0);
    setError(null);
    loadData();
  };

  const columns = useMemo(
    () => [
      {
        header: "Time",
        accessorKey: "message_date",
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.getValue("message_date");
          const dateB = rowB.getValue("message_date");
          return dateB - dateA; // Sort using Unix timestamps directly
        },
        cell: (info) => {
          const timestamp = info.getValue();
          const date = new Date(timestamp * 1000); // Convert Unix timestamp to Date
          return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
        },
      },
      // {
      //     header: 'Chat ID',
      //     accessorKey: 'chat_id',
      // },
      //name
      {
        header: "Chat Name",
        accessorKey: "chat_name",
      },
      {
        header: "Group Name",
        accessorKey: "group_name",
      },
      // {
      //     header: 'Contract',
      //     accessorKey: 'contract_address',
      // },
      {
        header: "1m Performance",
        accessorKey: "performance_1m",
        cell: (info) => {
          const val = info.getValue();
          if (val == null) return "-";
          return (
            <span className={val >= 0 ? "positive" : "negative"}>
              {val.toFixed(2)}%
            </span>
          );
        },
      },
      {
        header: "5m Performance",
        accessorKey: "performance_5m",
        cell: (info) => {
          const val = info.getValue();
          if (val == null) return "-";
          return (
            <span className={val >= 0 ? "positive" : "negative"}>
              {val.toFixed(2)}%
            </span>
          );
        },
      },
      {
        header: "15m Performance",
        accessorKey: "performance_15m",
        cell: (info) => {
          const val = info.getValue();
          if (val == null) return "-";
          return (
            <span className={val >= 0 ? "positive" : "negative"}>
              {val.toFixed(2)}%
            </span>
          );
        },
      },
      {
        header: "30m Performance",
        accessorKey: "performance_30m",
        cell: (info) => {
          const val = info.getValue();
          if (val == null) return "-";
          return (
            <span className={val >= 0 ? "positive" : "negative"}>
              {val.toFixed(2)}%
            </span>
          );
        },
      },
      {
        header: "60m Performance",
        accessorKey: "performance_60m",
        cell: (info) => {
          const val = info.getValue();
          if (val == null) return "-";
          return (
            <span className={val >= 0 ? "positive" : "negative"}>
              {val.toFixed(2)}%
            </span>
          );
        },
      },
      {
        header: "DEXS",
        accessorKey: "dex_link",
        cell: (info) => {
          const address = info.row.original.contract_address;
          return (
            <a
              href={`https://dexscreener.com/solana/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </a>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: calls,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 50,
      },
      sorting: [{ id: "message_date", desc: true }],
    },
    debugTable: true,
    enableSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
  });

  // Add debug logging for the first few rows
  useEffect(() => {
    if (calls.length > 0) {
      console.log(">>> First few calls in table:");
      const tableRows = table.getRowModel().rows;
      tableRows.slice(0, 3).forEach((row, index) => {
        console.log(
          `>>> Table Row ${index + 1}:`,
          new Date(row.original.message_date).toISOString(),
        );
      });

      // Log the raw data for comparison
      console.log(">>> Raw data first few calls:");
      calls.slice(0, 3).forEach((call, index) => {
        console.log(
          `>>> Raw Call ${index + 1}:`,
          new Date(call.message_date).toISOString(),
        );
      });
    }
  }, [calls, table]);

  // Debug log when sorting changes
  useEffect(() => {
    console.log(">>> Current sorting state:", sorting);
  }, [sorting]);

  // Show loading state
  if (loading && calls.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading calls...</p>
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
            <h3>Unable to Load Calls</h3>
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
    <div>
      <h1 style={{ textAlign: "center" }}>Call List</h1>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <p>
          Last Updated:{" "}
          {lastSuccessTime.current
            ? new Date(lastSuccessTime.current).toLocaleString()
            : "-"}
        </p>
      </div>
      {calls.length === 0 ? (
        <div className="no-data">
          <p>No calls data available</p>
          <p className="help-text">
            This could mean there are no recent calls or the data is empty.
          </p>
        </div>
      ) : (
        <>
          <table className="table-container">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: "pointer" }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <span>
              Page{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </strong>
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CallList;
