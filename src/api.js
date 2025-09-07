// Use VITE_API_URL environment variable for API endpoint configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Environment check for debugging
if (import.meta.env.DEV) {
  console.log(">>> Environment check:");
  console.log(">>>   API_URL:", API_URL);
  console.log(">>>   API_URL type:", typeof API_URL);
  console.log(">>>   API_URL is defined:", API_URL !== undefined);
  console.log(">>>   API_URL is empty:", !API_URL);
  console.log(">>>   Current environment:", import.meta.env.MODE);
}

// Utility function to create user-friendly error messages based on HTTP status codes
const createErrorMessage = (status, endpoint) => {
  const endpointName = endpoint || "endpoint";

  switch (status) {
    case 404:
      return `${endpointName} not found (404). Please check if the API server is running and the endpoint exists.`;
    case 500:
      return `Server error (500). The API server encountered an internal error.`;
    case 403:
      return `Access forbidden (403). You may not have permission to access this ${endpointName}.`;
    case 401:
      return `Unauthorized (401). Authentication may be required.`;
    case 429:
      return `Too many requests (429). Please wait a moment before trying again.`;
    case 503:
      return `Service unavailable (503). The server is temporarily unavailable.`;
    default:
      if (status >= 400 && status < 500) {
        return `Client error (${status}). The request was invalid.`;
      } else if (status >= 500) {
        return `Server error (${status}). The server encountered an error.`;
      }
      return `HTTP ${status}: Unknown error occurred.`;
  }
};

// Utility function to log detailed error information
const logErrorDetails = (operation, err) => {
  console.error(`>>> Error ${operation}:`);
  console.error(">>>   Error type:", err.constructor.name);
  console.error(">>>   Error message:", err.message);
  console.error(">>>   Error stack:", err.stack);

  // Check if it's a network error
  if (err.name === "TypeError" && err.message.includes("fetch")) {
    console.error(
      ">>>   This appears to be a network error - check if the API server is running",
    );
  }

  // Check if it's a CORS error
  if (err.message.includes("CORS") || err.message.includes("cross-origin")) {
    console.error(
      ">>>   This appears to be a CORS error - check server CORS configuration",
    );
  }
};

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Shared retry helper to eliminate duplicated retry loops
const withRetry = async (
  operationName,
  fn,
  maxRetries = 3,
  initialDelayMs = 1000,
) => {
  let attempt = 0;
  // Execute maxRetries attempts total (not maxRetries + 1)
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      logErrorDetails(operationName, err);
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt); // 1s, 2s, 4s...
        console.log(
          `>>> Retrying ${operationName} in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await delay(delayMs);
        attempt++;
        continue;
      }
      throw new Error(
        `Failed to ${operationName} after ${maxRetries} attempts: ${err.message}`,
      );
    }
  }
};

// Fetch calls data from the API with retry logic
export const fetchCalls = async (retryCount = 0, maxRetries = 3) => {
  return withRetry(
    "fetching calls",
    async () => {
      const url = `${API_URL}/api/calls?limit=10`;
      console.log(">>> API_URL:", API_URL);
      console.log(">>> Fetching calls data from:", url);

      const res = await fetch(url);

      // Log detailed response information for debugging
      console.log(">>> Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorMessage = createErrorMessage(res.status, "calls");
        throw new Error(errorMessage);
      }

      const data = await res.json();

      console.log(">>> Raw API response data type:", typeof data);
      console.log(">>> Raw API response is array:", Array.isArray(data));
      if (Array.isArray(data) && data.length > 0) {
        console.log(">>> First item sample:", data[0]);
        console.log(">>> message_date type:", typeof data[0].message_date);
        console.log(">>> message_date value:", data[0].message_date);
      }

      let callsArray;
      let pagination = null;
      let dateRange = null;

      if (Array.isArray(data)) {
        callsArray = data;
        console.log(
          ">>> API returned array directly with",
          callsArray.length,
          "calls",
        );
      } else if (data && Array.isArray(data.calls)) {
        callsArray = data.calls;
        pagination = data.pagination;
        dateRange = data.dateRange;
        console.log(
          ">>> API returned object with calls array containing",
          callsArray.length,
          "calls",
        );
      } else if (data && Array.isArray(data.data)) {
        callsArray = data.data;
        pagination = data.pagination || null;
        dateRange = data.dateRange || null;
        console.log(
          ">>> API returned object with data array containing",
          callsArray.length,
          "calls",
        );
      } else {
        console.error(
          ">>> Invalid calls data format - expected array or object with calls array, got:",
          typeof data,
          data,
        );
        throw new Error(
          "Invalid data format: expected array or object with calls array",
        );
      }

      const processedCalls = callsArray.map((call) => {
        let messageDate;
        if (typeof call.message_date === "string") {
          messageDate = new Date(call.message_date).getTime() / 1000;
        } else if (typeof call.message_date === "number") {
          messageDate = call.message_date;
        } else {
          console.warn(">>> Invalid message_date format:", call.message_date);
          messageDate = Date.now() / 1000;
        }
        return { ...call, message_date: messageDate };
      });

      console.log(">>> Processed API response first few calls:");
      processedCalls.slice(0, 3).forEach((call, index) => {
        console.log(`>>> Processed API Call ${index + 1}:`, {
          date: new Date(call.message_date * 1000).toISOString(),
          id: call._id,
          contract: call.contract_address,
          performance: call.performance_1m,
        });
      });

      const sortedCalls = [...processedCalls].sort(
        (a, b) => b.message_date - a.message_date,
      );

      console.log(">>> Calls data received:", sortedCalls.length, "items");
      if (sortedCalls.length > 0) {
        console.log(
          ">>> First call date:",
          new Date(sortedCalls[0].message_date * 1000).toISOString(),
        );
        console.log(
          ">>> Last call date:",
          new Date(
            sortedCalls[sortedCalls.length - 1].message_date * 1000,
          ).toISOString(),
        );
        if (pagination) {
          console.log(">>> Pagination info:", pagination);
        }
        if (dateRange) {
          console.log(">>> Date range:", {
            oldest: new Date(dateRange.oldestDate * 1000).toISOString(),
            newest: new Date(dateRange.newestDate * 1000).toISOString(),
          });
        }
      }

      return sortedCalls;
    },
    maxRetries,
  );
};

// Fetch calls data for a specific chat from the API with retry logic
export const fetchChatCalls = async (
  chatId,
  retryCount = 0,
  maxRetries = 3,
) => {
  return withRetry(
    "fetching chat calls",
    async () => {
      const url = `${API_URL}/api/chat/${chatId}`;
      console.log(">>> API_URL:", API_URL);
      console.log(">>> Fetching chat calls data from:", url);

      const res = await fetch(url);

      console.log(">>> Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorMessage = createErrorMessage(res.status, "chat calls");
        throw new Error(errorMessage);
      }

      const data = await res.json();

      console.log(">>> Raw chat API response data type:", typeof data);
      console.log(">>> Raw chat API response structure:", Object.keys(data));

      if (!data || !Array.isArray(data.calls)) {
        console.error(
          ">>> Invalid chat calls data format - expected object with calls array, got:",
          typeof data,
          data,
        );
        throw new Error(
          "Invalid data format: expected object with calls array for chat",
        );
      }

      const callsArray = data.calls;
      const chatInfo = data.chat;
      const pagination = data.pagination;
      const stats = data.stats;
      const performance = data.performance;

      console.log(
        ">>> Chat API returned calls array with",
        callsArray.length,
        "calls",
      );
      console.log(">>> Chat info:", chatInfo);
      if (pagination) {
        console.log(">>> Pagination info:", pagination);
      }
      if (stats) {
        console.log(">>> Stats info:", stats);
      }

      const processedCalls = callsArray.map((call) => {
        let messageDate;
        if (typeof call.message_date === "string") {
          messageDate = new Date(call.message_date).getTime() / 1000;
        } else if (typeof call.message_date === "number") {
          messageDate = call.message_date;
        } else {
          console.warn(">>> Invalid message_date format:", call.message_date);
          messageDate = Date.now() / 1000;
        }
        return { ...call, message_date: messageDate };
      });

      console.log(">>> Processed chat API response first few calls:");
      processedCalls.slice(0, 3).forEach((call, index) => {
        console.log(`>>> Processed Chat API Call ${index + 1}:`, {
          date: new Date(call.message_date * 1000).toISOString(),
          id: call._id,
          contract: call.contract_address,
          performance: call.performance_1m,
        });
      });

      const sortedCalls = [...processedCalls].sort(
        (a, b) => b.message_date - a.message_date,
      );

      console.log(">>> Chat calls data received:", sortedCalls.length, "items");
      if (sortedCalls.length > 0) {
        console.log(
          ">>> First call date:",
          new Date(sortedCalls[0].message_date * 1000).toISOString(),
        );
        console.log(
          ">>> Last call date:",
          new Date(
            sortedCalls[sortedCalls.length - 1].message_date * 1000,
          ).toISOString(),
        );
      }

      return {
        calls: sortedCalls,
        chat: chatInfo,
        pagination,
        stats,
        performance,
      };
    },
    maxRetries,
  );
};

// Fetch info data from the API with retry logic
export const fetchInfo = async (retryCount = 0, maxRetries = 3) => {
  return withRetry(
    "fetching info",
    async () => {
      const url = `${API_URL}/api/info`;
      console.log(">>> API_URL:", API_URL);
      console.log(">>> Fetching info data from:", url);

      const res = await fetch(url);

      console.log(">>> Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorMessage = createErrorMessage(res.status, "info");
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (!data || typeof data !== "object") {
        console.error(
          ">>> Invalid info data format - expected object, got:",
          typeof data,
          data,
        );
        throw new Error("Invalid data format: expected object");
      }

      console.log(">>> Info data received:", JSON.stringify(data, null, 2));
      return data;
    },
    maxRetries,
  );
};

// Fetch chats data from the API with retry logic
export const fetchChats = async (retryCount = 0, maxRetries = 3) => {
  return withRetry(
    "fetching chats",
    async () => {
      const url = `${API_URL}/api/chats`;
      console.log(">>> Fetching chats data from:", url);
      console.log(">>> API_URL:", API_URL);

      const res = await fetch(url);

      console.log(">>> Response status:", res.status, res.statusText);
      console.log(
        ">>> Response headers:",
        Object.fromEntries(res.headers.entries()),
      );

      if (!res.ok) {
        const errorMessage = createErrorMessage(res.status, "chats");
        throw new Error(errorMessage);
      }

      const data = await res.json();

      let chatsArray;
      let pagination = null;
      if (Array.isArray(data)) {
        chatsArray = data;
        console.log(
          ">>> API returned chats as array directly with",
          chatsArray.length,
          "items",
        );
      } else if (data && Array.isArray(data.data)) {
        chatsArray = data.data;
        pagination = data.pagination || null;
        console.log(
          ">>> API returned chats in object.data with",
          chatsArray.length,
          "items",
        );
      } else {
        console.error(
          ">>> Invalid chats data format - expected array or object with data array, got:",
          typeof data,
          data,
        );
        throw new Error(
          "Invalid data format: expected array or object with data array for chats",
        );
      }

      console.log(">>> Chats data received:", chatsArray.length, "items");
      if (chatsArray.length > 0) {
        console.log(
          ">>> First chat sample:",
          JSON.stringify(chatsArray[0], null, 2),
        );
      } else {
        console.log(">>> No chats found - empty array returned");
      }

      return chatsArray;
    },
    maxRetries,
  );
};

// // Fetch stats data from the API
// export const fetchStats = async () => {
//     try {
//         const res = await fetch(`${API_URL}/stats`);
//         if (!res.ok) throw new Error('Failed to fetch stats');
//         const data = await res.json();
//         return [
//             { label: 'Total Channels', value: data.total_channels || 0, icon: '📢' },
//             { label: 'Total Messages', value: data.total_messages_read || 0, icon: '✉️' },
//             { label: 'Unique Channels', value: data.unique_channel_count || 0, icon: '📊' },
//             { label: 'Contracts Found', value: data.contracts_found || 0, icon: '🔍' }
//         ];
//     } catch (err) {
//         console.error('Error fetching stats:', err);
//         return [];
//     }
// };
