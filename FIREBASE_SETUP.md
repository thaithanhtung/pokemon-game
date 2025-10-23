# Firebase Configuration Guide

## Development Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: "pokecard-clash"
3. Enable Authentication and Firestore Database
4. Get your Firebase config from Project Settings

### 2. Update Firebase Config

Replace the demo config in `src/firebase/config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'pokecard-clash.firebaseapp.com',
  projectId: 'pokecard-clash',
  storageBucket: 'pokecard-clash.appspot.com',
  messagingSenderId: '123456789',
  appId: 'your-app-id',
};
```

### 3. Firestore Security Rules

Set up these security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User's cards collection
    match /cards/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User's decks collection
    match /decks/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Battle history - users can only access their own battles
    match /battles/{battleId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Leaderboard - read only for authenticated users
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Authentication Setup

Enable these authentication methods in Firebase Console:

- Anonymous authentication (for guest users)
- Email/Password authentication
- **Google authentication** (for Google sign-in)

#### Google Authentication Setup:

1. Go to Authentication > Sign-in method
2. Enable "Google" provider
3. Add your domain to authorized domains
4. Configure OAuth consent screen if needed

## Data Schema

### Collections Structure

```
/users/{userId}
  - name: string
  - level: number
  - exp: number
  - energy: number
  - gems: number
  - storyProgress: { chapter: number, stage: number }
  - pvpRank: string
  - wins: number
  - losses: number
  - createdAt: timestamp
  - updatedAt: timestamp

/cards/{userId}
  - userId: string
  - cards: array of card objects
  - updatedAt: timestamp

/decks/{userId}
  - userId: string
  - decks: array of deck objects
  - updatedAt: timestamp

/battles/{battleId}
  - userId: string
  - mode: string (story/pvp)
  - result: string (victory/defeat)
  - playerTeam: array
  - opponentTeam: array
  - turnCount: number
  - duration: number
  - timestamp: timestamp

/leaderboard/{userId}
  - userId: string
  - name: string
  - level: number
  - wins: number
  - losses: number
  - pvpRank: string
  - updatedAt: timestamp
```

## Features Implemented

### ✅ Completed

- Firebase SDK integration
- Authentication system (Anonymous + Email/Password + **Google**)
- Firestore data services
- Pinia store integration
- User data persistence
- Battle result saving
- Leaderboard system
- Offline support preparation

### 🔄 In Progress

- Real-time data synchronization
- Offline data caching
- Data migration from local storage

### 📋 Next Steps

- Add Firebase Analytics
- Implement push notifications
- Add social features (friends, sharing)
- Tournament system with Firebase Functions
- Real-time multiplayer battles

## Usage

### For Developers

1. **Initialize Firebase in your component:**

```javascript
import { useFirebase } from '@/composables/useFirebase';

const firebase = useFirebase();
```

2. **Save user data:**

```javascript
await firebase.saveUserData(playerData);
```

3. **Listen to auth state:**

```javascript
firebase.onAuthStateChanged(user => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

### For Users

- **Guest Mode**: Quick start without account creation
- **Google Sign-in**: One-click login with Google account
- **Account Mode**: Full data persistence across devices
- **Data Sync**: Automatic cloud backup of progress
- **Leaderboards**: Compete with other players globally
