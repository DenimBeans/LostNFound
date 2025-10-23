# Lost & Found - Backend API

This is the backend API for the Lost & Found application. Built with Node.js, Express, and MongoDB.

## 🚀 Current Status

### ✅ Completed Features
- User registration endpoint
- User login with JWT authentication
- Password hashing with bcrypt
- MongoDB integration
- Error handling and validation
- CORS enabled for frontend integration

### 🚧 In Progress / TODO
- [ ] Email verification (code written, needs Gmail setup)
- [ ] Password recovery/reset functionality
- [ ] Image upload for found items
- [ ] Geolocation-based search for nearby items
- [ ] Item CRUD operations (partially implemented)
- [ ] Unit and integration tests
- [ ] API documentation with SwaggerHub
- [ ] Deployment to remote server

---

## 📋 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (MongoDB Atlas)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Security:** bcrypt
- **Email:** Nodemailer (configured but needs credentials)

---

## 📂 Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection config
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic (register, login)
│   │   └── itemController.js  # Item CRUD operations
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Item.js            # Item schema
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   └── itemRoutes.js      # Item endpoints
│   └── server.js              # Main server file
├── .env                       # Environment variables (NOT in repo)
├── .gitignore                 # Git ignore file
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/DenimBeans/LostNFound.git
   cd LostNFound/backend
```

2. **Install dependencies**
```bash
   npm install
```

3. **Create `.env` file**
   
   Create a `.env` file in the `backend` folder with the following variables:
```env
   MONGO_URI=your_mongodb_connection_string
   PORT=4000
   ACCESS_TOKEN_SECRET=your_jwt_secret_key_minimum_32_characters
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password
   NODE_ENV=development
   BASE_URL=http://localhost:4000
```

   **⚠️ Important:** Contact team lead for the actual MongoDB connection string.

4. **Start the development server**
```bash
   npm run dev
```

   Server will run on `http://localhost:4000`

---

## 🧪 API Endpoints

### Authentication

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | ✅ Working |
| POST | `/api/auth/login` | Login user | ✅ Working |
| GET | `/api/auth/verify/:token` | Verify email | 🚧 Needs Gmail setup |
| POST | `/api/auth/forgot-password` | Request password reset | 🚧 Needs Gmail setup |
| POST | `/api/auth/reset-password/:token` | Reset password | 🚧 Needs Gmail setup |

### Items (TODO)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/items` | Get all items | 🚧 In progress |
| POST | `/api/items` | Create new item | 🚧 In progress |
| GET | `/api/items/:id` | Get item by ID | 🚧 In progress |
| PATCH | `/api/items/:id/claim` | Claim an item | 🚧 In progress |
| DELETE | `/api/items/:id` | Delete item | 🚧 In progress |

---

## 📨 Testing with Postman

### Register User
```
POST http://localhost:4000/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "673abc...",
  "error": ""
}
```

### Login User
```
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "673abc...",
  "firstName": "John",
  "lastName": "Doe",
  "error": ""
}
```

---

## 🔐 Security Notes

- Passwords are hashed using bcrypt before storing
- JWT tokens expire after 24 hours
- All sensitive data is stored in `.env` (not committed to repo)
- CORS is configured for frontend access

---

## 🚧 Known Issues / Limitations

1. **Email verification not fully functional** - Gmail credentials need to be configured
2. **No automated tests yet** - Unit and integration tests need to be written
3. **Item endpoints incomplete** - CRUD operations partially implemented
4. **No rate limiting** - API is vulnerable to spam/abuse
5. **No input sanitization** - Need to add validation middleware
6. **Error messages could be more specific** - Some generic error responses

---

## 📚 Next Steps

### High Priority (Required for Final Presentation)
1. Complete email verification setup
2. Implement password recovery
3. Write unit and integration tests
4. Create SwaggerHub documentation
5. Deploy to remote server (Digital Ocean/Railway)
6. Set up domain name

### Medium Priority (Nice to Have)
1. Image upload functionality for items
2. Geolocation-based search
3. Rate limiting middleware
4. Input sanitization
5. Better error handling
6. Logging system

### Low Priority (Future Enhancements)
1. Admin dashboard
2. Analytics/reporting
3. Push notifications
4. SMS verification option
5. OAuth integration (Google/Facebook login)

---

## 👥 Team Members

- **Rian** - Database setup and initial backend structure
- **Jean** - Remote server deployment and configuration
- **[Your Name]** - API endpoints and authentication logic
- **Bryant** - API testing and integration
- **Yoshida** - Frontend development
- **Lucas** - Frontend development

---

## 📄 License

This project is for educational purposes as part of [Course Name] at [University Name].

---

## 🤝 Contributing

This is a team project. Please coordinate with team members before making major changes.

### How to Contribute
1. Pull latest changes: `git pull origin main`
2. Create feature branch: `git checkout -b feature/your-feature-name`
3. Make changes and test locally
4. Commit: `git commit -m "Description of changes"`
5. Push: `git push origin feature/your-feature-name`
6. Create Pull Request on GitHub

---

## 📞 Contact

For questions about the backend API, contact the backend team members via Discord.

**MongoDB Connection String:** Ask Jean or Rian in Discord (contains sensitive credentials)
