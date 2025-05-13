# CA Client Management System

## Overview
The CA Client Management System is a web-based application designed for Chartered Accountant firms in India to manage their client database efficiently. The application features a secure login system, user management capabilities, and an elegant user interface.

## Features
- **Admin Login**: Secure access for administrators with predefined credentials.
- **User Management**: Admins can create users and assign roles (admin or user).
- **Admin Dashboard**: A dedicated dashboard for admin users to manage the application.
- **Client Management**: Complete client data management with detailed profiles.
- **Document Management**: Upload, view, and delete client documents securely.
- **Search & Filter**: Find clients quickly with advanced search options.
- **Professional UI**: Modern and responsive user interface for a seamless experience.

## Technology Stack
- **Frontend**: React.js for building the user interface.
- **Backend**: Node.js with Express for server-side logic.
- **Database**: MongoDB Atlas for data storage.
- **Authentication**: JWT-based authentication system.
- **File Storage**: Local storage with secure access control.

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Install all dependencies (backend and frontend):
   ```
   npm run install-all
   ```

## Configuration
- Update the MongoDB connection string in `backend/config/database.js` to connect to your MongoDB Atlas instance.
- The application comes with a default admin user:
  - Username: KlickBurn
  - Password: ilovekomal

## Running the Application
1. Create the admin user (first time only):
   ```
   npm run setup
   ```
2. Start both backend and frontend with a single command:
   ```
   npm start
   ```

   Or run them separately:
   ```
   # Backend only
   npm run server
   
   # Frontend only
   npm run client
   ```

## Usage
- Access the application in your web browser at `http://localhost:3000`.
- Use the admin credentials to log in:
  - Username: KlickBurn
  - Password: 

## Client Management
The application allows you to:
- Create new client profiles with detailed information
- View all clients with filtering and search capabilities
- Edit client details as needed
- Maintain client contact information, business details, and service history

## Document Management
For each client, you can:
- Upload important documents (PDF, Word, Excel, and images)
- View and download documents directly from the client profile
- Delete documents when they're no longer needed
- Keep track of document upload dates and file sizes

## User Management
As an admin, you can:
- Create new user accounts for staff members
- Assign roles (admin or regular user) to control access
- View a list of all users in the system

## Testing
The application includes a test script to verify functionality:
```
npm test
```

## Security Features
- JWT-based authentication with secure token handling
- Role-based access control for different user types
- Password hashing for secure storage
- Protected API routes requiring authentication

## Future Enhancements
- Reporting functionality for client data and activities
- Email notifications for important events
- Calendar integration for client appointments
- Mobile application version
  - Password: ilovekomal

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.