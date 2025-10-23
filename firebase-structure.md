# Firebase Database Structure for Pokemon Farm

## Firestore Collections Structure

```
firebase/
├── users/
│   └── {userId}/
│       ├── profile/
│       │   ├── username: string
│       │   ├── email: string
│       │   ├── createdAt: timestamp
│       │   ├── lastLogin: timestamp
│       │   └── settings: {
│       │       ├── notifications: boolean
│       │       ├── soundEnabled: boolean
│       │       └── theme: string
│       │   }
│       │
│       ├── game/
│       │   ├── stats/
│       │   │   ├── level: number
│       │   │   ├── experience: number
│       │   │   ├── totalPlayTime: number
│       │   │   ├── daysPlayed: number
│       │   │   └── achievements: array
│       │   │
│       │   └── resources/
│       │       ├── currency: number
│       │       ├── seeds: {
│       │       │   ├── wheat: number
│       │       │   ├── corn: number
│       │       │   ├── berries: number
│       │       │   └── rareCandy: number
│       │       │}
│       │       └── items: {
│       │           ├── pokemonFood: number
│       │           ├── fertilizer: number
│       │           ├── water: number
│       │           └── medicine: number
│       │       }
│       │
│       ├── farm/
│       │   ├── layout/
│       │   │   ├── gridSize: number
│       │   │   ├── tiles: [{
│       │   │   │   ├── x: number
│       │   │   │   ├── z: number
│       │   │   │   ├── type: string (grass|tilled|planted|water)
│       │   │   │   ├── moisture: number (0-100)
│       │   │   │   └── fertility: number (0-100)
│       │   │   │}]
│       │   │   └── updatedAt: timestamp
│       │   │
│       │   ├── buildings/
│       │   │   └── {buildingId}/
│       │   │       ├── type: string (house|barn|coop|pond|field)
│       │   │       ├── level: number
│       │   │       ├── x: number
│       │   │       ├── z: number
│       │   │       ├── capacity: number
│       │   │       ├── occupants: array[pokemonId]
│       │   │       ├── constructedAt: timestamp
│       │   │       └── lastUpgrade: timestamp
│       │   │
│       │   └── crops/
│       │       └── {cropId}/
│       │           ├── type: string (wheat|corn|berries)
│       │           ├── x: number
│       │           ├── z: number
│       │           ├── plantedAt: timestamp
│       │           ├── growth: number (0-100)
│       │           ├── health: number (0-100)
│       │           ├── watered: boolean
│       │           ├── lastWatered: timestamp
│       │           ├── fertilized: boolean
│       │           └── harvestReady: boolean
│       │
│       ├── pokemon/
│       │   └── {pokemonId}/
│       │       ├── species: number (Pokedex ID)
│       │       ├── nickname: string
│       │       ├── level: number
│       │       ├── experience: number
│       │       ├── stats: {
│       │       │   ├── hp: number
│       │       │   ├── attack: number
│       │       │   ├── defense: number
│       │       │   ├── speed: number
│       │       │   └── special: number
│       │       │}
│       │       ├── nature: string
│       │       ├── happiness: number (0-255)
│       │       ├── hunger: number (0-100)
│       │       ├── health: number (0-100)
│       │       ├── location: string (farm|pc|daycare|battle)
│       │       ├── position: {
│       │       │   ├── x: number
│       │       │   └── z: number
│       │       │}
│       │       ├── caughtAt: timestamp
│       │       ├── hatchedAt: timestamp (if bred)
│       │       ├── parentIds: array[pokemonId]
│       │       ├── abilities: array[string]
│       │       ├── moves: array[{
│       │       │   ├── name: string
│       │       │   ├── type: string
│       │       │   ├── power: number
│       │       │   └── pp: number
│       │       │}]
│       │       └── lastInteraction: timestamp
│       │
│       ├── breeding/
│       │   └── {breedingId}/
│       │       ├── parent1Id: string (pokemonId)
│       │       ├── parent2Id: string (pokemonId)
│       │       ├── startedAt: timestamp
│       │       ├── eggReady: boolean
│       │       ├── egg: {
│       │       │   ├── species: number
│       │       │   ├── steps: number
│       │       │   ├── hatchTime: timestamp
│       │       │   └── inherited: {
│       │       │       ├── moves: array
│       │       │       └── nature: string
│       │       │   }
│       │       │}
│       │       └── completed: boolean
│       │
│       ├── inventory/
│       │   ├── items/
│       │   │   └── {itemId}/
│       │   │       ├── type: string
│       │   │       ├── name: string
│       │   │       ├── quantity: number
│       │   │       └── lastUsed: timestamp
│       │   │
│       │   └── storage/
│       │       └── {storageId}/
│       │           ├── type: string (crops|items|seeds)
│       │           ├── items: array[{
│       │           │   ├── id: string
│       │           │   ├── quantity: number
│       │           │}]
│       │           └── capacity: number
│       │
│       ├── quests/
│       │   ├── daily/
│       │   │   └── {questId}/
│       │   │       ├── title: string
│       │   │       ├── description: string
│       │   │       ├── type: string
│       │   │       ├── target: number
│       │   │       ├── progress: number
│       │   │       ├── reward: {
│       │   │       │   ├── type: string
│       │   │       │   └── amount: number
│       │   │       │}
│       │   │       ├── startedAt: timestamp
│       │   │       └── completed: boolean
│       │   │
│       │   └── achievements/
│       │       └── {achievementId}/
│       │           ├── unlockedAt: timestamp
│       │           └── progress: number
│       │
│       ├── market/
│       │   ├── listings/
│       │   │   └── {listingId}/
│       │   │       ├── sellerId: string
│       │   │       ├── itemType: string
│       │   │       ├── itemId: string
│       │   │       ├── quantity: number
│       │   │       ├── price: number
│       │   │       ├── listedAt: timestamp
│       │   │       └── expiresAt: timestamp
│       │   │
│       │   └── transactions/
│       │       └── {transactionId}/
│       │           ├── buyerId: string
│       │           ├── sellerId: string
│       │           ├── itemType: string
│       │           ├── quantity: number
│       │           ├── price: number
│       │           └── timestamp: timestamp
│       │
│       └── exploration/
│           ├── unlockedAreas: array[string]
│           ├── currentArea: string
│           └── discoveries: array[{
│               ├── type: string
│               ├── id: string
│               ├── location: string
│               └── timestamp: timestamp
│           }]
```

## Real-time Database Structure (for real-time features)

```
realtime-db/
├── presence/
│   └── {userId}/
│       ├── online: boolean
│       ├── lastSeen: timestamp
│       └── currentActivity: string
│
├── weather/
│   ├── current: string
│   ├── forecast: array[string]
│   └── lastUpdate: timestamp
│
├── market-prices/
│   └── {itemType}/
│       ├── currentPrice: number
│       ├── trend: string (up|down|stable)
│       └── history: array[{
│           ├── price: number
│           └── timestamp: timestamp
│       }]
│
└── events/
    └── {eventId}/
        ├── name: string
        ├── type: string
        ├── startTime: timestamp
        ├── endTime: timestamp
        └── rewards: object
```

## Storage Structure (for images/assets)

```
storage/
├── users/
│   └── {userId}/
│       ├── avatar/
│       │   └── profile.jpg
│       └── screenshots/
│           └── {timestamp}.jpg
│
├── pokemon/
│   └── custom-sprites/
│       └── {pokemonId}/
│           └── {variation}.png
│
└── farm/
    └── layouts/
        └── {userId}/
            └── {timestamp}.json
```

## Security Rules Example

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Market listings are public read, authenticated write
    match /market/listings/{listing} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.sellerId;
    }
  }
}
```

## Data Syncing Strategy

1. **Critical Data** (always sync):
   - Pokemon stats/location
   - Resources/currency
   - Active quests
   - Breeding status

2. **Periodic Sync** (every 5 minutes):
   - Farm layout
   - Building status
   - Crop growth
   - Inventory

3. **On-Demand Sync**:
   - Market transactions
   - Achievements
   - Screenshots

4. **Local Cache**:
   - Store recent data locally
   - Sync on app launch
   - Queue offline actions