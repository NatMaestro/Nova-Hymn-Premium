# Android Emulator Connection Fix

## Problem

When running on Android emulator, `localhost` refers to the emulator itself, not your computer. This causes network errors when trying to connect to your backend.

## Solution

The app now automatically detects Android and uses `10.0.2.2` instead of `localhost`.

### What Changed

- **Android Emulator**: Uses `http://10.0.2.2:8000/api/v1` (10.0.2.2 is a special IP that points to host machine)
- **iOS Simulator**: Uses `http://localhost:8000/api/v1`
- **Web**: Uses `http://localhost:8000/api/v1`

## Backend Setup

Make sure your backend is running on `0.0.0.0:8000`:

```bash
cd Nova-Hymnal-Backend
python manage.py runserver 0.0.0.0:8000
```

## Testing

1. **Start backend** on `0.0.0.0:8000`
2. **Restart frontend app**
3. **Check console** - should see:
   ```
   📡 API Configuration: {
     baseUrl: "http://10.0.2.2:8000/api/v1",
     platform: "android",
     note: "Using 10.0.2.2 for Android emulator"
   }
   ```
4. **Test connection** - should work now!

## Physical Device Testing

If testing on a **physical Android device** (not emulator):

1. **Find your computer's IP address**:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Create `.env` file** in `Nova-Hymnal-Premium/`:
   ```env
   EXPO_PUBLIC_DEV_API_URL=http://192.168.1.100:8000/api/v1
   ```
   (Replace `192.168.1.100` with your actual IP)

3. **Restart app**

## Troubleshooting

### Still Getting Network Errors?

1. **Verify backend is running**:
   ```bash
   # Should see: Starting development server at http://0.0.0.0:8000/
   ```

2. **Test from emulator browser**:
   - Open browser in Android emulator
   - Go to: `http://10.0.2.2:8000/api/v1/`
   - Should see API response

3. **Check firewall**:
   - Windows Firewall might be blocking port 8000
   - Temporarily disable to test

4. **Verify backend is accessible**:
   ```bash
   # From your computer
   curl http://localhost:8000/api/v1/
   ```

### Alternative: Use Your Computer's IP

If `10.0.2.2` doesn't work, use your computer's IP:

1. Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Create `.env`:
   ```env
   EXPO_PUBLIC_DEV_API_URL=http://YOUR_IP:8000/api/v1
   ```
3. Restart app

## Summary

- ✅ Android emulator: Automatically uses `10.0.2.2`
- ✅ iOS simulator: Uses `localhost`
- ✅ Physical devices: Use computer IP in `.env`
- ✅ Backend must run on `0.0.0.0:8000`



