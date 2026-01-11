# Quick Fix for Network Connection Issues

## The Problem

Even with `10.0.2.2:8000`, the Android emulator can't connect to the backend.

## Solution: Use Your Computer's IP Address

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).
Example: `192.168.1.100`

### Step 2: Update Frontend Configuration

Create or edit `.env` file in `Nova-Hymnal-Premium/`:

```env
EXPO_PUBLIC_DEV_API_URL=http://YOUR_IP:8000/api/v1
```

**Example:**
```env
EXPO_PUBLIC_DEV_API_URL=http://192.168.1.100:8000/api/v1
```

### Step 3: Ensure Backend is Running on 0.0.0.0

**Stop the current backend** (Ctrl+C), then:

```bash
cd Nova-Hymnal-Backend
python manage.py runserver 0.0.0.0:8000
```

You should see:
```
Starting development server at http://0.0.0.0:8000/
```

### Step 4: Restart Frontend

The app will now use your computer's IP address instead of `10.0.2.2`.

## Alternative: Test if Backend is Accessible

### From Your Computer

```bash
# Test if backend responds
curl http://localhost:8000/api/v1/
```

### From Android Emulator Browser

1. Open browser in Android emulator
2. Go to: `http://10.0.2.2:8000/api/v1/`
3. If this works, the issue is with React Native networking
4. If this doesn't work, backend isn't accessible from emulator

## Why This Happens

- `10.0.2.2` is the standard Android emulator address, but sometimes it doesn't work
- Using your computer's actual IP address is more reliable
- Backend must be bound to `0.0.0.0` to accept connections from network

## Quick Checklist

- [ ] Backend running on `0.0.0.0:8000` (not `127.0.0.1:8000`)
- [ ] Found your computer's IP address
- [ ] Created `.env` with `EXPO_PUBLIC_DEV_API_URL=http://YOUR_IP:8000/api/v1`
- [ ] Restarted frontend app
- [ ] Checked firewall isn't blocking port 8000

## Still Not Working?

1. **Check Windows Firewall**:
   - Temporarily disable to test
   - Or add exception for port 8000

2. **Verify Backend is Actually Running**:
   - Check terminal for Django server output
   - Visit `http://localhost:8000/swagger/` in browser

3. **Try Different IP**:
   - Some networks have multiple IPs
   - Try the one under "Ethernet adapter" or "Wireless LAN adapter"

4. **Use ngrok (Last Resort)**:
   ```bash
   ngrok http 8000
   ```
   Then use the ngrok URL in `.env`

