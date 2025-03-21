# Job Application Extension API Documentation

## Overview
This API provides endpoints for processing job application questions, generating cover letters, and managing Indeed job applications. It uses Express.js and implements input validation using Zod schemas.

## Base URL
```
http://localhost:3000/api
```

## Authentication

### Email Authentication
Initiate email-based authentication or registration.

**Endpoint:** `POST /auth/email`

**Request Body:**
```json
{
  "email": "string" // Valid email address
}
```

**Response:** `200 OK`

For existing users with valid token:
```json
{
  "token": "string" // JWT token
}
```

For new users or expired tokens:
```json
{
  "message": "Verification email sent",
  "newUser": true | false
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email format
  ```json
  {
    "error": "Validation Error",
    "message": ["Invalid email address"]
  }
  ```
- `500 Internal Server Error`: Server processing error
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to process authentication"
  }
  ```

### Verify Email
Verify email by validating the token.

**Endpoint:** `GET /auth/verify`

**Query Parameters:**
- `token`: string - JWT token received in verification email

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully",
  "token": "string" // Same token with verified status updated
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or missing token
  ```json
  {
    "error": "Validation Error",
    "message": ["Token is required"]
  }
  ```
- `404 Not Found`: Token not found in database
  ```json
  {
    "error": "Not Found",
    "message": "Token not found in database"
  }
  ```
- `500 Internal Server Error`: Token verification failed
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to verify email"
  }
  ```

### Authentication Headers
For protected endpoints, include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

**Error Responses for Protected Endpoints:**
- `401 Unauthorized`: Missing or invalid token
  ```json
  {
    "error": "Unauthorized",
    "message": "No token provided"
  }
  ```
  ```json
  {
    "error": "Unauthorized",
    "message": "Invalid or expired token"
  }
  ```
- `403 Forbidden`: Email not verified
  ```json
  {
    "error": "Forbidden",
    "message": "Email verification required"
  }
  ```

## Endpoints

### Process Questions
Process job application questions using AI.

**Endpoint:** `POST /process-questions`

**Request Body:**
```json
{
  "userId": "number",
  "applicationId": "string",
  "platform": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "inputElm": "text | textarea | number | radio | select",
      "elementId": "string",
      "options": [
        {
          "value": "string",
          "label": "string",
          "inputId": "string"
        }
      ]
    }
  ]
}
```

**Response:** `200 OK`
```json
[
  {
    "id": "string",
    "question": "string",
    "answer": "string",
    "inputElmType": "text | textarea | number | radio | select",
    "answerElmId": "string"
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
  ```json
  {
    "error": "Validation Error",
    "details": [/* Zod validation errors */]
  }
  ```
- `404 Not Found`: User not found
  ```json
  {
    "error": "User not found",
    "message": "No user found with id {userId}"
  }
  ```
- `500 Internal Server Error`: Server processing error
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to process questions with AI"
  }
  ```

### Generate Cover Letter
Generate a cover letter based on job details.

**Endpoint:** `POST /generate-cover-letter`

**Request Body:**
```json
{
  "jobDetails": {
    // Job-related information object
  },
  "userInput": "string" // Optional
}
```

**Response:** `200 OK`
```json
{
  "coverLetter": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request format
  ```json
  {
    "error": "Validation Error",
    "message": "Job details are required and must be an object"
  }
  ```
- `500 Internal Server Error`: Generation error
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to generate cover letter"
  }
  ```

### Create Indeed Application
Create a new Indeed job application record.

**Endpoint:** `POST /indeed-application`

**Request Body:**
```json
{
  "userId": "number",
  "jobDesc": "string",
  "title": "string",
  "employer": "string",
  "applicationUrl": "string"
}
```

**Response:** `201 Created`
```json
{
  "id": "number",
  "userId": "number",
  "jobDesc": "string",
  "title": "string",
  "employer": "string",
  "applicationUrl": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
  ```json
  {
    "error": "Validation Error",
    "details": [/* Zod validation errors */]
  }
  ```
- `404 Not Found`: User not found
  ```json
  {
    "error": "User not found",
    "message": "No user found with id {userId}"
  }
  ```
- `500 Internal Server Error`: Server processing error
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to create application"
  }
  ```

### Update Indeed Application Status
Update the status of an Indeed job application.

**Endpoint:** `PUT /indeed-application/:applicationId`

**URL Parameters:**
- `applicationId`: number - ID of the application to update

**Request Body:**
```json
{
  "userId": "number",
  "status": "STARTED | COMPLETED | ERROR"
}
```

**Response:** `200 OK`
```json
{
  "id": "number",
  "userId": "number",
  "jobDesc": "string",
  "title": "string",
  "employer": "string",
  "status": "STARTED | COMPLETED | ERROR",
  "applicationUrl": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
  ```json
  {
    "error": "Validation Error",
    "details": [/* Zod validation errors */]
  }
  ```
- `404 Not Found`: User or application not found
  ```json
  {
    "error": "User not found",
    "message": "No user found with id {userId}"
  }
  ```
  ```json
  {
    "error": "Application not found",
    "message": "No application found with id {applicationId} for user {userId}"
  }
  ```
- `500 Internal Server Error`: Server processing error
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to update application"
  }
  ```

## Error Handling
The API implements consistent error handling across all endpoints:

- Validation errors return `400 Bad Request` with detailed validation failure information
- Missing resources return `404 Not Found` with specific error messages
- Server errors return `500 Internal Server Error` with error description
- All error responses follow the format:
  ```json
  {
    "error": "string",
    "message": "string",
    "details": [] // Optional, included for validation errors
  }
  ```

## Data Validation
- Request bodies are validated using Zod schemas
- Each endpoint has specific validation requirements as defined in the request body schemas
- Additional properties in request bodies are allowed (passthrough enabled)
- Input validation ensures data integrity and proper error reporting
