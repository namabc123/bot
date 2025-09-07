// Utility function to create user-friendly error messages based on error content
export const createUserFriendlyErrorMessage = (err, context = "data") => {
  // Default error message based on context
  const defaultMessages = {
    data: "Failed to load data",
    groups: "Failed to load groups",
    info: "Failed to load info",
    "group data": "Failed to load group data",
  };

  let userMessage = defaultMessages[context] || "Failed to load data";

  if (err.message.includes("404")) {
    // Context-specific 404 messages
    if (context === "info") {
      userMessage =
        "Info endpoint not available. Please check if the API server is running.";
    } else if (context === "groups") {
      userMessage =
        "Chats endpoint not available. Please check if the API server is running.";
    } else if (context === "data" && err.message.includes("calls")) {
      userMessage =
        "Calls endpoint not available. Please check if the API server is running.";
    } else if (context === "data" && err.message.includes("info")) {
      userMessage =
        "Info endpoint not available. Please check if the API server is running.";
    } else if (context === "group data") {
      userMessage =
        "Calls endpoint not available. Please check if the API server is running.";
    } else {
      userMessage =
        "API endpoints not available. Please check if the API server is running.";
    }
  } else if (
    err.message.includes("network error") ||
    err.message.includes("fetch")
  ) {
    userMessage =
      "Cannot connect to the server. Please check your internet connection and ensure the API server is running.";
  } else if (err.message.includes("500")) {
    userMessage = "Server error occurred. Please try again later.";
  } else if (err.message.includes("403")) {
    userMessage =
      "Access denied. You may not have permission to view this data.";
  } else if (err.message.includes("401")) {
    userMessage = "Authentication required. Please log in again.";
  } else {
    userMessage = `Error: ${err.message}`;
  }

  return userMessage;
};
