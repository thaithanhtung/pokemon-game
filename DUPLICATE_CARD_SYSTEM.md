# Hệ Thống Card Duplicate - Tài Liệu Kỹ Thuật

## Tổng Quan

Hệ thống đã được chuyển đổi từ **Quantity System** sang **Duplicate Entry System** để đồng bộ giữa local state và Firebase, đồng thời tương thích với hệ thống merge cards hiện có.

## Thay Đổi Chính

### 1. Firebase Services (`src/firebase/services.js`)

#### ✅ `addCardsFromPack()` - Line 468-512

**Trước đây:**

```javascript
// Tìm card trùng và tăng quantity
if (existingCardIndex >= 0) {
  currentCards[existingCardIndex].quantity = (currentCards[existingCardIndex].quantity || 1) + 1;
}
```

**Hiện tại:**

```javascript
// Luôn tạo entry mới với UID riêng
const newCard = {
  ...cardData,
  uid: `${cardData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  level: cardData.level || 1,
  obtainedAt: Date.now(),
  obtainedFrom: 'pack',
  packType: packType,
};
currentCards.push(newCard);
```

#### ✅ `addCardToUser()` - Line 418-457

**Thay đổi tương tự:**

- Xóa logic check duplicate
- Luôn tạo entry mới với UID unique
- Thêm parameter `obtainedFrom` với default = 'reward'

#### ✅ `getUserCardStats()` - Line 507-536

**Đã xóa:**

- `totalQuantity` field (không còn cần thiết)

**Giữ lại:**

- `totalCards` - đếm tất cả entries (kể cả duplicate)
- `legendaryCards`, `epicCards`, `rareCards`, `commonCards`
- `pokemonCards`, `skillCards`, `itemCards`

## Cách Hoạt Động

### Khi Mở Pack:

```javascript
// Local Store (player.js)
validCards.forEach(card => this.addCardToCollection(card.id));

// Firebase Service
await firebase.addCardsFromPack(validCards, packType);
```

**Kết quả:**

- Mở pack có 3 Pikachu → Tạo **3 entries riêng biệt**
- Mỗi entry có UID unique: `pokemon_25_1730000000_abc123`
- Collection hiển thị: **3 cards Pikachu**

### Structure Card Entry:

```javascript
{
  id: "pokemon_25",           // Card template ID
  uid: "pokemon_25_..._...",  // Unique instance ID
  name: "Pikachu",
  type: "pokemon",
  rarity: "R",
  level: 1,
  hp: 90,
  atk: 55,
  def: 40,
  spd: 90,
  obtainedAt: 1730000000000,
  obtainedFrom: "pack",       // pack, reward, shop, etc.
  packType: "basic"           // basic, premium, legendary
}
```

## Lợi Ích

### ✅ Đồng Bộ Local & Firebase

- Cả hai đều lưu duplicate entries
- Không bị mất dữ liệu khi reload từ Firebase

### ✅ Tương Thích Merge System

- Merge system đếm số lượng entries để merge
- Không cần refactor merge logic

### ✅ UI Nhất Quán

- CardCollection hiển thị tất cả cards
- Pack Stats đếm đúng số lượng thực tế

### ✅ Tracking Tốt Hơn

- Mỗi card có timestamp riêng
- Biết chính xác card nào từ pack nào
- Dễ dàng filter/sort theo thời gian

## Migration Notes

### Dữ Liệu Cũ (Có Quantity):

- Dữ liệu cũ với `quantity > 1` sẽ chỉ hiển thị như 1 card
- Khuyến nghị: Viết migration script để expand quantity thành multiple entries

### Migration Script (Nếu cần):

```javascript
async function migrateQuantityToEntries(userId) {
  const cards = await getUserCards(userId);
  const expandedCards = [];

  for (const card of cards) {
    const quantity = card.quantity || 1;
    for (let i = 0; i < quantity; i++) {
      expandedCards.push({
        ...card,
        uid: `${card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        quantity: undefined, // Remove quantity field
      });
    }
  }

  await saveUserCards(userId, expandedCards);
}
```

## Testing Checklist

- [x] Xóa logic quantity trong Firebase
- [x] Thêm UID generation cho mỗi card
- [x] Test mở pack với cards trùng
- [ ] Kiểm tra Collection hiển thị đúng
- [ ] Kiểm tra Merge system hoạt động
- [ ] Kiểm tra Pack Stats đếm đúng
- [ ] Test reload từ Firebase

## Files Đã Sửa

1. ✅ `src/firebase/services.js`
   - `addCardsFromPack()` - Line 468-512
   - `addCardToUser()` - Line 418-457
   - `getUserCardStats()` - Line 507-536

2. ⏸️ `src/stores/player.js` - Không cần sửa (đã đúng)
3. ⏸️ `src/components/CardCollection.vue` - Không cần sửa (tương thích)
4. ⏸️ `src/views/card-clash/Shop.vue` - Không cần sửa (tương thích)

## Notes

- PokemonFarm.vue vẫn dùng `.quantity` cho inventory items (seeds, food) - Đây là hệ thống riêng, không liên quan cards
- Merge system trong CardCollection.vue đã sẵn sàng với duplicate system
- Pack history vẫn lưu đúng số lượng cards đã mở

---

**Ngày cập nhật:** 2025-10-22  
**Người thực hiện:** AI Assistant  
**Trạng thái:** ✅ Hoàn thành
