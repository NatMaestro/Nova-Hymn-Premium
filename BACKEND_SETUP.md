# Backend Setup Guide

## Quick Start

### 1. Start the Backend Server

```bash
cd Nova-Hymnal-Backend

# Activate virtual environment (if using one)
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Start the server
python manage.py runserver
```

The backend will start at: `http://localhost:8000`

### 2. Verify Backend is Running

Open in browser:
- API Root: `http://localhost:8000/api/v1/`
- Swagger Docs: `http://localhost:8000/swagger/`
- Admin Panel: `http://localhost:8000/admin/`

### 3. Frontend Configuration

The frontend is now configured to use the real backend by default.

**No configuration needed** - it will automatically connect to:
- Development: `http://localhost:8000/api/v1`
- Production: `https://your-backend.onrender.com/api/v1`

### 4. Start the Frontend

```bash
cd Nova-Hymnal-Premium
npm start
```

The app will automatically connect to the backend when it's running.

## Environment Variables (Optional)

If you need to customize the API URL, create a `.env` file:

```env
# Development API URL (default: http://localhost:8000/api/v1)
EXPO_PUBLIC_DEV_API_URL=http://localhost:8000/api/v1

# Production API URL (default: https://nova-hymnal-be.onrender.com/api/v1)
EXPO_PUBLIC_PROD_API_URL=https://your-backend.onrender.com/api/v1

# Or override both with a single URL
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Troubleshooting

### Backend Not Running

If you see network errors:
1. Check backend is running: `http://localhost:8000/swagger/`
2. Verify port 8000 is not in use
3. Check backend logs for errors

### Connection Issues

**Physical Device Testing:**
- Use your computer's IP address instead of localhost
- Example: `http://192.168.1.100:8000/api/v1`
- Update `.env`: `EXPO_PUBLIC_DEV_API_URL=http://YOUR_IP:8000/api/v1`

**CORS Errors (Web only):**
- React Native doesn't use CORS
- For Expo Web, ensure backend CORS is configured
- Check `CORS_ALLOW_ALL_ORIGINS=True` in backend `.env`

### Using Mock Data (Fallback)

If backend is unavailable and you want to test frontend:

```env
EXPO_PUBLIC_USE_MOCK_DATA=true
```

## API Endpoints

The frontend uses these endpoints:

- `GET /api/v1/hymns/` - List hymns
- `GET /api/v1/hymns/{id}/` - Get hymn details
- `GET /api/v1/categories/` - List categories
- `GET /api/v1/authors/` - List authors
- `GET /api/v1/denominations/` - List denominations
- `GET /api/v1/hymns/featured/` - Featured hymns
- `GET /api/v1/hymns/daily/` - Hymn of the day
- `POST /api/v1/auth/login/` - Login
- `POST /api/v1/auth/register/` - Register
- `GET /api/v1/auth/profile/` - User profile
- `GET /api/v1/subscriptions/status/` - Subscription status

## Next Steps

1. ✅ Backend running on port 8000
2. ✅ Frontend configured to use real backend
3. ✅ Test API endpoints
4. ✅ Test authentication
5. ✅ Test subscription features

