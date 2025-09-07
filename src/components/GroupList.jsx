import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { fetchChats } from "../api";
import { DATA_REFRESH_INTERVAL } from "../Constants";
import { createUserFriendlyErrorMessage } from "../utils/errorUtils";
import "../App.css";

const GroupList = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [sorting, setSorting] = useState([{ id: "call_count", desc: true }]);
  const [duplicatesDetected, setDuplicatesDetected] = useState(false);

  const loadGroups = async (isRetry = false) => {
    try {
      setIsLoading(true);
      setError("");

      console.log(
        ">>> GroupList: Loading groups...",
        isRetry ? "(retry attempt)" : "",
      );
      const data = await fetchChats();

      // Handle the data wrapper from the API
      const groupsData = data.data || data;

      // Debug + Deduplicate in a single O(n) pass
      const chatIdToGroups = {};
      const deduplicatedGroups = [];
      const duplicateChatIdsSet = new Set();
      groupsData.forEach((g) => {
        const id = g.chat_id;
        // Skip items with null/undefined chat_id
        if (id == null) {
          console.warn(
            ">>> GroupList: Skipping group with null/undefined chat_id:",
            g,
          );
          return;
        }
        if (!chatIdToGroups[id]) {
          chatIdToGroups[id] = [g];
          deduplicatedGroups.push(g);
        } else {
          chatIdToGroups[id].push(g);
          duplicateChatIdsSet.add(id);
        }
      });

      const duplicateChatIds = Array.from(duplicateChatIdsSet);

      console.log(">>> GroupList: Raw API response:", data);
      console.log(">>> GroupList: Processed groups data:", groupsData);
      console.log(">>> GroupList: Total groups:", groupsData.length);
      console.log(">>> GroupList: Unique chat IDs:", deduplicatedGroups.length);
      console.log(">>> GroupList: Duplicate chat IDs found:", duplicateChatIds);

      if (duplicateChatIds.length > 0) {
        console.warn(">>> GroupList: WARNING - Duplicate groups detected!");
        const duplicateGroups = groupsData.filter((g) =>
          duplicateChatIdsSet.has(g.chat_id),
        );
        console.warn(">>> GroupList: Duplicate groups:", duplicateGroups);

        duplicateChatIds.forEach((chatId) => {
          const groupsWithId = chatIdToGroups[chatId] || [];
          console.warn(
            `>>> GroupList: Found ${groupsWithId.length} groups with chat_id ${chatId}:`,
            groupsWithId,
          );
        });
        console.log(
          ">>> GroupList: Deduplicated groups:",
          deduplicatedGroups.length,
        );
        setGroups(deduplicatedGroups);
        setDuplicatesDetected(true);
      } else {
        setGroups(groupsData);
        setDuplicatesDetected(false);
      }

      setError("");
      setRetryCount(0); // Reset retry count on success

      console.log(
        ">>> GroupList: Successfully loaded",
        groupsData.length,
        "groups",
      );
      console.log(">>> GroupList: Sample group data:", groupsData[0]);
    } catch (err) {
      console.error(">>> GroupList: Error loading groups:", err);

      // Provide user-friendly error messages
      const userMessage = createUserFriendlyErrorMessage(err, "groups");

      setError(userMessage);

      // Increment retry count for failed attempts
      if (!isRetry) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    const interval = setInterval(() => {
      // Only retry automatically if we have an error and haven't exceeded retry limit
      if (error && retryCount < 3) {
        console.log(
          ">>> GroupList: Auto-retrying due to error (attempt",
          retryCount + 1,
          "of 3)",
        );
        loadGroups(true);
      } else if (!error) {
        // Normal refresh when no error
        loadGroups();
      }
    }, DATA_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [error, retryCount]);

  // Manual retry function
  const handleRetry = () => {
    console.log(">>> GroupList: Manual retry requested");
    setRetryCount(0);
    loadGroups();
  };

  // Handle row click to navigate to group page
  const handleRowClick = (group) => {
    // Use chat_id for navigation since that's what the API endpoints expect
    const chatId = group.chat_id;
    if (chatId) {
      navigate(`/group/${chatId}/page`);
    } else {
      console.error(">>> GroupList: No chat_id found for group:", group);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Group Name",
        accessorKey: "title",
        cell: (info) => {
          const group = info.row.original;
          return (
            <div>
              <div>{group.title || "Untitled"}</div>
              {group.username && (
                <div
                  style={{
                    fontSize: "0.8em",
                    color: "#a7aecd",
                    fontStyle: "italic",
                  }}
                >
                  @{group.username}
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Total Calls",
        accessorKey: "call_count",
        cell: (info) => info.getValue() || 0,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: groups,
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
        pageSize: 20,
      },
      sorting: [{ id: "call_count", desc: true }],
    },
    enableSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
  });

  // Show loading state
  if (isLoading && groups.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading groups...</p>
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
            <h3>Unable to Load Groups</h3>
            <p>{error}</p>
            {retryCount > 0 && (
              <p className="retry-info">Retry attempts: {retryCount}/3</p>
            )}
            <button
              onClick={handleRetry}
              className="retry-button"
              disabled={isLoading}
            >
              {isLoading ? "Retrying..." : "Try Again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Telegram Groups</h1>
      {duplicatesDetected && (
        <div
          style={{
            textAlign: "center",
            margin: "10px 0",
            padding: "10px",
            backgroundColor: "#fff3cd",
            color: "#856404",
            borderRadius: "5px",
            border: "1px solid #ffeaa7",
          }}
        >
          ⚠️ Duplicate groups detected and removed. This may indicate a backend
          issue.
        </div>
      )}
      {groups.length === 0 ? (
        <div className="no-data">
          <p>No groups data available</p>
          <p className="help-text">
            This could mean there are no groups configured or the data is empty.
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
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                  style={{ cursor: "pointer" }}
                  className="clickable-row"
                >
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

export default GroupList;
