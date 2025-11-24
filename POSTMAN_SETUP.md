# Postman Collection Setup Guide

This guide explains how to use the Error Logger API Postman collection.

## Importing the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select the `Error_Logger_API.postman_collection.json` file
4. The collection will be imported with all requests

## Environment Variables

The collection uses a `base_url` variable that defaults to `http://localhost:3000`.

To change it:

1. Click on the collection name
2. Go to the **Variables** tab
3. Update `base_url` to your server URL

Or create a Postman Environment:

1. Click **Environments** in the left sidebar
2. Click **+** to create a new environment
3. Add variable: `base_url` = `http://localhost:3000` (or your server URL)
4. Select the environment from the dropdown (top right)

## Authentication Setup

**Important**: This API uses NextAuth session-based authentication with cookies.

### Step 1: Login First

1. Run the **Login** request under the **Authentication** folder
2. This will set session cookies automatically in Postman
3. Postman will automatically include these cookies in subsequent requests

### Step 2: Verify Session

Run the **Get Session** request to verify you're authenticated. You should see your user information.

### Step 3: Use Protected Endpoints

All error endpoints require authentication. Once logged in, cookies are automatically sent with each request.

## API Endpoints

### Authentication

- **POST** `/api/auth/callback/credentials` - Login
- **GET** `/api/auth/session` - Get current session
- **POST** `/api/auth/signout` - Logout

### Errors

- **POST** `/api/errors/public` - Create new error (PUBLIC - no authentication required)

  - Required: `message`, `userId`
  - Optional: `stack`, `level`, `serverUrl`, `metadata`, `userSecretKey`
  - `userId` can be either:
    - A user ID (CUID format, e.g., `cmi1j87se0000uhmgdfdmxyfw`)
    - An email address (e.g., `user@example.com`)
  - The API will look up the user by ID first, then by email if not found
  - `userSecretKey` is optional and can be used as an additional identifier
  - **This is the ONLY endpoint for creating errors**

- **GET** `/api/errors` - Get all errors (requires authentication, supports query params)

  - Query params:
    - `level` (optional): Filter by level (`error`, `warning`, `info`)
    - `limit` (optional): Number of results (default: 50)
    - `offset` (optional): Pagination offset (default: 0)

- **GET** `/api/errors/:id` - Get error by ID

- **DELETE** `/api/errors/:id` - Delete error by ID

## Example Request Bodies

### Create Error - Full Example

```json
{
  "message": "Database connection failed",
  "userId": "clx1234567890abcdef",
  "stack": "Error: Connection timeout\n    at Database.connect (/app/db.js:45:10)",
  "level": "error",
  "serverUrl": "https://api.example.com",
  "metadata": {
    "database": "postgres",
    "host": "db.example.com",
    "port": 5432,
    "retryCount": 3
  }
}
```

### Create Error - Minimal

```json
{
  "message": "Simple error message",
  "userId": "clx1234567890abcdef"
}
```

### Create Warning

```json
{
  "message": "High memory usage detected",
  "userId": "clx1234567890abcdef",
  "level": "warning",
  "serverUrl": "https://server.example.com",
  "metadata": {
    "memoryUsage": "85%",
    "threshold": "80%"
  }
}
```

### Create Error - Public Endpoint (With userSecretKey)

```json
{
  "message": "Error from external service",
  "userId": "clx1234567890abcdef",
  "level": "error",
  "serverUrl": "https://external-service.com",
  "userSecretKey": "your-user-secret-key-here",
  "metadata": {
    "service": "external-api",
    "version": "1.0.0"
  }
}
```

### Create Error - Public Endpoint (Minimal)

```json
{
  "message": "Error from external service",
  "userId": "clx1234567890abcdef",
  "level": "error",
  "serverUrl": "https://external-service.com"
}
```

## Testing Workflow

1. **Start your server**: `npm run dev`
2. **Get a User ID or Email**: You need either:
   - A user ID (CUID format like `cmi1j87se0000uhmgdfdmxyfw`) - get from database or session
   - An email address (e.g., `admin@aictime.com`) - easier to use!
3. **Create an error**: Use the "Create Error" request (no authentication needed)
   - **Required**: `message` and `userId` (can be user ID or email address)
   - Optional: `userSecretKey`, `stack`, `level`, `serverUrl`, `metadata`
4. **Login** (optional): Run the Login request to view errors in dashboard (use default credentials: `admin@aictime.com` / `admin123`)
5. **Get all errors**: Run "Get All Errors" to see your created errors (requires authentication)
6. **Get specific error**: Copy an error ID from the response and use it in "Get Error by ID"
7. **Delete error**: Use the error ID in "Delete Error" request

## Troubleshooting

### 401 Unauthorized Errors

- Make sure you've run the Login request first
- Check that cookies are enabled in Postman settings
- Verify your session is still valid (run "Get Session")

### 404 Not Found

- Check that `base_url` is correct
- Ensure your server is running
- Verify the endpoint path is correct

### Cookies Not Working

1. Go to Postman Settings → General
2. Enable "Automatically follow redirects"
3. Ensure cookies are enabled

## Notes

- Creating errors via `/api/errors/public` does NOT require authentication
- Viewing/deleting errors via `/api/errors` requires authentication
- `userId` is REQUIRED when creating errors - must be a valid user ID
- `userSecretKey` is optional and can be used as an additional identifier
- Errors are scoped to the `userId` provided
- The `metadata` field accepts any JSON object (will be stringified)
- Error levels must be: `error`, `warning`, or `info`
- Server URL should be a valid URL format
