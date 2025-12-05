#!/bin/bash

echo "🎬 CINEMATHEQUE - Media Collection Manager Setup"
echo "================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed!"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    echo "TMDB_API_KEY=your_tmdb_api_key_here" > .env
    echo "REACT_APP_API_URL=http://localhost:8000" >> .env
    echo ""
    echo "⚠️  Please edit .env and add your TMDB API key"
    echo "   Get one free at: https://www.themoviedb.org/settings/api"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Backend:  python3 backend.py"
echo "  2. Frontend: npm start (in a new terminal)"
echo ""
echo "The app will be available at http://localhost:3000"
echo "API documentation at http://localhost:8000/docs"
