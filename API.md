
# API Documentation

Base URL: `/api/v1`

## Authentication

### Connect Wallet
```http
POST /auth/wallet/connect
```
Connects and authenticates a user's Solana wallet.

**Request Body:**
```json
{
    "publicKey": "string" // Solana wallet public key
}
```

**Response:**
```json
{
    "user": {
        "id": "string",
        "username": "string",
        "walletAddress": "string",
        "bio": "string",
        "avatarUrl": "string",
        "fullName": "string",
        "role": "string",
        "createdAt": "string"
    },
    "tokens": {
        "accessToken": "string",
        "refreshToken": "string"
    }
}
```

### Refresh Token
```http
POST /auth/refresh
```
Refreshes an expired access token.

**Request Body:**
```json
{
    "refreshToken": "string"
}
```

**Headers Required:**
- `x-csrf-token`: CSRF token from cookie

**Response:**
```json
{
    "tokens": {
        "accessToken": "string",
        "refreshToken": "string"
    }
}
```

### Verify Authentication
```http
GET /auth/verify
```
Verifies current authentication status.

**Response:**
```json
{
    "authenticated": true,
    "user": {
        "id": "string",
        "username": "string",
        "walletAddress": "string",
        "role": "string"
    }
}
```

### Logout
```http
POST /auth/logout
```
Logs out the user and invalidates their tokens.

**Response:**
```json
{
    "message": "Logged out successfully"
}
```

## Swarm Management

### Get Swarm Status
```http
GET /swarm/status
```
Returns status of all agents in the swarm for the authenticated user.

**Response:**
```json
{
    "agents": [
        {
            "id": "string",
            "name": "string",
            "status": "running" | "stopped",
            "activeInSwarm": boolean
        }
    ]
}
```

### Start All Agents
```http
POST /swarm/start
```
Starts all stopped agents for the authenticated user.

**Response:**
```json
{
    "message": "Swarm started successfully",
    "startedAgents": ["string"]
}
```

### Stop All Agents
```http
POST /swarm/stop
```
Stops all running agents for the authenticated user.

**Response:**
```json
{
    "message": "Swarm stopped successfully",
    "stoppedAgents": ["string"]
}
```

### Start Specific Agent
```http
POST /swarm/start/:agentId
```
Starts a specific agent in the swarm.

**Response:**
```json
{
    "message": "Agent started successfully",
    "agentId": "string",
    "status": "running"
}
```

### Stop Specific Agent
```http
POST /swarm/stop/:agentId
```
Stops a specific agent in the swarm.

**Response:**
```json
{
    "message": "Agent stopped successfully",
    "agentId": "string",
    "status": "stopped"
}
```

## Agents

### Chat with Agent
```http
POST /agents/:id/chat
```
Send a message to an agent and get a response.

**Request Body:**
```json
{
    "message": "string"
}
```

**Response:**
```json
{
    "response": "string"
}
```

## Authentication Notes

- All endpoints except `/auth/wallet/connect` require authentication via Bearer token
- Include the access token in the Authorization header:
  ```
  Authorization: Bearer <access_token>
  ```
- CSRF token is required for all POST/PUT/DELETE requests
- Refresh tokens automatically rotate on use

## Error Responses

All endpoints may return error responses in this format:

```json
{
    "error": "string",
    "code": "string"
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Environment Setup

Required environment variables:
```bash
PORT=3005
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```
```