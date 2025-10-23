# 🎴 PokéCard Clash - Card Battle Game

## Giới thiệu

PokéCard Clash là một game thẻ bài Pokemon được xây dựng với Vue.js 3, Pinia và Tailwind CSS. Người chơi có thể thu thập thẻ bài Pokemon, xây dựng deck và chiến đấu với AI hoặc người chơi khác.

## Tính năng chính

### 🎮 Game Modes

1. **Story Mode**
   - Chiến đấu với AI opponents
   - Tiến độ qua các chapters
   - Nhận rewards sau mỗi trận thắng

2. **PvP Battle**
   - Thách đấu người chơi khác (Coming soon)
   - Hệ thống ranking
   - Competitive gameplay

3. **Deck Builder**
   - Tạo và quản lý nhiều deck
   - Tối đa 30 thẻ/deck
   - Kéo thả để thêm/xóa thẻ
   - Set active deck

4. **Card Collection**
   - Xem toàn bộ thẻ bài sở hữu
   - Lọc theo type, rarity
   - Tìm kiếm thẻ
   - Xem chi tiết stats

5. **Shop**
   - Mua pack thẻ bài
   - 3 loại pack: Basic, Premium, Legendary
   - Hiệu ứng mở pack đẹp mắt

6. **Tournament** (Coming soon)
   - Giải đấu theo mùa
   - Phần thưởng độc quyền

## Card System

### Card Types

1. **Pokemon Cards**
   - HP (Health Points)
   - ATK (Attack)
   - DEF (Defense)
   - SPD (Speed)
   - Type (Fire, Water, Grass, etc.)
   - Skills (2 skills/pokemon)

2. **Skill Cards**
   - Heal (Hồi máu)
   - Attack Boost (Tăng ATK)
   - Protect (Chặn damage)
   - Cleanse (Xóa status effects)

3. **Item Cards**
   - Potion (Hồi 20 HP)
   - Energy Crystal (+2 Energy)
   - Revive (Hồi sinh Pokemon)

### Card Rarities

- **Common (C)** - Xám - 60% drop rate
- **Rare (R)** - Xanh - 30% drop rate
- **Epic (E)** - Tím - 8% drop rate
- **Legendary (L)** - Cam - 2% drop rate

## Battle System

### Battle Mechanics

1. **Energy System**
   - Bắt đầu với 3 energy
   - +2 energy mỗi turn
   - Max 5 energy
   - Skills tốn energy để sử dụng

2. **Type Effectiveness**
   - Super effective: x1.5 damage
   - Not very effective: x0.5 damage
   - Dựa theo Pokemon type chart

3. **Turn System**
   - Player turn → AI turn
   - Chọn skill hoặc dùng item
   - Switch Pokemon
   - Tự động tính damage

4. **Victory Conditions**
   - Đánh bại tất cả Pokemon của đối thủ
   - Nhận rewards: Energy, EXP, level up

## Resources & Progression

### Currencies

- **⚡ Energy**
  - Dùng mua Basic Pack (100 energy)
  - Nhận sau khi win battle (+50)
  - Regenerate theo thời gian

- **💎 Gems**
  - Dùng mua Premium/Legendary Pack
  - Nhận khi level up (+10)
  - Premium currency

### Level System

- Tăng EXP sau mỗi trận thắng
- Level up: EXP cần = Level × 200
- Rewards khi level up: Gems

## Components Structure

```
src/
├── views/
│   └── PokeCardClash.vue          # Main game view
├── components/
│   ├── BattleArena.vue            # Battle interface
│   ├── BattleCard.vue             # Card display component
│   ├── DeckBuilder.vue            # Deck management
│   ├── CardCollection.vue         # Collection viewer
│   └── ToastNotification.vue      # Toast messages
├── stores/
│   └── cardBattle.js              # Pinia store
└── composables/
    └── useToast.js                # Toast composable
```

## Cách sử dụng

### Bắt đầu chơi

1. **Nhận starter pack**
   - Auto nhận khi lần đầu vào game
   - 3 Pokemon starters + items

2. **Xây dựng deck**
   - Vào Deck Builder
   - Tạo deck mới
   - Thêm 12-30 thẻ
   - Set làm Active Deck

3. **Bắt đầu battle**
   - Chọn Story Mode
   - Chọn skills để attack
   - Sử dụng items/skill cards
   - Switch Pokemon khi cần

4. **Mua thêm thẻ**
   - Vào Shop
   - Chọn pack type
   - Mở pack xem thẻ mới

### Tips & Tricks

1. **Deck Building**
   - Cân bằng Pokemon/Skills/Items
   - Chọn Pokemon đa dạng type
   - Ít nhất 6 Pokemon cards
   - 2-3 heal cards

2. **Battle Strategy**
   - Check type effectiveness
   - Giữ energy cho big skills
   - Switch Pokemon khi low HP
   - Dùng items đúng lúc

3. **Resource Management**
   - Mua Basic Pack với Energy
   - Tiết kiệm Gems cho Legendary Pack
   - Win battles để farm resources

## API & Data

### Pokemon Data

- Lấy từ PokéAPI
- 150 Pokemon đầu tiên (Gen 1)
- Stats được tính toán dựa trên rarity

### Type Effectiveness

```javascript
const TYPE_EFFECTIVENESS = {
  fire: {
    weak: ['water', 'rock', 'ground'],
    strong: ['grass', 'bug', 'ice', 'steel'],
  },
  // ... other types
};
```

## Animations & Effects

- ✨ Fade-in animations cho cards
- 🎯 Hover effects
- 💫 Pack opening animation
- 🎨 Type-based colors
- 📊 HP bars với transitions
- 🔔 Toast notifications

## Future Features

- [ ] PvP multiplayer với WebSocket
- [ ] Tournament system
- [ ] Card trading
- [ ] Achievements system
- [ ] Daily rewards
- [ ] Card evolution
- [ ] Animated battles
- [ ] Sound effects & music
- [ ] Leaderboards
- [ ] Friend system

## Tech Stack

- **Vue 3** - Composition API, Script Setup
- **Pinia** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **PokéAPI** - Pokemon data

## Development

```bash
# Install dependencies
yarn install

# Run dev server
yarn dev

# Build for production
yarn build
```

## Credits

- Pokemon data from [PokéAPI](https://pokeapi.co/)
- Built with Vue.js & Tailwind CSS
- Game design inspired by Pokemon TCG

---

**Chúc bạn chơi game vui vẻ! 🎮✨**
