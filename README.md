# 🎬 CINEMATHEQUE - Media Collection Manager

A sophisticated media collection management system with a distinctive dark cinema noir aesthetic. Track your movies and TV series with TMDB integration, custom fields, and beautiful visualizations.

![Media Collection Manager](https://img.shields.io/badge/version-1.0.0-gold)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)
![React](https://img.shields.io/badge/react-18.2-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)

## ✨ Features

### Core Functionality
- **TMDB Integration**: Automatically fetch movie and TV show details including cast, crew, ratings, and posters
- **Custom Fields**: Track viewing status, personal ratings, backup status, quality, and physical location
- **Smart Filtering**: Search and filter by type, viewing status, backup status, and quality
- **Dashboard Analytics**: Beautiful visualizations of your collection statistics
- **Loaning System**: Track who has borrowed your physical media

### Design Features
- **Noir Cinema Theme**: Dark, sophisticated interface with film grain effects
- **Vintage Typography**: Distinctive fonts (Bebas Neue & Barlow) for that classic cinema feel
- **Smooth Animations**: Elegant transitions and hover effects
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- TMDB API Key (get one free at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Backend Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
TMDB_API_KEY=your_tmdb_api_key_here
```

3. **Run the backend server:**
```bash
python backend.py
```
The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Node dependencies:**
```bash
npm install
```

2. **Run the development server:**
```bash
npm start
```
The app will open at `http://localhost:3000`

## 🏗️ Production Build

### Build the Frontend
```bash
npm run build
```
This creates an optimized production build in the `build/` directory.

### Configure Backend for Production
Update the backend to serve the static files:
```python
from fastapi.staticfiles import StaticFiles

# Add after app initialization
app.mount("/", StaticFiles(directory="build", html=True), name="static")
```

## 🌐 Deployment Options

### Free/Low-Cost Hosting Recommendations

#### Option 1: Vercel (Frontend) + Railway (Backend)
**Best for: Scalability and ease of use**

**Frontend (Vercel):**
- Free tier with generous limits
- Automatic deploys from GitHub
- Global CDN
- Setup:
  ```bash
  npm i -g vercel
  vercel
  ```

**Backend (Railway):**
- $5/month after free trial
- PostgreSQL database included
- Automatic deploys
- Environment variable management

#### Option 2: Render
**Best for: All-in-one solution**
- Free tier available (spins down after inactivity)
- Deploy both frontend and backend
- PostgreSQL database included
- Environment secrets management
- Setup via GitHub connection

#### Option 3: Fly.io
**Best for: Global distribution**
- Free tier with 3 shared VMs
- Global deployment
- Built-in PostgreSQL
- Dockerfile deployment:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Option 4: Netlify (Frontend) + Supabase (Backend)
**Best for: Serverless approach**

**Frontend (Netlify):**
- Free tier with 100GB bandwidth
- Continuous deployment
- Form handling and functions

**Backend (Supabase):**
- Free PostgreSQL database
- Built-in authentication
- Realtime subscriptions
- Edge functions for API

#### Option 5: Cloudflare Pages + Workers
**Best for: Performance and cost**
- Frontend on Pages (unlimited requests)
- Backend on Workers (100k requests/day free)
- KV storage for data
- Durable Objects for state

### Database Migration (for Production)

To use PostgreSQL instead of SQLite:

1. **Install PostgreSQL adapter:**
```bash
pip install psycopg2-binary
```

2. **Update backend.py:**
```python
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()
```

### Environment Variables for Production
```env
TMDB_API_KEY=your_tmdb_api_key
DATABASE_URL=postgresql://user:password@host:port/dbname
REACT_APP_API_URL=https://your-api-domain.com
```

## 📁 Project Structure

```
media-collection-manager/
├── backend.py           # FastAPI backend server
├── requirements.txt     # Python dependencies
├── package.json        # Node.js dependencies
├── App.jsx            # Main React component
├── App.css            # Noir cinema styling
├── .env               # Environment variables
└── build/            # Production build (after npm run build)
```

## 🎨 Customization

### Theme Colors
Edit the CSS variables in `App.css`:
```css
:root {
  --noir-black: #0a0908;
  --deep-red: #a01a1a;
  --gold: #d4af37;
  /* ... */
}
```

### Add Custom Fields
1. Update the Pydantic model in `backend.py`
2. Add database migration
3. Update the form in `App.jsx`

### Change Fonts
Replace the Google Fonts import in `App.css`:
```css
@import url('your-font-url-here');
```

## 🔒 Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **CORS Configuration**: Update allowed origins in production
3. **Input Validation**: The backend validates all inputs with Pydantic
4. **SQL Injection Prevention**: Using parameterized queries
5. **HTTPS**: Always use HTTPS in production

## 📊 API Documentation

Once running, access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🚧 Roadmap

- [ ] User authentication and multi-user support
- [ ] Import/Export functionality (CSV, JSON)
- [ ] Watchlist and recommendations
- [ ] Mobile app (React Native)
- [ ] Integration with streaming services
- [ ] Social features (share lists, reviews)
- [ ] Advanced statistics and insights
- [ ] Bulk operations
- [ ] Image optimization and caching

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for the comprehensive movie database API
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python web framework
- [React](https://reactjs.org/) for the UI library

---

Built with 🎬 by a cinema enthusiast
