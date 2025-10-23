# Fix: Merge Card System - Thêm pokemonId Field

## Vấn Đề

Hệ thống merge card không hoạt động vì logic merge kiểm tra `card.pokemonId` nhưng cards được tạo ra không có field này.

### Chi Tiết Lỗi:

**CardCollection.vue (Line 507)**

```javascript
if (card.pokemonId !== firstCard.pokemonId || cardLevel !== firstCardLevel) {
  return; // Reject merge
}
```

**player.js (Line 523-538) - Trước khi sửa:**

```javascript
return {
  id: `pokemon_${pokemon.id}`, // "pokemon_25"
  // ❌ Thiếu pokemonId field
  name: pokemon.name,
  type: 'pokemon',
  // ...
};
```

## Giải Pháp

Thêm field `pokemonId` vào card template khi generate card database.

### Code Changes:

**File:** `src/stores/player.js`  
**Line:** 525

```javascript
return {
  id: `pokemon_${pokemon.id}`,
  pokemonId: pokemon.id, // ← ✅ THÊM DÒNG NÀY
  name: pokemon.name,
  type: 'pokemon',
  pokemonType: pokemon.types[0],
  rarity,
  level: 1,
  hp: stats.hp,
  maxHp: stats.hp,
  atk: stats.atk,
  def: stats.def,
  spd: stats.spd,
  energy: Math.ceil(stats.hp / 50),
  image: pokemon.sprite,
  skills: this.generatePokemonSkills(pokemon),
};
```

## Cách Hoạt Động

### Trước:

```javascript
const pikachu = {
  id: 'pokemon_25',
  name: 'Pikachu',
  // pokemonId: undefined ❌
};

// Merge check
if (card.pokemonId !== firstCard.pokemonId) {
  // undefined !== undefined → false, nhưng logic không đúng
}
```

### Sau:

```javascript
const pikachu = {
  id: 'pokemon_25',
  pokemonId: 25, // ✅
  name: 'Pikachu',
};

// Merge check
if (card.pokemonId !== firstCard.pokemonId) {
  // 25 !== 25 → false, cho phép merge
  // 25 !== 4 → true, từ chối merge
}
```

## Merge Card Flow

1. **User bật Merge Mode** trong Collection
2. **Select 3 cards:**
   - Phải cùng `pokemonId` (cùng loại Pokemon)
   - Phải cùng `level` (cùng cấp độ)
3. **Click "Merge Cards"**
4. **Kết quả:**
   - Xóa 3 cards cũ
   - Tạo 1 card mới level cao hơn
   - Stats tăng 50% mỗi level

### Ví Dụ:

```
Input: 3x Pikachu Level 1
→ Output: 1x Pikachu Level 2 (stats tăng 50%)

Input: 3x Pikachu Level 2
→ Output: 1x Pikachu Level 3 (stats tăng 125%)

Max Level: 9
```

## Testing

### Test Cases:

- [x] Tạo card database với pokemonId
- [ ] Mở pack, kiểm tra cards có pokemonId
- [ ] Collection hiển thị cards đúng
- [ ] Chọn 3 cards cùng Pokemon cùng level → Merge thành công
- [ ] Chọn cards khác Pokemon → Không merge được
- [ ] Chọn cards khác level → Không merge được
- [ ] Stats của card merged đúng công thức
- [ ] Firebase lưu merge log đúng

### Kiểm Tra Manual:

1. Vào `/card-clash/collection`
2. Click "Merge Cards"
3. Chọn 3 cards giống nhau (cùng Pokemon, cùng level)
4. Click "Merge Cards" button
5. Xác nhận:
   - ✅ Card mới có level cao hơn
   - ✅ Stats tăng đúng
   - ✅ 3 cards cũ đã bị xóa

## Tương Thích

### Dữ Liệu Cũ:

Cards cũ trong database **KHÔNG có** `pokemonId`:

- ⚠️ Merge sẽ không hoạt động với cards cũ
- 💡 Giải pháp: Clear data và mở pack mới

### Migration (Nếu cần):

```javascript
// Script để thêm pokemonId cho cards cũ
async function migratePokemonId(userId) {
  const cards = await getUserCards(userId);
  const updatedCards = cards.map(card => {
    if (card.type === 'pokemon' && !card.pokemonId) {
      // Extract pokemonId from id: "pokemon_25" → 25
      const pokemonId = parseInt(card.id.split('_')[1]);
      return { ...card, pokemonId };
    }
    return card;
  });
  await saveUserCards(userId, updatedCards);
}
```

## Files Modified

1. ✅ `src/stores/player.js` - Line 525
   - Thêm `pokemonId: pokemon.id` vào card template

## Dependencies

- `src/components/CardCollection.vue` - Sử dụng `pokemonId` để check merge
- `src/composables/useFirebase.js` - Lưu `pokemonId` trong merge log
- `src/firebase/services.js` - Spread operator tự động copy `pokemonId`

## Notes

- Skill cards và Item cards **KHÔNG CẦN** `pokemonId` (chỉ có Pokemon cards)
- `pokemonId` là số (integer), không phải string
- `id` vẫn giữ format `pokemon_${pokemonId}` để backward compatibility

---

**Ngày sửa:** 2025-10-22  
**Người thực hiện:** AI Assistant  
**Trạng thái:** ✅ Hoàn thành  
**Testing:** ⏸️ Cần test manual
