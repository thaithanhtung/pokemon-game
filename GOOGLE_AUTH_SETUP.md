# Firebase Google Authentication Setup

## 🔧 Cấu hình Firebase Console

### 1. Enable Google Authentication

1. **Vào Firebase Console**: https://console.firebase.google.com/
2. **Chọn project**: `planing-trip`
3. **Authentication** → **Sign-in method**
4. **Enable Google provider**:
   - Click vào "Google"
   - Toggle "Enable"
   - **Project support email**: Chọn email của bạn
   - **Web SDK configuration**:
     - Web client ID: `972031900889-xxxxx.apps.googleusercontent.com`
     - Web client secret: `xxxxx`

### 2. Authorized Domains

Thêm các domain được phép:

- `localhost` (cho development)
- `127.0.0.1` (cho development)
- Domain production của bạn (nếu có)

### 3. OAuth Consent Screen (nếu cần)

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **APIs & Services** → **OAuth consent screen**
3. **App name**: PokéCard Clash
4. **User support email**: Email của bạn
5. **Developer contact**: Email của bạn

## 🚀 Test Google Authentication

### Development Mode

```bash
# Chạy dev server
yarn dev

# Vào http://localhost:5174/pokecard-clash
# Click "Continue with Google"
```

### Production Mode

1. **Disable emulators** trong `src/firebase/config.js`:

```javascript
// Comment out emulator connections
// if (import.meta.env.DEV) {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     connectAuthEmulator(auth, 'http://localhost:9099');
//     connectStorageEmulator(storage, 'localhost', 9199);
//   } catch (error) {
//     console.log('Emulators already connected or not available');
//   }
// }
```

2. **Deploy** lên hosting (Vercel, Netlify, etc.)

## 🔍 Debug Google Auth

### Console Logs

```javascript
// Thêm vào component để debug
console.log('Firebase Auth:', auth);
console.log('Current User:', auth.currentUser);
```

### Common Issues

1. **"auth/operation-not-allowed"**
   - Google provider chưa được enable
   - Kiểm tra Firebase Console

2. **"auth/popup-closed-by-user"**
   - User đóng popup
   - Bình thường, không phải lỗi

3. **"auth/unauthorized-domain"**
   - Domain chưa được authorize
   - Thêm domain vào Firebase Console

4. **"auth/invalid-credential"**
   - OAuth consent screen chưa setup
   - Kiểm tra Google Cloud Console

## 📱 Google Sign-in Flow

```
User clicks "Continue with Google"
    ↓
Firebase opens Google popup
    ↓
User selects Google account
    ↓
Google returns auth token
    ↓
Firebase creates user session
    ↓
App redirects to game
    ↓
User data syncs to Firestore
```

## 🛠️ Code Implementation

### Auth Service (đã có)

```javascript
// src/firebase/auth.js
async signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  const result = await signInWithPopup(auth, provider);
  return { user: result.user, error: null };
}
```

### UI Component (đã có)

```vue
<!-- src/components/FirebaseAuth.vue -->
<button @click="signInWithGoogle">
  <svg><!-- Google Logo --></svg>
  Continue with Google
</button>
```

## ✅ Checklist

- [ ] Google provider enabled trong Firebase Console
- [ ] Authorized domains đã thêm
- [ ] OAuth consent screen setup (nếu cần)
- [ ] Test trên localhost
- [ ] Test trên production domain
- [ ] Error handling hoạt động
- [ ] User data sync với Firestore

## 🎯 Next Steps

1. **Enable Google provider** trong Firebase Console
2. **Test** trên localhost
3. **Deploy** và test trên production
4. **Monitor** authentication logs trong Firebase Console
