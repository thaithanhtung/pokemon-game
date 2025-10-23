# Vue Project - Pokemon Apps Collection

A collection of Pokemon-themed applications built with Vue 3, Vite, Pinia, and Tailwind CSS.

## 🎮 Featured Apps

### 🎴 PokéCard Clash - Card Battle Game

A strategic Pokemon card game with deck building and turn-based combat.

**📚 Documentation:**

- **[Quick Start Guide](QUICK_START.md)** - Bắt đầu chơi trong 5 phút
- **[Player Guide](PLAYER_GUIDE.md)** - Hướng dẫn chi tiết đầy đủ
- **[Game Documentation](GAME_DOCS_INDEX.md)** - Tổng hợp tài liệu
- **[README](POKECARD_CLASH_README.md)** - Game features & tech

**🎯 Quick Links:**

- Game URL: `/pokecard-clash`
- [Battle System Guide](PLAYER_GUIDE.md#chiến-đấu)
- [Deck Building Tips](PLAYER_GUIDE.md#xây-dựng-deck)

### 📖 Pokédex

Browse and search Pokemon with detailed information.

- URL: `/pokedex`
- Features: Search, filters, generations

### 🎲 Pokemon Card Game (Original)

Another card game variant.

- URL: `/pokemon-card-game`

## 🚀 Quick Start

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
# Install dependencies
yarn

# Run development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Format code
yarn format
```

## 🎯 Game Routes

- `/` - Home
- `/pokedex` - Pokédex viewer
- `/pokecard-clash` - Card battle game ⭐ NEW!
- `/pokemon-card-game` - Original card game

## 📚 Documentation

### For Players

- [🚀 Quick Start](QUICK_START.md) - Get started in 5 minutes
- [📖 Player Guide](PLAYER_GUIDE.md) - Complete gameplay guide
- [📄 Game README](POKECARD_CLASH_README.md) - Features & info

### For Developers

- [✅ Dev Summary](POKECARD_SUMMARY.md) - Implementation details
- [📚 Docs Index](GAME_DOCS_INDEX.md) - All documentation

## 🛠️ Tech Stack

- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **State Management:** Pinia
- **Styling:** Tailwind CSS
- **Routing:** Vue Router
- **Code Quality:** Prettier, ESLint
- **API:** PokéAPI

## 📦 Project Structure

```
src/
├── views/
│   ├── Pokedex.vue
│   ├── PokemonDetail.vue
│   ├── PokeCardClash.vue        # Card game
│   └── PokemonCardGame.vue
├── components/
│   ├── BattleArena.vue          # Battle UI
│   ├── BattleCard.vue           # Card display
│   ├── DeckBuilder.vue          # Deck management
│   ├── CardCollection.vue       # Collection viewer
│   └── ToastNotification.vue    # Notifications
├── stores/
│   ├── pokemon.js               # Pokemon data
│   └── cardBattle.js            # Card game state
├── composables/
│   └── useToast.js              # Toast helper
└── router/
    └── index.js                 # Routes
```

## ✨ Features

### PokéCard Clash

- ⚔️ Turn-based card battles
- 🃏 Deck building system
- 📦 Pack opening with animations
- 🎨 Beautiful card designs
- 📊 Type effectiveness system
- 💎 Progression & rewards

### Pokédex

- 🔍 Search & filters
- 📱 Responsive design
- 🎨 Type-based colors
- ⚡ Lazy loading

## 🎮 How to Play PokéCard Clash

1. Visit `/pokecard-clash`
2. Build your deck in Deck Builder
3. Battle AI opponents in Story Mode
4. Win rewards and buy new packs
5. Collect rare cards!

Full guide: [Player Guide](PLAYER_GUIDE.md)
