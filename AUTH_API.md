# Authentication API Documentation

## Overview
This API implements an OTP-based authentication system with hybrid token support:
- **Web**: Uses HTTP-only cookies for access and refresh tokens
- **Mobile**: Uses access and refresh tokens in response body

## Endpoints

### 1. Request OTP
**POST** `/api/auth/request-otp`

Request an OTP to be sent to a phone number.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully"
}
```

**Note:** In development, the OTP is logged to console. In production, integrate with an SMS service.

---

### 2. Verify OTP & Login
**POST** `/api/auth/verify-otp`

Verify OTP and complete login. Returns different responses based on device type.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "deviceType": "web" // or "mobile"
}
```

**Response for Web (`deviceType: "web"`):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "phoneNumber": "+1234567890",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
*JWT token is set as HTTP-only cookie: `accessToken` (7 days expiry)*

**Response for Mobile (`deviceType: "mobile"`):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "phoneNumber": "+1234567890",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Refresh Token
**POST** `/api/auth/refresh`

Refresh the access token using a refresh token. **This endpoint is only for mobile devices.**

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Web uses a long-lived JWT token (7 days) stored in a cookie, so no refresh is needed. Users will need to re-login when the token expires.

---

### 4. Get Current User
**POST** `/api/auth/me`

Get the current authenticated user's information.

**Headers (Mobile):**
```
Authorization: Bearer <accessToken>
```

**Cookies (Web):**
*Access token is automatically read from cookies*

**Response:**
```json
{
  "id": "user_id",
  "phoneNumber": "+1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "isVerified": true
}
```

---

### 5. Logout
**POST** `/api/auth/logout`

Logout and clear authentication tokens.

**Headers (Mobile):**
```
Authorization: Bearer <accessToken>
```

**Cookies (Web):**
*Access token is automatically read from cookies*

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Authentication Flow

### Web Flow:
1. Request OTP → `/api/auth/request-otp`
2. Verify OTP → `/api/auth/verify-otp` (with `deviceType: "web"`)
   - JWT token is automatically stored as HTTP-only cookie (7 days expiry)
3. Access protected routes (cookie sent automatically)
4. Logout → `/api/auth/logout` (clears cookie)
5. Re-login when token expires (no refresh endpoint for web)

### Mobile Flow:
1. Request OTP → `/api/auth/request-otp`
2. Verify OTP → `/api/auth/verify-otp` (with `deviceType: "mobile"`)
   - Store tokens from response
3. Access protected routes with `Authorization: Bearer <accessToken>` header
4. Refresh token → `/api/auth/refresh` (with refresh token in body)
5. Logout → `/api/auth/logout` (with access token in header)

## Token Expiry
- **Web JWT Token**: 7 days (configurable via `JWT_WEB_EXPIRY`)
- **Mobile Access Token**: 15 minutes (configurable via `JWT_ACCESS_EXPIRY`)
- **Mobile Refresh Token**: 7 days (configurable via `JWT_REFRESH_EXPIRY`)

## Security Features
- HTTP-only cookies for web (prevents XSS attacks)
- Secure cookies in production
- Long-lived JWT tokens for web (7 days) - no refresh needed
- Short-lived access tokens for mobile (15 minutes) with refresh tokens
- OTP expiry (10 minutes)
- Maximum OTP attempts (3 attempts)
- Automatic OTP invalidation after use
- TTL index on OTP collection (auto-delete expired OTPs)

## Environment Variables
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_WEB_EXPIRY=7d
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## Protected Routes
All routes are protected by default. Use the `@Public()` decorator to make routes accessible without authentication.

Example:
```typescript
@Public()
@Get('public-endpoint')
getPublicData() {
  return { data: 'public' };
}
```

