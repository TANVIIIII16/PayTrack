# School Payment API

A simple Express.js API for managing school payments and transactions with MongoDB.

## Features

- 🔐 JWT Authentication & Authorization
- 💳 Payment Gateway Integration
- 📊 Transaction Management with Aggregation
- 🔗 Webhook Processing
- 📈 Pagination & Sorting
- 🛡️ Data Validation & Error Handling
- 📝 Comprehensive Logging

## Tech Stack

- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **HTTP Client**: Axios
- **Package Manager**: npm/pnpm

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd school-payment-api
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create a `.env` file with your configuration:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/school-payment-db?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Payment Gateway Configuration
PG_KEY=edvtest01
API_KEY=your-api-key-here
SCHOOL_ID=65b0e6293e9f76a9694d84b4
PAYMENT_API_URL=https://api.payment-gateway.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

4. Start the server:

```bash
# Production
npm start

# Development with auto-reload
npm run dev
```

## API Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "school_admin",
  "school_id": "65b0e6293e9f76a9694d84b4"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile

```http
GET /auth/profile
Authorization: Bearer <jwt-token>
```

### Payment

#### Create Payment

```http
POST /payment/create-payment
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "school_id": "65b0e6293e9f76a9694d84b4",
  "trustee_id": "65b0e552dd31950a9b41c5ba",
  "student_info": {
    "name": "John Doe",
    "id": "STU001",
    "email": "john.doe@school.com"
  },
  "gateway_name": "PhonePe",
  "order_amount": 2000
}
```

#### Get Payment Status

```http
GET /payment/status/{customOrderId}
Authorization: Bearer <jwt-token>
```

### Transactions

#### Get All Transactions

```http
GET /transactions?page=1&limit=10&sortBy=payment_time&sortOrder=desc
Authorization: Bearer <jwt-token>
```

#### Get Transactions by School

```http
GET /transactions/school/{schoolId}?page=1&limit=10&sortBy=payment_time&sortOrder=desc
Authorization: Bearer <jwt-token>
```

#### Get Transaction Status

```http
GET /transactions/status/{customOrderId}
Authorization: Bearer <jwt-token>
```

#### Create Dummy Data

```http
POST /transactions/dummy-data
Authorization: Bearer <jwt-token>
```

### Webhook

#### Process Webhook

```http
POST /webhook
Content-Type: application/json

{
  "status": 200,
  "order_info": {
    "order_id": "ORDER_001",
    "order_amount": 2000,
    "transaction_amount": 2200,
    "gateway": "PhonePe",
    "bank_reference": "YESBNK222",
    "status": "success",
    "payment_mode": "upi",
    "payemnt_details": "success@ybl",
    "Payment_message": "payment success",
    "payment_time": "2025-04-23T08:14:21.945+00:00",
    "error_message": "NA"
  }
}
```

## Database Schemas

### Order Schema

```javascript
{
  _id: ObjectId,
  school_id: ObjectId,
  trustee_id: ObjectId,
  student_info: {
    name: String,
    id: String,
    email: String
  },
  gateway_name: String,
  custom_order_id: String
}
```

### Order Status Schema

```javascript
{
  _id: ObjectId,
  collect_id: ObjectId (Reference to Order),
  order_amount: Number,
  transaction_amount: Number,
  payment_mode: String,
  payment_details: String,
  bank_reference: String,
  payment_message: String,
  status: String,
  error_message: String,
  payment_time: Date
}
```

### Webhook Logs Schema

```javascript
{
  _id: ObjectId,
  order_id: String,
  webhook_payload: Mixed,
  status: String,
  processed_at: Date,
  error_message: String
}
```

### User Schema

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,
  role: String,
  school_id: ObjectId,
  is_active: Boolean
}
```

## Features in Detail

### 🔐 JWT Authentication

- Secure user registration and login
- JWT token-based authentication
- Role-based access control
- Password hashing with bcryptjs

### 💳 Payment Gateway Integration

- Integration with external payment APIs
- JWT-signed payloads for security
- Automatic payment page redirection
- Transaction status tracking

### 📊 Advanced Transaction Management

- MongoDB aggregation pipelines for complex queries
- Pagination support with configurable limits
- Sorting by multiple fields (payment_time, status, amount)
- School-specific transaction filtering

### 🔗 Webhook Processing

- Secure webhook endpoint for payment updates
- Automatic order status updates
- Comprehensive webhook logging
- Error handling and retry mechanisms

### 🛡️ Security Features

- Input validation using class-validator
- CORS configuration
- JWT token validation
- Password hashing
- SQL injection prevention

### 📈 Performance Optimizations

- Database indexing on critical fields
- Pagination for large datasets
- Efficient aggregation queries
- Connection pooling

## Testing

### Quick Test Commands

```bash
# Health Check
curl http://localhost:3000/health

# Register User
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","role":"school_admin","school_id":"65b0e6293e9f76a9694d84b4"}'
```

## Error Handling

The API provides comprehensive error handling with:

- HTTP status codes
- Descriptive error messages
- Validation error details
- Database error handling
- Payment gateway error handling

## Logging

- Webhook events are logged for audit trails
- Failed transactions are tracked
- Error messages are stored for debugging
- Request/response logging for monitoring

## Local Development

```bash
# Install dependencies
npm install

# Create environment file
# Copy the .env example above and update with your values

# Start development server
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
