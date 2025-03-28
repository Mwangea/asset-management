# Asset Management System

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/Node.js-16%2B-brightgreen)](https://nodejs.org/)
[![npm Version](https://img.shields.io/badge/npm-8%2B-orange)](https://www.npmjs.com/)

The Asset Management System is a comprehensive solution for tracking maritime assets using QR codes. It provides a secure and organized way for users to view their assigned assets and for administrators to manage all system assets and users

## Table of Contents
- [Features](##features)
- [Installation](#installation)
- [Usage](#usage)
- [Credentials](#credentials)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

### User Features
- 📊 Dashboard with asset statistics
- 📱 QR code scanning functionality
- 📋 List of assigned assets
- 🔍 Asset details view

### Admin Features
- 👥 User management (Create, Read, Update, Delete)
- 🏷️ Asset management and assignment
- 🖨️ QR code generation/download
- 📈 System-wide analytics

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Mwangea/asset-management.git
cd asset-management
```
2. Install dependencies for both client and server:
```bash
#Client installation
cd client && npm install

# Server installation
cd server && npm install
```

## Usage
Running the Application
Open two separate terminals:

### Terminal 1 (Client):
```
cd client
npm run dev
```
### Terminal 2 (Server):
```
cd server
npm run dev
```
Access the application at http://localhost:3000

### Credentials
Role	Username	Password
Admin	MRTIME001	mrtime001
Regular	MRT001	mrt001

## Project Structure
```
asset-management/
├── client/               # Frontend application
│   ├── public/          # Static assets
│   ├── src/             # Application source code
│   └── package.json     # Frontend dependencies
├── server/              # Backend API
│   ├── models/         # Database models
│   ├── routes/         # API endpoints
│   └── package.json    # Backend dependencies
└── README.md           # Project documentation
```
## Contributing
1. Fork the project
2. Create your feature branch ``` git checkout -b feature/AmazingFeature ```
3. Commit your changes ```git commit -m 'Add some AmazingFeature'```
4. Push to the branch ```git push origin feature/AmazingFeature```
5. Open a Pull Request

## License
Distributed under the MIT License. See LICENSE for more information.

## Contact
For inquiries, please open an issue on the GitHub repository.
