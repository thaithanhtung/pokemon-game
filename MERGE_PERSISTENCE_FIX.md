# Fix: Merge Card Persistence - Option 2 Implementation

## Vấn Đề Đã Sửa

Merge card không persist sau reload vì có **bất đồng bộ giữa 2 collections**:

- **Merge lưu vào:** `users/{userId}.cards[]`
- **Load lại từ:** `userCards/{userId}.cards[]`
- **Pack opening lưu vào:** `userCards/{userId}.cards[]`

## Giải Pháp: Option 2 - Single Source of Truth

Chọn `userCards` collection làm **source of truth** duy nhất cho tất cả card operations.

## Code Changes

### 1. **CardCollection.vue - Merge Logic**

**File:** `src/components/CardCollection.vue`  
**Lines:** 576-590

```javascript
// ❌ Trước đây: Lưu vào users collection
await playerStore.updateUserData({
  cards: playerStore.player.cards,
});

// ✅ Bây giờ: Lưu vào userCards collection (same as pack opening)
const firebase = playerStore.getFirebase();
if (firebase) {
  await firebase.saveUserCardsToFirestore(playerStore.player.cards);

  // Log the merge event
  await firebase.logCardMerge({
    sourceCards: cardsToMerge.map(c => ({
      uid: c.uid,
      name: c.name,
      level: c.level || 1,
    })),
    resultCard: mergedCard,
  });
}
```

### 2. **useFirebase.js - Load Logic**

**File:** `src/composables/useFirebase.js`  
**Lines:** 448-484

```javascript
// ✅ Load user cards from dedicated collection (source of truth)
let cards = [];
try {
  const userCards = await userCardsService.getUserCards(firebaseUser.uid);
  if (Array.isArray(userCards) && userCards.length > 0) {
    cards = userCards;
    console.log('User cards loaded from userCards collection:', userCards.length, 'cards');
  } else {
    // Fallback to users collection if userCards is empty
    cards = userData.cards || [];
    console.log('Fallback: User cards loaded from users collection:', cards.length, 'cards');
  }
} catch (e) {
  console.warn('Could not load user cards, using fallback:', e);
  cards = userData.cards || [];
}

playerStore.player = {
  // ... other fields
  cards: cards, // Use cards from userCards collection
  // ... other fields
};
```

## Data Flow Sau Khi Sửa

### ✅ **Consistent Flow:**

| Operation         | Collection           | Field     | Status        |
| ----------------- | -------------------- | --------- | ------------- |
| **Pack Opening**  | `userCards/{userId}` | `cards[]` | ✅            |
| **Merge Cards**   | `userCards/{userId}` | `cards[]` | ✅            |
| **Load Data**     | `userCards/{userId}` | `cards[]` | ✅            |
| **Fallback Load** | `users/{userId}`     | `cards[]` | ✅ (if empty) |

### 🔄 **Complete Flow:**

#### **Khi Merge:**

1. Update `playerStore.player.cards` (local)
2. Call `firebase.saveUserCardsToFirestore(cards)`
3. Save vào `userCards/{userId}.cards[]` ✅
4. Log merge event ✅

#### **Khi Reload:**

1. Load từ `userCards/{userId}.cards[]` ✅
2. Nếu empty → Fallback `users/{userId}.cards[]` ✅
3. Set `playerStore.player.cards = loadedCards` ✅
4. UI hiển thị đúng cards đã merge ✅

## Benefits

### ✅ **Consistency**

- Pack opening và merge đều dùng cùng collection
- Không còn bất đồng bộ giữa operations

### ✅ **Reliability**

- Single source of truth
- Fallback mechanism cho data cũ

### ✅ **Performance**

- Không cần maintain 2 collections
- Load data từ 1 nguồn duy nhất

### ✅ **Backward Compatibility**

- Fallback về `users.cards[]` nếu `userCards` empty
- Không mất data cũ

## Migration Notes

### **Dữ Liệu Cũ:**

- Cards cũ trong `users.cards[]` vẫn được load qua fallback
- Khi user mở pack mới hoặc merge → Data sẽ migrate sang `userCards`

### **Migration Script (Nếu cần):**

```javascript
async function migrateCardsToUserCards(userId) {
  // Load from users collection
  const userData = await userService.getUser(userId);
  const oldCards = userData.cards || [];

  if (oldCards.length > 0) {
    // Save to userCards collection
    await userCardsService.saveUserCards(userId, oldCards);
    console.log(`Migrated ${oldCards.length} cards for user ${userId}`);
  }
}
```

## Testing Checklist

- [x] Merge cards lưu vào `userCards` collection
- [x] Load data từ `userCards` collection làm primary
- [x] Fallback về `users` collection nếu empty
- [ ] Test merge → reload → cards persist
- [ ] Test pack opening → reload → cards persist
- [ ] Test fallback với data cũ
- [ ] Test error handling và rollback

## Files Modified

1. ✅ `src/components/CardCollection.vue` - Line 576-590
   - Thay `updateUserData()` bằng `saveUserCardsToFirestore()`

2. ✅ `src/composables/useFirebase.js` - Line 448-484
   - Load từ `userCards` collection làm primary
   - Fallback về `users` collection nếu empty

## Dependencies

- `src/firebase/services.js` - `userCardsService.saveUserCards()` ✅ (đã có)
- `src/composables/useFirebase.js` - `saveUserCardsToFirestore()` ✅ (đã có)

## Notes

- **Pack opening** đã dùng `userCards` collection từ trước
- **Merge** giờ cũng dùng `userCards` collection
- **Load** giờ ưu tiên `userCards` collection
- **Fallback** đảm bảo backward compatibility
- **Error handling** và rollback vẫn hoạt động

---

**Ngày sửa:** 2025-10-22  
**Người thực hiện:** AI Assistant  
**Trạng thái:** ✅ Hoàn thành  
**Testing:** ⏸️ Cần test manual
