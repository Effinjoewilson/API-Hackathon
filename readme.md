# API-Hackathon

## 🚀 How to Run

### 1. Clone the repository
```bash
git clone https://github.com/Effinjoewilson/API-Hackathon.git
cd API-Hackathon


---

###2. Run Backend (Django - server/)
cd server

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver

Django server will run at: http://127.0.0.1:8000/


---


###3. Run Frontend (Next.js - client/)

cd client

# Install dependencies
npm install

# Start frontend dev server
npm run dev

Next.js app will run at: http://localhost:3000/