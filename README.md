# TaskVerify

A secure, role-based task tracking and verification system for students, teachers, and admins.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Media Storage**: Cloudinary (API)

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up a `.env` file in the `backend` folder with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```
4. Start the application:
   ```bash
   npm start
   ```