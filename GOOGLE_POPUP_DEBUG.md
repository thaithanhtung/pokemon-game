# Google Login Popup Issues - Debug Guide

## 🔍 Vấn đề: Google Login mở tab mới thay vì popup

### Nguyên nhân có thể:

1. **Browser Popup Blocker**
   - Chrome/Firefox/Safari chặn popup
   - Settings → Privacy → Pop-ups blocked

2. **Firebase Configuration**
   - Google provider chưa enable đúng cách
   - Authorized domains thiếu

3. **Browser Settings**
   - Third-party cookies disabled
   - Strict privacy mode

## 🛠️ Debug Steps

### 1. Kiểm tra Popup Blocker

```javascript
// Test popup blocker
const testPopup = window.open('', '_blank', 'width=1,height=1');
if (!testPopup || testPopup.closed) {
  console.log('Popup blocked!');
} else {
  testPopup.close();
  console.log('Popup allowed');
}
```

### 2. Kiểm tra Console Logs

- Mở DevTools → Console
- Click "Test Google Auth"
- Xem logs:
  - `Starting Google sign-in with popup...`
  - `Google sign-in successful:` hoặc error

### 3. Kiểm tra Firebase Console

- Authentication → Sign-in method
- Google provider: **Enabled**
- Authorized domains: `localhost`, `127.0.0.1`

## 🔧 Solutions

### Solution 1: Disable Popup Blocker

**Chrome:**

1. Settings → Privacy and security → Site Settings
2. Pop-ups and redirects → Allow
3. Add `localhost:5174` to exceptions

**Firefox:**

1. Settings → Privacy & Security
2. Permissions → Block pop-up windows
3. Add exception for `localhost:5174`

### Solution 2: Use Redirect Instead

```javascript
// Fallback to redirect if popup fails
if (error.code === 'auth/popup-blocked') {
  await signInWithRedirect(auth, provider);
}
```

### Solution 3: Browser Settings

1. **Enable third-party cookies**
2. **Disable strict privacy mode**
3. **Allow popups for localhost**

## 🧪 Test với Debug Panel

### Debug Panel Features:

- **Test Google Auth**: Test popup functionality
- **Check Redirect Result**: Check if redirect worked
- **Browser Info**: Detect browser type
- **Popup Blocked**: Show if popup is blocked

### Expected Behavior:

```
✅ Popup opens in same window
✅ User selects Google account
✅ Popup closes automatically
✅ User logged in successfully
```

### If Popup Blocked:

```
❌ Popup blocked by browser
❌ Falls back to redirect
❌ Opens new tab
❌ User redirected back after login
```

## 🎯 Quick Fixes

### Fix 1: Allow Popups

```bash
# Chrome command line
chrome.exe --disable-popup-blocking --disable-web-security --user-data-dir=/tmp/chrome_dev
```

### Fix 2: Use Incognito Mode

- Incognito mode often allows popups
- Test in incognito window

### Fix 3: Different Browser

- Try Firefox or Edge
- Some browsers are more permissive

## 📱 Mobile Considerations

### Mobile Browsers:

- Popups often open in new tab
- This is normal behavior
- Use redirect method for mobile

### PWA Mode:

- Popups may not work
- Always use redirect

## 🔍 Debug Commands

### Console Commands:

```javascript
// Check Firebase auth state
console.log('Auth:', firebase.auth);

// Check current user
console.log('User:', firebase.auth.currentUser);

// Test popup
window.open('https://google.com', '_blank', 'width=400,height=300');

// Check browser info
console.log('User Agent:', navigator.userAgent);
```

### Network Tab:

- Check if Google OAuth requests are made
- Look for CORS errors
- Verify redirect URLs

## ✅ Verification

### Success Indicators:

- [ ] Popup opens in same window
- [ ] No "popup blocked" errors
- [ ] User data loads after login
- [ ] Debug panel shows "Authenticated"

### Failure Indicators:

- [ ] New tab opens instead of popup
- [ ] "popup-blocked" error in console
- [ ] User stuck on login screen
- [ ] Debug panel shows "Error"
