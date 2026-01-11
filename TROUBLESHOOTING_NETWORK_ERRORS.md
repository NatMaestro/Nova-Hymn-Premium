# Troubleshooting Network Errors

## Problem: "Network Error" when trying to connect to backend

If you're seeing errors like:
```
ERROR Error fetching categories: [AxiosError: Network Error]
ERROR Error fetching hymns: [AxiosError: Network Error]
```

This means the frontend can't reach the backend server.

## Solutions

### Solution 1: Use Mock Data (Quick Fix)

If you just want to test the frontend without the backend:

1. **Set environment variable**:
   ```env
   EXPO_PUBLIC_USE_MOCK_DATA=true
   ```

2. **Or edit `lib/config.ts`**:
   ```typescript
   export const USE_MOCK_DATA = true;
   ```

3. **Restart the app** (clear cache if needed)

### Solution 2: Start the Backend Server

If you want to use the real backend:

1. **Navigate to backend directory**:
   ```bash
   cd Nova-Hymnal-Backend
   ```

2. **Activate virtual environment** (if using one):
   ```bash
   # Windows
   .\venv\Scripts\Activate.ps1
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Start the Django server**:
   ```bash
   python manage.py runserver
   ```

4. **Verify it's running**:
   - Open browser: `http://localhost:8000/api/v1/`
   - Should see API response or Swagger UI at `http://localhost:8000/swagger/`

5. **Update frontend config**:
   - Ensure `EXPO_PUBLIC_USE_MOCK_DATA=false` in `.env`
   - Or set `USE_MOCK_DATA = false` in `lib/config.ts`

### Solution 3: Check API URL Configuration

Verify the API URL is correct:

1. **Check current configuration**:
   - Look at console logs when app starts
   - Should see: `📡 API Configuration: { baseUrl: '...', useMockData: ... }`

2. **For development**:
   - Should be: `http://localhost:8000/api/v1`
   - If using physical device, use your computer's IP: `http://192.168.1.100:8000/api/v1`

3. **For production**:
   - Should be: `https://your-backend.onrender.com/api/v1`

### Solution 4: Check Backend is Accessible

1. **Test backend directly**:
   ```bash
   curl http://localhost:8000/api/v1/categories/
   # Or use browser: http://localhost:8000/api/v1/categories/
   ```

2. **Check CORS settings** (if testing from web):
   - Backend should have CORS enabled for development
   - Check `CORS_ALLOW_ALL_ORIGINS=True` in backend `.env`

3. **Check firewall/antivirus**:
   - May be blocking localhost connections
   - Try disabling temporarily to test

### Solution 5: Physical Device Connection

If testing on a physical device (not emulator):

1. **Find your computer's IP address**:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Update frontend config**:
   ```env
   EXPO_PUBLIC_DEV_API_URL=http://YOUR_IP:8000/api/v1
   # Example: EXPO_PUBLIC_DEV_API_URL=http://192.168.1.100:8000/api/v1
   ```

3. **Update backend CORS**:
   ```env
   CORS_ALLOWED_ORIGINS=http://YOUR_IP:19006,http://YOUR_IP:8081
   ```

4. **Restart both frontend and backend**

## Quick Diagnostic Steps

1. ✅ **Is backend running?**
   - Check terminal for Django server
   - Visit `http://localhost:8000/swagger/` in browser

2. ✅ **Is USE_MOCK_DATA set correctly?**
   - Check console logs for API configuration
   - Should match your intention

3. ✅ **Is API URL correct?**
   - Check console logs: `📡 API Configuration`
   - Verify it matches your backend URL

4. ✅ **Are you on the same network?** (for physical devices)
   - Device and computer must be on same WiFi

5. ✅ **Check backend logs**
   - Look for incoming requests
   - Check for CORS errors

## Common Issues

### Issue: "Network Error" but backend is running

**Possible causes**:
- Backend running on different port
- Firewall blocking connection
- Wrong API URL in frontend

**Fix**:
- Verify backend port (default: 8000)
- Check API URL in frontend config
- Test backend directly in browser

### Issue: Works in browser but not in app

**Possible causes**:
- CORS issue (but React Native doesn't use CORS)
- Different network (device vs computer)
- Localhost vs IP address

**Fix**:
- Use IP address instead of localhost for physical devices
- Ensure device and computer on same network

### Issue: Works locally but not in production

**Possible causes**:
- Production URL incorrect
- Backend not deployed
- CORS not configured for production domain

**Fix**:
- Verify production URL
- Check backend deployment status
- Update CORS settings for production

## Still Having Issues?

1. **Enable verbose logging**:
   - Check React Native debugger
   - Check backend console logs
   - Look for specific error messages

2. **Test with curl/Postman**:
   - Verify backend endpoints work
   - Test authentication
   - Check response format

3. **Check network tab**:
   - Use React Native debugger
   - See actual request/response
   - Check status codes

4. **Verify environment variables**:
   - Ensure `.env` file exists
   - Variables are loaded correctly
   - Restart app after changes

