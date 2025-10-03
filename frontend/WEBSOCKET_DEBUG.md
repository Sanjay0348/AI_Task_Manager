# WebSocket Debug Guide

## Issues Fixed

1. **WebSocket URL Construction**: Fixed the URL construction to properly connect to the backend WebSocket server at `ws://localhost:8000/ws` instead of trying to connect to the frontend port.

2. **Message Handling**: Fixed the message handling in the chat interface to properly receive WebSocket messages from the parent component instead of using incorrect `window.addEventListener('message')`.

3. **Error Handling**: Added better error handling and reconnection logic with exponential backoff.

4. **Keep-Alive**: Added ping/pong mechanism to keep the WebSocket connection alive.

## Testing the WebSocket Connection

### 1. Start the Backend

```bash
cd backend
python run.py
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

### 3. Check Browser Console

Open the browser developer tools and check the console for:

- "WebSocket connecting to: ws://localhost:8000/ws"
- "WebSocket connected"
- Any error messages

### 4. Test Connection

- The header should show "Connected" with a green WiFi icon
- Try sending a message in the chat interface
- Check if the AI agent responds

### 5. Debug Steps

If the connection still fails:

1. **Check Backend Status**: Visit `http://localhost:8000/health` to ensure the backend is running
2. **Check WebSocket Endpoint**: Visit `http://localhost:8000/` to see the API info
3. **Check CORS**: Ensure the backend allows connections from `http://localhost:3000`
4. **Check Network**: Look for any network errors in the browser's Network tab

### 6. Environment Variables

The frontend now uses these environment variables:

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000/api/v1)
- `NEXT_PUBLIC_WS_URL`: WebSocket URL (default: ws://localhost:8000)

You can create a `.env.local` file in the frontend directory to override these values.

## Common Issues

1. **Backend not running**: Make sure the FastAPI backend is running on port 8000
2. **CORS issues**: Check that the backend allows the frontend origin
3. **Port conflicts**: Ensure ports 3000 and 8000 are available
4. **Firewall**: Check if any firewall is blocking the connection
