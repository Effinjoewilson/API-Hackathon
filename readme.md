# API-Hackathon

A full-stack web application built with Django (backend) and Next.js (frontend), featuring PostgreSQL database and AI integration via OpenRouter.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.13** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads/)
- **pip** (Python package manager)
- **npm** or **yarn** (Node package manager)

---

## 🛠️ Tech Stack

### Backend
- **Django** - Python web framework
- **PostgreSQL** - Relational database
- **OpenRouter API** - AI integration
- **Cryptography** - Database encryption

### Frontend
- **Next.js** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

---

## 📁 Project Structure

```
API-Hackathon/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   └── components/    # React components
│   ├── public/            # Static assets
│   ├── .env               # Frontend environment variables
│   └── package.json       # Frontend dependencies
│
├── server/                # Django backend
│   ├── accounts/          # User authentication
│   ├── activities/        # Activity management
│   ├── apis/              # API endpoints
│   ├── backend/           # Core backend settings
│   ├── databases/         # Database configurations
│   ├── mappings/          # Data mappings
│   ├── .env               # Backend environment variables
│   ├── manage.py          # Django management script
│   └── requirements.txt   # Python dependencies
│
└── readme.md              # Project documentation
```

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Effinjoewilson/API-Hackathon.git
cd API-Hackathon
```

### 2. Setup PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE hackathon_db;
```

### 3. Backend Setup (Django)

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Make migrations (only needed after model changes)
python manage.py makemigrations

# Run migrations
python manage.py migrate

```

### 4. Frontend Setup (Next.js)

```bash
cd client

# Install dependencies
npm install
# or
yarn install
```

---

## 🔐 Environment Variables

### Backend (.env in `server/`)

Create a `.env` file in the `server/` directory:

```env
# Database Configuration
POSTGRES_DB=hackathon_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django Secret Key (generate a new one for production)
SECRET_KEY=your-secret-key-here

# Database Encryption Key (generate using: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
DB_ENCRYPTION_KEY=your-encryption-key-here

# OpenRouter API Key
OPENROUTER_API_KEY=your-openrouter-api-key
```

**🔑 Generate Keys:**

```bash
# Generate Django SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Generate DB_ENCRYPTION_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Frontend (.env in `client/`)

Create a `.env.local` file in the `client/` directory:

```env
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🚀 Running the Application

### Start Backend Server

```bash
cd server

# Activate virtual environment if not already activated
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run Django development server
python manage.py runserver
```

**Backend will run at:** `http://127.0.0.1:8000/`

### Start Frontend Server

Open a new terminal:

```bash
cd client

# Run Next.js development server
npm run dev
# or
yarn dev
```

**Frontend will run at:** `http://localhost:3000/`

---

## 📡 API Documentation

Once the backend is running, you can access:

- **Django Admin:** `http://127.0.0.1:8000/admin/`
- **API Endpoints:** `http://127.0.0.1:8000/api/`

---

## 🧪 Development

### Backend Commands

```bash
# Run tests
python manage.py test

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Frontend Commands

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Change default passwords** in production
3. **Use strong SECRET_KEY** in production
4. **Enable DEBUG=False** in Django production settings
5. **Configure CORS** properly for production
6. **Use HTTPS** in production environment

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if port 5432 is available

### Frontend Build Errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Backend Migration Issues
- Delete migration files (except `__init__.py`)
- Run `python manage.py makemigrations`
- Run `python manage.py migrate`

---

**Happy Coding! 🎉**
