import os
import json
import requests
from django.conf import settings

PREREQUISITES = """
### Prerequisites

Before running the application, ensure the following are installed:

- **Node.js v20.x** (for Next.js frontend)
- **Python 3.13+** (for Django backend)
- **PostgreSQL 15+** (Database)
- **Git** (Version Control)
"""

SETUP_INSTRUCTIONS = """
### How to Run - SETUP_INSTRUCTIONS
1. Clone the repository
git clone https://github.com/Effinjoewilson/API-Hackathon.git
cd API-Hackathon

2. Run Backend (Django - server/)
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

Now create a .env file in server and include:
    POSTGRES_DB=hackathon_db
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    SECRET_KEY=

    DB_ENCRYPTION_KEY=


---

###3. Run Frontend (Next.js - client/)

cd client

# Install dependencies
npm install

# Start frontend dev server
npm run dev

Next.js app will run at: http://localhost:3000/

Now create a .env file in client and include:

    NEXT_PUBLIC_API_URL=http://localhost:8000/api

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


Now create a .env file in server and include:
    POSTGRES_DB=hackathon_db
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    SECRET_KEY=

    DB_ENCRYPTION_KEY=


---


###3. Run Frontend (Next.js - client/)

cd client

# Install dependencies
npm install

# Start frontend dev server
npm run dev

Next.js app will run at: http://localhost:3000/

Now create a .env file in client and include:

    NEXT_PUBLIC_API_URL=http://localhost:8000/api

"""


class DocumentationGenerator:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    def generate_documentation(self, system_data):
        if not self.api_key:
            print("Error: OPENROUTER_API_KEY not set in environment")
            return {'success': False, 'error': 'API key not configured'}
            
        if not system_data:
            print("Error: No system data provided")
            return {'success': False, 'error': 'No system data provided'}
            
        try:
            prompt = self._create_prompt(system_data)
            #print(f"Making request to {self.base_url}")
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://apihackathon.com",  # Replace with your domain
                "X-Title": "API Hackathon Documentation Generator",
            }
            
            payload = {
                "model": "openai/gpt-oss-20b:free",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a technical documentation expert. Generate clear, well-structured documentation based on the provided system information."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }

            print("Sending request To OpenRouter")
            #print("Request payload:", json.dumps(payload, indent=2))

            response = requests.post(
                url=self.base_url,
                headers=headers,
                data=json.dumps(payload),  # Changed from json=payload → data=json.dumps(payload)
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'documentation': result['choices'][0]['message']['content']
                }
            else:
                print("API Error:", response.text)
                return {
                    'success': False,
                    'error': f"API Error: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _create_prompt(self, data):
        from .generator import SETUP_INSTRUCTIONS, PREREQUISITES

        return f"""
    You are an expert technical documentation generator. Using the system data provided below, generate **complete, professional, and structured documentation** for developers and users.

    Follow these strict guidelines:

    1. **Setup Guide**
    - Include the following prerequisites and setup instructions:
    {PREREQUISITES}
    {SETUP_INSTRUCTIONS}
    - Step-by-step installation instructions
    - Environment setup, dependencies, and configuration
    - How to run the system locally or in production
    - Include code blocks, commands, and examples

    2. **Developer Manual**
    - Overview of system architecture
    - Description of key modules/components
    - How APIs, databases, and mappings interact
    - Coding standards, naming conventions, and guidelines

    3. **API Documentation**
    - List all API endpoints with:
        - Name, HTTP method, path, description
        - Headers, query parameters, and body templates
        - Authentication requirements
        - Example request and response JSON
        - Versioning and tags
    - Include examples in Markdown code blocks

    4. **Design Documentation**
    - High-level system design and architecture diagrams (textual/ASCII if diagram not possible)
    - Database schemas and relationships
    - Data mappings between APIs and databases
    - Notes on data flow, error handling, and performance considerations

    5. **Formatting**
    - Use Markdown headers (e.g., #, ##, ###)
    - Use tables where suitable for API parameters, database fields, and mappings
    - Include example code blocks with proper syntax highlighting
    - Make it readable for developers with minimal prior knowledge

    ---

    **System Data:**  

    **API Endpoints:**
    {json.dumps(data['api_endpoints'], indent=2)}

    **Database Connections:**
    {json.dumps(data['databases'], indent=2)}

    **Data Mappings:**
    {json.dumps(data['mappings'], indent=2)}

    **Sample Requests/Responses:**
    {json.dumps(data['sample_requests'], indent=2)}

    ---

    **Instructions to AI:**  
    Generate full documentation in Markdown, covering all four sections (Setup Guide, Developer Manual, API Docs, Design Documentation) **comprehensively**. Include examples, tables, and code snippets wherever appropriate. Use the provided prerequisites and setup instructions verbatim where possible. Do not omit any API, database, or mapping from the documentation.
    """
