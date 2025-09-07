# Payment API Integration

This document describes the integration of the external payment API endpoints as per the provided documentation.

## Environment Variables Required

Add the following environment variables to your `.env` file:

```env
# Payment Gateway Configuration
PG_KEY=your_pg_key_here
PG_SECRET_KEY=your_pg_secret_key_here
API_KEY=your_api_key_here
SCHOOL_ID=your_school_id_here
```

## API Endpoints

### 1. Create Collect Request

**Endpoint:** `POST /api/erp/create-collect-request`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <API_KEY>`

**Request Body:**
```json
{
  "school_id": "string",
  "amount": "string",
  "callback_url": "string",
  "sign": "string"
}
```

**Response:**
```json
{
  "collect_request_id": "string",
  "Collect_request_url": "string",
  "sign": "string"
}
```

### 2. Check Collect Request Status

**Endpoint:** `GET /api/erp/collect-request/{collect_request_id}?school_id={school_id}&sign={sign}`

**Response:**
```json
{
  "status": "SUCCESS",
  "amount": 100,
  "details": {
    "payment_methods": null
  },
  "jwt": "string"
}
```

## JWT Signing

### For Create Collect Request
Create a JWT with the following payload and sign it using the PG Secret Key:
```json
{
  "school_id": "string",
  "amount": "string",
  "callback_url": "string"
}
```

### For Status Check
Create a JWT with the following payload and sign it using the PG Secret Key:
```json
{
  "school_id": "string",
  "collect_request_id": "string"
}
```

## Example Usage

### Creating a Collect Request

```bash
curl --location 'http://localhost:3000/api/erp/create-collect-request' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--data '{
  "school_id": "65b0e6293e9f76a9694d84b4",
  "amount": "100",
  "callback_url": "https://your-callback-url.com",
  "sign": "YOUR_JWT_TOKEN"
}'
```

### Checking Status

```bash
curl --location 'http://localhost:3000/api/erp/collect-request/COLLECT_REQUEST_ID?school_id=SCHOOL_ID&sign=YOUR_JWT_TOKEN'
```

## Test Environment

This integration is configured for the test environment. Use the following for testing:
- Use netbanking or card for payment simulation
- Do not use real UPI or QR codes
- Test credentials: https://www.cashfree.com/docs/payments/online/resources/sandbox-environment

## Implementation Details

1. **JWT Verification**: All requests are verified using the PG Secret Key
2. **Database Storage**: Orders and order statuses are stored in MongoDB
3. **Error Handling**: Comprehensive error handling with proper HTTP status codes
4. **Logging**: All operations are logged for debugging and monitoring
5. **Security**: JWT tokens are validated for each request to ensure authenticity

## Files Modified/Created

- `src/controllers/paymentController.js` - Added new controller methods
- `src/routes/collect.js` - New route file for collect endpoints
- `src/routes/index.js` - Updated to include collect routes
- `src/config/index.js` - Added PG_SECRET_KEY configuration
- `src/utils/jwtHelper.js` - Utility functions for JWT operations
