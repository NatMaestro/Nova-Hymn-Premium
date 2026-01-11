# Setup IP Address for Android Emulator

## Your Computer's IP Addresses

I found these IP addresses on your computer:
- **192.168.8.186** ← Try this first (likely your WiFi IP)
- 172.17.16.1
- 172.31.80.1

## Quick Setup

### Step 1: Create `.env` file

Create a file named `.env` in `Nova-Hymnal-Premium/` folder with:

```env
EXPO_PUBLIC_DEV_API_URL=http://192.168.8.186:8000/api/v1
```

### Step 2: Verify Backend is on 0.0.0.0

Make sure your backend shows:
```
Starting development server at http://0.0.0.0:8000/
```

If it shows `127.0.0.1:8000`, restart it with:
```bash
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Restart Frontend

After creating `.env`, restart your Expo app. It should now connect!

## If 192.168.8.186 Doesn't Work

Try the other IPs in your `.env` file:
```env
EXPO_PUBLIC_DEV_API_URL=http://172.17.16.1:8000/api/v1
```

Or:
```env
EXPO_PUBLIC_DEV_API_URL=http://172.31.80.1:8000/api/v1
```

## Verify It's Working

After restarting, check console for:
```
📡 API Configuration: {
  baseUrl: "http://192.168.8.186:8000/api/v1",
  ...
}
```

Network errors should disappear!

