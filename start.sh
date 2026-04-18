#!/bin/bash
# Start both backend and frontend concurrently

echo "🚀 Starting Code Arena..."

# Start backend
cd backend
npm install --silent
node server.js &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"

# Start frontend
cd ../frontend
npm install --silent
npm start &
FRONTEND_PID=$!
echo "✓ Frontend starting (PID: $FRONTEND_PID)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend:  http://localhost:4000"
echo "  Frontend: http://localhost:3000"
echo "  Admin pw: arena2024"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop both servers"

wait
