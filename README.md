# 🛂 PassGo Backend - Digital Passport Management System

A comprehensive NestJS-based backend application for managing passport applications, renewals, appointments, and document processing with advanced OCR capabilities.

## 🚀 Features Overview

### 🔐 Authentication & Authorization
- **JWT-based Authentication** with role-based access control
- **Multi-role Support**: Admin, Manager, Applicant roles
- **Secure Password Hashing** using bcrypt
- **Protected Routes** with guards and decorators

### 📋 Passport Application Management
- **New Passport Applications** with complete form handling
- **Application Status Tracking** (Pending, Approved, Rejected, etc.)
- **Document Upload & Verification** with S3 integration
- **Application Analytics** and reporting dashboards
- **Bulk Application Processing** for administrators

### 🔄 Passport Renewal System
- **Renewal Request Processing** for existing passport holders
- **Document Validation** and verification workflows
- **Status Management** with automated notifications
- **Renewal History** tracking and audit trails

### 📅 Appointment Booking System
- **Smart Appointment Scheduling** with availability checking
- **Location-based Booking** for multiple passport offices
- **Time Slot Management** with conflict prevention
- **Appointment Modifications** and cancellations
- **Calendar Integration** with date/time validation

### 🤖 Google Document AI Integration
- **Advanced OCR Processing** for document text extraction
- **Multi-format Support** (PDF, JPEG, PNG)
- **Confidence Scoring** for extracted text
- **Bounding Box Detection** for precise text location
- **Automated Data Validation** from scanned documents

### ☁️ AWS S3 File Management
- **Secure File Upload** with presigned URLs
- **Document Storage** with organized folder structure
- **File Type Validation** and size restrictions
- **Automatic Cleanup** for failed uploads
- **Download URL Generation** with expiration

### 📊 Analytics & Reporting
- **Application Statistics** and trends
- **Appointment Analytics** and utilization rates
- **District-wise Distribution** reports
- **Daily Application Tracking**
- **Passport Type Analytics**

### 🛡️ Security Features
- **Rate Limiting** with Throttler guards
- **Input Validation** with class-validator
- **File Upload Security** with type and size validation
- **CORS Configuration** for cross-origin requests
- **Error Handling** with custom interceptors

## 🏗️ Architecture

### Tech Stack
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport.js
- **File Storage**: AWS S3
- **OCR**: Google Cloud Document AI
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI

### Project Structure
```
src/
├── auth/                 # Authentication & authorization
├── user/                 # User management
├── application/          # Passport applications
├── appointments/         # Appointment booking
├── renew-passport/       # Passport renewals
├── document-ai/          # Google Document AI OCR
├── s3/                   # AWS S3 file management
├── upload/               # File upload handling
├── config/               # Configuration management
├── guards/               # Security guards
├── interceptors/         # Request/response interceptors
├── middleware/           # Custom middleware
├── types/                # TypeScript type definitions
└── enums/                # Application enums
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- MongoDB database
- AWS S3 bucket
- Google Cloud Project with Document AI API

### 1. Clone Repository
```bash
git clone <repository-url>
cd passgo-be
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/bfddgf-dfsd

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex

# Server Configuration
PORT=8080
NODE_ENV=development

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Google Cloud Document AI Configuration
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us
GOOGLE_CLOUD_PROCESSOR_ID=your-document-ai-processor-id

# Option 1: Using Service Account Key File
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Option 2: Using Environment Variables (Alternative to key file)
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf
```

## 🤖 Google Document AI Setup (Step-by-Step)

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your **Project ID**

### Step 2: Enable Document AI API
```bash
# Using gcloud CLI
gcloud services enable documentai.googleapis.com

# Or enable via Console:
# Navigation Menu > APIs & Services > Library > Search "Document AI API" > Enable
```

### Step 3: Create Document AI Processor
1. Go to **Document AI** in Google Cloud Console
2. Click **Create Processor**
3. Select **Document OCR** processor type
4. Choose your region (e.g., `us`, `eu`)
5. Name your processor (e.g., "PassGo OCR Processor")
6. Copy the **Processor ID** from the processor details

### Step 4: Create Service Account
```bash
# Create service account
gcloud iam service-accounts create passgo-document-ai \
    --display-name="PassGo Document AI Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:passgo-document-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/documentai.apiUser"

# Create and download key file
gcloud iam service-accounts keys create google-credentials.json \
    --iam-account=passgo-document-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 5: Configure Authentication

**Option A: Using Key File (Recommended)**
1. Place `google-credentials.json` in your project root
2. Set environment variable:
```env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

**Option B: Using Environment Variables**
1. Extract credentials from the JSON file:
```env
GOOGLE_CLOUD_CLIENT_EMAIL=passgo-document-ai@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Content\n-----END PRIVATE KEY-----"
```

### Step 6: Test Document AI Integration
```bash
# Start the application
pnpm run start:dev

# Test OCR endpoint (requires authentication)
curl -X POST http://localhost:8080/document-ai/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-document.pdf"
```

### Document AI Processor Configuration
The application supports various document types:
- **Identity Documents**: NIC, Birth Certificates
- **Passport Documents**: Current passports, photos
- **Supporting Documents**: Additional verification docs

## 🚀 Running the Application

### Development Mode
```bash
pnpm run start:dev
```

### Production Mode
```bash
pnpm run build
pnpm run start:prod
```

### Docker Deployment
```bash
# Build Docker image
docker build -t passgo-backend .

# Run container
docker run -p 8080:8080 --env-file .env passgo-backend
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /auth/signup     # User registration
POST /auth/login      # User login
POST /auth/test       # Test authentication
```

### Application Management
```
POST /application                    # Create new application
GET /application                     # Get all applications (Admin)
GET /application/my-applications     # Get user's applications
GET /application/:id                 # Get specific application
PATCH /application/:id               # Update application
PATCH /application/:id/status        # Update application status
DELETE /application/:id              # Delete application
POST /application/upload-document/:type  # Upload documents
```

### Appointment System
```
POST /appointments                   # Book new appointment
GET /appointments                    # Get all appointments (Admin)
GET /appointments/my-appointments    # Get user's appointments
GET /appointments/available-slots    # Check available time slots
PATCH /appointments/:id              # Update appointment
DELETE /appointments/:id             # Cancel appointment
```

### Passport Renewal
```
POST /renew-passport                 # Create renewal request
GET /renew-passport                  # Get all renewals (Admin)
GET /renew-passport/my-requests      # Get user's renewals
POST /renew-passport/:id/documents   # Upload renewal documents
GET /renew-passport/:id/documents    # Get document URLs
```

### User Management
```
GET /user/allUsers                   # Get all users (Admin)
GET /user/find/:id                   # Find user by ID
DELETE /user/remove/:id              # Delete user (Admin)
```

## 🔒 Security Considerations

### Implemented Security Measures
- **JWT Token Expiration** and validation
- **Role-based Access Control** (RBAC)
- **Input Validation** on all endpoints
- **File Upload Restrictions** (type, size)
- **Rate Limiting** on sensitive endpoints
- **CORS Configuration** for cross-origin requests

### Recommended Additional Security
- **API Rate Limiting** with Redis
- **Request Logging** and monitoring
- **Database Connection Encryption**
- **Environment Variable Encryption**
- **Regular Security Audits**

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## 📈 Monitoring & Analytics

The application provides comprehensive analytics:
- **Application Metrics**: Total applications, approval rates
- **Appointment Analytics**: Booking patterns, utilization
- **Geographic Distribution**: District-wise statistics
- **Performance Metrics**: Processing times, success rates


## 🆘 Support & Troubleshooting

### Common Issues

**MongoDB Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**Google Document AI Authentication**
```bash
# Verify credentials
gcloud auth application-default print-access-token

# Test API access
gcloud ai document-processors list --location=us
```

**AWS S3 Permission Issues**
- Ensure IAM user has `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` permissions
- Verify bucket CORS configuration for web uploads

### Environment Variables Checklist
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Strong JWT secret key
- [ ] `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` - AWS credentials
- [ ] `AWS_S3_BUCKET_NAME` - S3 bucket name
- [ ] `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project
- [ ] `GOOGLE_CLOUD_PROCESSOR_ID` - Document AI processor
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` - Service account key path

For additional support, please create an issue in the repository or contact the development team.
