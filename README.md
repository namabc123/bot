# moonbot frontend

A React-based frontend for the moonbot application with enhanced error handling and debugging capabilities.

## Quick Start

```bash
yarn install
yarn dev
```

## Environment Configuration

Make sure to set the `VITE_API_URL` environment variable in your `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## Enhanced Error Handling

The application now includes comprehensive error handling and debugging features:

### API Error Handling
- **Detailed HTTP Status Logging**: All API responses include status codes and headers for debugging
- **User-Friendly Error Messages**: Different error types (404, 500, network errors) show helpful messages
- **Automatic Retry Logic**: Failed requests are automatically retried up to 3 times
- **Manual Retry Option**: Users can manually retry failed requests with a "Try Again" button

### Debugging Features
- **Environment Checks**: Console logs show API URL configuration and environment details
- **Request Logging**: All API requests log the full URL being called
- **Response Validation**: Data format validation with detailed error messages
- **Network Error Detection**: Automatic detection of network connectivity issues

### Error Types Handled
- **404 Not Found**: Endpoint doesn't exist or server not running
- **500 Server Error**: Internal server errors
- **Network Errors**: Connection issues or server unreachable
- **CORS Errors**: Cross-origin request issues
- **Authentication Errors**: 401/403 permission issues
- **Rate Limiting**: 429 too many requests

### Console Debugging
Open your browser's developer console to see detailed debugging information:
- API URL configuration
- Request URLs and status codes
- Response data samples
- Error details with stack traces
- Retry attempt logging

## Troubleshooting

### Common Issues

1. **404 Errors**: Check if your API server is running and the endpoint exists
2. **Network Errors**: Verify your internet connection and API server status
3. **CORS Errors**: Ensure your API server has proper CORS configuration
4. **Empty API_URL**: Check your `.env` file has `VITE_API_URL` set correctly

### Debug Steps

1. Open browser developer console (F12)
2. Look for environment check logs at the top
3. Check API request logs for URLs and status codes
4. Review error messages for specific issue details
5. Use the "Try Again" button to retry failed requests
