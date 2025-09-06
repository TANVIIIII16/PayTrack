# EduPay Backend API

An industrial-grade Express.js school payment API with clean architecture, built for managing school payment transactions, user authentication, and payment gateway integrations.

## 🚀 Features

- **Clean Architecture**: Modular structure with separation of concerns
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Payment Processing**: Support for multiple payment gateways (PhonePe, Razorpay, PayU, etc.)
- **Transaction Management**: Complete transaction lifecycle management
- **Webhook Support**: Real-time payment status updates
- **Data Validation**: Comprehensive input validation using express-validator
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Structured logging with different log levels
- **Database**: MongoDB with Mongoose ODM
- **Security**: Password hashing, CORS protection, input sanitization

## 📁 Project Structure

```
EduPay-Backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database connection
│   │   └── index.js      # App configuration
│   ├── controllers/      # Business logic controllers
│   │   ├── authController.js
│   │   ├── paymentController.js
│   │   ├── transactionController.js
│   │   └── webhookController.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js       # Authentication middleware
│   │   ├── errorHandler.js
│   │   └── validation.js # Input validation
│   ├── models/          # Database models
│   │   ├── User.js
│   │   ├── Order.js
│   │   ├── OrderStatus.js
│   │   └── WebhookLogs.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── payment.js
│   │   ├── transaction.js
│   │   ├── webhook.js
│   │   └── index.js
│   ├── utils/           # Utility functions
│   │   ├── constants.js
│   │   ├── logger.js
│   │   └── response.js
│   └── app.js           # Express app configuration
├── server.js            # Server entry point
├── package.json
├── .env.example
├── .eslintrc.js
├── .prettierrc
└── jest.config.js
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EduPay-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration values.

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/school-payment-db |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `PG_KEY` | Payment gateway key | - |
| `API_KEY` | API key for payment gateway | - |
| `SCHOOL_ID` | School identifier | - |
| `CORS_ORIGIN` | CORS allowed origins | * |

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "school_admin",
  "school_id": "school123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Payment Endpoints

#### Create Payment
```http
POST /api/payment/create-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "school_id": "school123",
  "trustee_id": "trustee456",
  "student_info": {
    "name": "John Doe",
    "id": "STU001",
    "email": "john@school.com"
  },
  "gateway_name": "PhonePe",
  "order_amount": 2000
}
```

#### Get Payment Status
```http
GET /api/payment/status/:customOrderId
Authorization: Bearer <token>
```

### Transaction Endpoints

#### Get All Transactions
```http
GET /api/transactions?page=1&limit=10&sortBy=payment_time&sortOrder=desc
Authorization: Bearer <token>
```

#### Get School Transactions
```http
GET /api/transactions/school/:schoolId?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Transaction Status
```http
GET /api/transactions/status/:customOrderId
Authorization: Bearer <token>
```

### Webhook Endpoints

#### Process Payment Webhook
```http
POST /api/webhook
Content-Type: application/json

{
  "order_info": {
    "order_id": "ORDER_123",
    "order_amount": 2000,
    "transaction_amount": 2000,
    "payment_mode": "upi",
    "payemnt_details": "success@ybl",
    "bank_reference": "YESBNK222",
    "Payment_message": "payment success",
    "status": "success",
    "error_message": "NA",
    "payment_time": "2024-01-01T10:00:00Z"
  }
}
```

## 🔐 User Roles

- **admin**: Full system access
- **school_admin**: School-specific access
- **trustee**: Limited access to specific transactions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

## 📝 Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper CORS origins
4. Set up MongoDB with authentication
5. Use environment-specific configurations
6. Enable logging and monitoring
7. Set up SSL/TLS certificates

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔄 Version History

- **v1.0.0**: Initial release with clean architecture
- **v0.0.1**: Legacy single-file implementation