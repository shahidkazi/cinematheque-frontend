#!/bin/bash

echo "🎬 Starting Media Collection Manager for Local Network Access"
echo "==========================================================="
echo ""

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n1 | awk '{print $2}')
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

echo "📡 Your local IP address: $LOCAL_IP"
echo ""
echo "To access from other devices on your network:"
echo "  Frontend: http://$LOCAL_IP:3000"
echo "  Backend API: http://$LOCAL_IP:8000"
echo "  API Docs: http://$LOCAL_IP:8000/docs"
echo ""

# Start backend with host 0.0.0.0 to allow network access
echo "Starting backend on 0.0.0.0:8000..."
python3 backend.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Set environment variable for React
export REACT_APP_API_URL=http://$LOCAL_IP:8000

# Start frontend with host 0.0.0.0
echo "Starting frontend on 0.0.0.0:3000..."
HOST=0.0.0.0 npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Services started!"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
