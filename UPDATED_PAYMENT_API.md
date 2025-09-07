# Updated Payment API Integration

The `/api/payment/create-payment` route has been enhanced to integrate with the external payment API while maintaining backward compatibility.

## Enhanced Features

### 1. External API Integration
- Automatically calls the external payment API (`https://dev-vanilla.edviron.com/erp/create-collect-request`)
- Falls back to internal payment processing if external API is unavailable
- Stores external collect request ID and payment URL for tracking

### 2. Real-time Status Updates
- Payment status endpoint now checks external API for latest status
- Automatically syncs local database with external payment status
- Provides comprehensive payment information

### 3. Callback Handling
- New callback endpoint to handle payment completion notifications
- Automatic status updates when payments are completed
- Redirects to custom callback URLs

## API Endpoints

### Create Payment (Enhanced)
**Endpoint:** `POST /api/payment/create-payment`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>`

**Request Body:**
```json
{
  "school_id": "string",
  "trustee_id": "string",
  "student_info": {
    "name": "string",
    "id": "string",
    "email": "string"
  },
  "gateway_name": "string",
  "order_amount": "number",
  "callback_url": "string" // Optional
}
```

**Response (Success with External API):**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "order_id": "ORDER_1234567890_abc12345",
    "collect_request_id": "6808bc4888e4e3c149e757f1",
    "payment_url": "https://dev-vanilla.edviron.com/payment/6808bc4888e4e3c149e757f1",
    "external_sign": "jwt_token_here"
  }
}
```

**Response (Fallback Mode):**
```json
{
  "success": true,
  "message": "Payment initiated successfully (fallback mode)",
  "data": {
    "order_id": "ORDER_1234567890_abc12345",
    "payment_url": "http://localhost:3000/api/payment/process/ORDER_1234567890_abc12345",
    "jwt_token": "jwt_token_here",
    "note": "External API unavailable, using fallback payment method"
  }
}
```

### Get Payment Status (Enhanced)
**Endpoint:** `GET /api/payment/status/:customOrderId`

**Response (With External Integration):**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "order_id": "ORDER_1234567890_abc12345",
    "collect_request_id": "6808bc4888e4e3c149e757f1",
    "status": "success",
    "amount": 100,
    "payment_details": "card",
    "payment_time": "2024-01-15T10:30:00.000Z",
    "order_amount": 100,
    "transaction_amount": 100,
    "external_jwt": "jwt_token_here"
  }
}
```

### Payment Callback
**Endpoint:** `POST /api/payment/callback`

**Request Body:**
```json
{
  "collect_request_id": "6808bc4888e4e3c149e757f1",
  "status": "success",
  "amount": 100,
  "payment_method": "card",
  "transaction_id": "txn_123456789"
}
```

## Database Schema Updates

### Order Model
Added new fields:
- `order_amount`: Payment amount
- `callback_url`: Custom callback URL
- `external_collect_id`: External API collect request ID
- `external_payment_url`: External payment URL

## Environment Variables

Ensure these are set in your `.env` file:
```env
PG_KEY=your_pg_key_here
PG_SECRET_KEY=your_pg_secret_key_here
API_KEY=your_api_key_here
SCHOOL_ID=your_school_id_here
```

## Example Usage

### Creating a Payment
```bash
curl --location 'http://localhost:3000/api/payment/create-payment' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
  "school_id": "65b0e6293e9f76a9694d84b4",
  "trustee_id": "trustee123",
  "student_info": {
    "name": "John Doe",
    "id": "STU001",
    "email": "john.doe@example.com"
  },
  "gateway_name": "Razorpay",
  "order_amount": 100,
  "callback_url": "https://your-app.com/payment-success"
}'
```

### Checking Payment Status
```bash
curl --location 'http://localhost:3000/api/payment/status/ORDER_1234567890_abc12345' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Error Handling

The API includes comprehensive error handling:
- External API failures fall back to internal processing
- Invalid JWT tokens are rejected with proper error messages
- Database errors are logged and handled gracefully
- Network timeouts are managed with appropriate fallbacks

## Logging

All payment operations are logged with:
- Order IDs and collect request IDs
- Payment amounts and statuses
- Error details for debugging
- External API call results

## Security Features

- JWT token validation for all requests
- Secure external API communication
- Input validation and sanitization
- Comprehensive error logging without exposing sensitive data
