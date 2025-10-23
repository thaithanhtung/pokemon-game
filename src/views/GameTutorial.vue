<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 to-purple-900">
    <!-- Header -->
    <div class="bg-black/40 backdrop-blur-md border-b border-white/20 sticky top-0 z-40 shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-5xl animate-bounce">📚</div>
            <div>
              <h1 class="text-3xl font-bold text-white">Game Tutorial</h1>
              <p class="text-sm text-gray-300">Hướng dẫn chơi PokéCard Clash</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <router-link
              to="/pokecard-clash"
              class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🎮 Chơi Ngay!
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Quick Navigation -->
      <div
        class="mb-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-2xl"
      >
        <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span class="text-3xl">📋</span>
          <span>Mục Lục</span>
        </h2>
        <div class="grid md:grid-cols-3 gap-3">
          <button
            v-for="section in sections"
            :key="section.id"
            @click="scrollToSection(section.id)"
            :class="[
              'text-left px-4 py-3 rounded-xl transition-all transform',
              activeSection === section.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:scale-102',
            ]"
          >
            <div class="text-2xl mb-1">{{ section.icon }}</div>
            <div class="font-semibold">{{ section.title }}</div>
          </button>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="space-y-8">
        <!-- Getting Started -->
        <section
          id="getting-started"
          class="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-shadow"
        >
          <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span class="text-4xl animate-pulse">🚀</span>
            <span>Bắt Đầu</span>
          </h2>

          <div class="space-y-4">
            <div
              class="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-5 border border-blue-500/30 hover:border-blue-400/50 transition-all"
            >
              <h3 class="text-xl font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <span class="text-2xl">1️⃣</span>
                Bước 1: Nhận Starter Pack
              </h3>
              <p class="text-gray-300 mb-4">
                Khi lần đầu vào game, bạn tự động nhận
                <strong class="text-yellow-400">Starter Pack</strong> miễn phí:
              </p>
              <div class="grid md:grid-cols-2 gap-3 text-sm text-gray-300">
                <div class="flex items-center gap-2 bg-green-900/20 rounded-lg px-3 py-2">
                  <span class="text-green-400 text-lg">✓</span> 3 Pokemon starters
                </div>
                <div class="flex items-center gap-2 bg-green-900/20 rounded-lg px-3 py-2">
                  <span class="text-green-400 text-lg">✓</span> Pikachu
                </div>
                <div class="flex items-center gap-2 bg-green-900/20 rounded-lg px-3 py-2">
                  <span class="text-green-400 text-lg">✓</span> 2x Heal cards
                </div>
                <div class="flex items-center gap-2 bg-green-900/20 rounded-lg px-3 py-2">
                  <span class="text-green-400 text-lg">✓</span> Items hỗ trợ
                </div>
              </div>
            </div>

            <div
              class="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-5 border border-purple-500/30 hover:border-purple-400/50 transition-all"
            >
              <h3 class="text-xl font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <span class="text-2xl">2️⃣</span>
                Bước 2: Tạo Deck
              </h3>
              <ol class="list-decimal list-inside space-y-2 text-gray-300">
                <li>Click vào <strong class="text-purple-300">"Deck Builder"</strong></li>
                <li>Click nút <strong class="text-purple-300">"+ New Deck"</strong></li>
                <li>Đặt tên cho deck của bạn</li>
                <li>Thêm ít nhất <strong class="text-yellow-400">12 thẻ</strong> (tối đa 30)</li>
                <li>Click <strong class="text-green-400">"Set Active"</strong> để active deck</li>
              </ol>
            </div>

            <div
              class="bg-gradient-to-br from-pink-900/30 to-pink-800/20 rounded-xl p-5 border border-pink-500/30 hover:border-pink-400/50 transition-all"
            >
              <h3 class="text-xl font-semibold text-pink-400 mb-3 flex items-center gap-2">
                <span class="text-2xl">3️⃣</span>
                Bước 3: Chiến Đấu!
              </h3>
              <p class="text-gray-300 flex items-center gap-2">
                Quay lại menu → Click <strong class="text-pink-300">"Story Mode"</strong> → Bắt đầu
                trận đấu đầu tiên! <span class="text-2xl">⚔️</span>
              </p>
            </div>
          </div>
        </section>

        <!-- Cards Guide -->
        <section
          id="cards-guide"
          class="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-shadow"
        >
          <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span class="text-4xl">🃏</span>
            <span>Loại Thẻ</span>
          </h2>

          <div class="space-y-4">
            <!-- Pokemon Cards -->
            <div
              class="bg-gradient-to-r from-red-900/30 to-red-700/30 rounded-lg p-4 border border-red-500/50"
            >
              <h3 class="text-lg font-semibold text-red-400 mb-2">🔥 Pokemon Cards</h3>
              <p class="text-gray-300 mb-3">Thẻ chiến đấu chính với các chỉ số:</p>
              <div class="grid md:grid-cols-4 gap-3 text-sm">
                <div class="bg-black/30 rounded px-3 py-2">
                  <div class="text-red-400 font-semibold">HP</div>
                  <div class="text-gray-300">Health Points</div>
                </div>
                <div class="bg-black/30 rounded px-3 py-2">
                  <div class="text-orange-400 font-semibold">ATK</div>
                  <div class="text-gray-300">Attack Power</div>
                </div>
                <div class="bg-black/30 rounded px-3 py-2">
                  <div class="text-blue-400 font-semibold">DEF</div>
                  <div class="text-gray-300">Defense</div>
                </div>
                <div class="bg-black/30 rounded px-3 py-2">
                  <div class="text-purple-400 font-semibold">SPD</div>
                  <div class="text-gray-300">Speed</div>
                </div>
              </div>
            </div>

            <!-- Skill Cards -->
            <div
              class="bg-gradient-to-r from-purple-900/30 to-purple-700/30 rounded-lg p-4 border border-purple-500/50"
            >
              <h3 class="text-lg font-semibold text-purple-400 mb-2">📜 Skill Cards</h3>
              <div class="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
                <div>💚 <strong>Heal:</strong> Hồi 30 HP (2⚡)</div>
                <div>⚔️ <strong>Attack Boost:</strong> +10 ATK (1⚡)</div>
                <div>🛡️ <strong>Protect:</strong> Chặn 20 damage (2⚡)</div>
                <div>✨ <strong>Cleanse:</strong> Xóa status (1⚡)</div>
              </div>
            </div>

            <!-- Item Cards -->
            <div
              class="bg-gradient-to-r from-green-900/30 to-green-700/30 rounded-lg p-4 border border-green-500/50"
            >
              <h3 class="text-lg font-semibold text-green-400 mb-2">🧪 Item Cards</h3>
              <div class="grid md:grid-cols-3 gap-2 text-sm text-gray-300">
                <div>🧪 <strong>Potion:</strong> +20 HP</div>
                <div>💎 <strong>Energy Crystal:</strong> +2⚡</div>
                <div>🔮 <strong>Revive:</strong> Hồi sinh 50% HP</div>
              </div>
            </div>

            <!-- Rarity -->
            <div
              class="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-5 border border-yellow-500/40"
            >
              <h3 class="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <span class="text-2xl">⭐</span>
                Độ Hiếm
              </h3>
              <div class="grid md:grid-cols-4 gap-4">
                <div
                  class="text-center bg-gray-700/50 rounded-lg p-3 hover:scale-105 transition-transform"
                >
                  <div class="text-gray-400 text-3xl font-bold mb-1">C</div>
                  <div class="text-sm text-gray-300">Common</div>
                  <div class="text-xs text-gray-400 mt-1">60%</div>
                </div>
                <div
                  class="text-center bg-blue-900/30 rounded-lg p-3 hover:scale-105 transition-transform"
                >
                  <div class="text-blue-400 text-3xl font-bold mb-1">R</div>
                  <div class="text-sm text-gray-300">Rare</div>
                  <div class="text-xs text-gray-400 mt-1">30%</div>
                </div>
                <div
                  class="text-center bg-purple-900/30 rounded-lg p-3 hover:scale-105 transition-transform"
                >
                  <div class="text-purple-400 text-3xl font-bold mb-1">E</div>
                  <div class="text-sm text-gray-300">Epic</div>
                  <div class="text-xs text-gray-400 mt-1">8%</div>
                </div>
                <div
                  class="text-center bg-orange-900/30 rounded-lg p-3 hover:scale-105 transition-transform"
                >
                  <div class="text-orange-400 text-3xl font-bold mb-1">L</div>
                  <div class="text-sm text-gray-300">Legendary</div>
                  <div class="text-xs text-gray-400 mt-1">2%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Battle System -->
        <section
          id="battle-system"
          class="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-2xl hover:shadow-3xl transition-shadow"
        >
          <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span class="text-4xl">⚔️</span>
            <span>Hệ Thống Chiến Đấu</span>
          </h2>

          <div class="space-y-4">
            <!-- Energy System -->
            <div
              class="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 rounded-xl p-5 border border-yellow-500/40"
            >
              <h3 class="text-xl font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <span class="text-2xl">⚡</span>
                Energy System
              </h3>
              <div class="grid md:grid-cols-3 gap-4 text-gray-300">
                <div
                  class="bg-black/40 rounded-lg p-4 border border-yellow-500/20 hover:border-yellow-400/40 transition-all"
                >
                  <div class="text-yellow-400 font-semibold mb-1">Bắt đầu</div>
                  <div class="text-3xl font-bold text-yellow-300">3⚡</div>
                </div>
                <div
                  class="bg-black/40 rounded-lg p-4 border border-yellow-500/20 hover:border-yellow-400/40 transition-all"
                >
                  <div class="text-yellow-400 font-semibold mb-1">Mỗi turn</div>
                  <div class="text-3xl font-bold text-yellow-300">+2⚡</div>
                </div>
                <div
                  class="bg-black/40 rounded-lg p-4 border border-yellow-500/20 hover:border-yellow-400/40 transition-all"
                >
                  <div class="text-yellow-400 font-semibold mb-1">Tối đa</div>
                  <div class="text-3xl font-bold text-yellow-300">5⚡</div>
                </div>
              </div>
            </div>

            <!-- Turn Flow -->
            <div class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-blue-400 mb-3">🔄 Luồng Lượt Chơi</h3>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <div
                    class="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
                  >
                    1
                  </div>
                  <div class="text-gray-300">Nhận +2⚡ energy</div>
                </div>
                <div class="flex items-start gap-3">
                  <div
                    class="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
                  >
                    2
                  </div>
                  <div class="text-gray-300">
                    Chọn hành động: Attack, Use card, hoặc Switch Pokemon
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div
                    class="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0"
                  >
                    3
                  </div>
                  <div class="text-gray-300">Kết thúc turn → AI chơi</div>
                </div>
              </div>
            </div>

            <!-- Type Effectiveness -->
            <div class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-green-400 mb-3">🎯 Tương Khắc Hệ</h3>
              <div class="grid md:grid-cols-2 gap-3 text-sm">
                <div class="bg-red-900/30 rounded p-3 border border-red-500/30">
                  <div class="text-red-400 font-semibold mb-1">🔥 Fire</div>
                  <div class="text-green-400">✓ Mạnh: Grass, Bug, Ice</div>
                  <div class="text-red-400">✗ Yếu: Water, Rock</div>
                </div>
                <div class="bg-blue-900/30 rounded p-3 border border-blue-500/30">
                  <div class="text-blue-400 font-semibold mb-1">💧 Water</div>
                  <div class="text-green-400">✓ Mạnh: Fire, Rock, Ground</div>
                  <div class="text-red-400">✗ Yếu: Grass, Electric</div>
                </div>
                <div class="bg-green-900/30 rounded p-3 border border-green-500/30">
                  <div class="text-green-400 font-semibold mb-1">🌿 Grass</div>
                  <div class="text-green-400">✓ Mạnh: Water, Rock</div>
                  <div class="text-red-400">✗ Yếu: Fire, Ice, Bug</div>
                </div>
                <div class="bg-yellow-900/30 rounded p-3 border border-yellow-500/30">
                  <div class="text-yellow-400 font-semibold mb-1">⚡ Electric</div>
                  <div class="text-green-400">✓ Mạnh: Water, Flying</div>
                  <div class="text-red-400">✗ Yếu: Ground</div>
                </div>
              </div>
              <div class="mt-3 p-3 bg-blue-900/20 rounded text-sm text-gray-300">
                <strong class="text-blue-400">Damage Multiplier:</strong> Super Effective = x1.5 |
                Not Effective = x0.5
              </div>
            </div>
          </div>
        </section>

        <!-- Deck Building -->
        <section
          id="deck-building"
          class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700"
        >
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-3xl">🏗️</span>
            Xây Dựng Deck
          </h2>

          <div class="space-y-4">
            <div class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-green-400 mb-3">
                ✅ Deck Cân Bằng (Recommended)
              </h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between bg-black/30 rounded px-4 py-2">
                  <span class="text-gray-300">Pokemon Cards</span>
                  <span class="text-blue-400 font-semibold">6-8 thẻ (50%)</span>
                </div>
                <div class="flex items-center justify-between bg-black/30 rounded px-4 py-2">
                  <span class="text-gray-300">Skill Cards</span>
                  <span class="text-purple-400 font-semibold">3-4 thẻ (25%)</span>
                </div>
                <div class="flex items-center justify-between bg-black/30 rounded px-4 py-2">
                  <span class="text-gray-300">Item Cards</span>
                  <span class="text-green-400 font-semibold">3-4 thẻ (25%)</span>
                </div>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                <h4 class="font-semibold text-red-400 mb-2">❌ Đừng Làm</h4>
                <ul class="space-y-1 text-sm text-gray-300">
                  <li>• Toàn Pokemon ATK cao</li>
                  <li>• Không có heal cards</li>
                  <li>• Quên type diversity</li>
                  <li>• Quá nhiều high-cost cards</li>
                </ul>
              </div>
              <div class="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <h4 class="font-semibold text-green-400 mb-2">✅ Nên Làm</h4>
                <ul class="space-y-1 text-sm text-gray-300">
                  <li>• Cân bằng ATK/HP/DEF</li>
                  <li>• 2-3 heal cards</li>
                  <li>• Đa dạng Pokemon types</li>
                  <li>• Mix low/high cost</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Shop & Resources -->
        <section
          id="shop-resources"
          class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700"
        >
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-3xl">🛍️</span>
            Shop & Resources
          </h2>

          <div class="grid md:grid-cols-3 gap-4 mb-4">
            <!-- Basic Pack -->
            <div
              class="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600"
            >
              <div class="text-4xl text-center mb-2">📦</div>
              <h3 class="text-lg font-semibold text-white text-center mb-2">Basic Pack</h3>
              <div class="text-center text-yellow-400 text-2xl font-bold mb-2">100⚡</div>
              <div class="text-sm text-gray-300 space-y-1">
                <div>• 5 cards</div>
                <div>• 1 Rare+ guaranteed</div>
              </div>
            </div>

            <!-- Premium Pack -->
            <div
              class="bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg p-4 border border-purple-500"
            >
              <div class="text-4xl text-center mb-2">🎁</div>
              <h3 class="text-lg font-semibold text-white text-center mb-2">Premium Pack</h3>
              <div class="text-center text-blue-400 text-2xl font-bold mb-2">50💎</div>
              <div class="text-sm text-gray-300 space-y-1">
                <div>• 8 cards</div>
                <div>• 2 Epic+ guaranteed</div>
              </div>
            </div>

            <!-- Legendary Pack -->
            <div
              class="bg-gradient-to-br from-yellow-700 to-yellow-900 rounded-lg p-4 border border-yellow-500"
            >
              <div class="text-4xl text-center mb-2">👑</div>
              <h3 class="text-lg font-semibold text-white text-center mb-2">Legendary Pack</h3>
              <div class="text-center text-blue-400 text-2xl font-bold mb-2">100💎</div>
              <div class="text-sm text-gray-300 space-y-1">
                <div>• 10 cards</div>
                <div>• 1 Legendary guaranteed</div>
              </div>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
              <h4 class="font-semibold text-yellow-400 mb-2">⚡ Kiếm Energy</h4>
              <ul class="space-y-1 text-sm text-gray-300">
                <li>• Win battle: +50</li>
                <li>• Level up rewards</li>
                <li>• Daily login (future)</li>
              </ul>
            </div>
            <div class="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
              <h4 class="font-semibold text-blue-400 mb-2">💎 Kiếm Gems</h4>
              <ul class="space-y-1 text-sm text-gray-300">
                <li>• Level up: +10</li>
                <li>• Achievements (future)</li>
                <li>• Tournament (future)</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Tips & Tricks -->
        <section
          id="tips-tricks"
          class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700"
        >
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-3xl">💡</span>
            Tips & Tricks
          </h2>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <div class="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                <h4 class="font-semibold text-blue-400 mb-2">🎯 Quản Lý Energy</h4>
                <p class="text-sm text-gray-300">
                  Đừng spam skills nhỏ! Save energy cho big skills khi cần.
                </p>
              </div>
              <div class="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <h4 class="font-semibold text-green-400 mb-2">🔄 Switch Pokemon</h4>
                <p class="text-sm text-gray-300">Switch khi HP < 30% hoặc bị type counter!</p>
              </div>
              <div class="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                <h4 class="font-semibold text-purple-400 mb-2">💊 Dùng Items Đúng Lúc</h4>
                <p class="text-sm text-gray-300">Heal khi HP < 40%. Đừng lãng phí khi full HP!</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                <h4 class="font-semibold text-red-400 mb-2">⚠️ Lỗi Thường Gặp</h4>
                <ul class="text-sm text-gray-300 space-y-1">
                  <li>• Build deck thiếu cân bằng</li>
                  <li>• Quên check type advantage</li>
                  <li>• Không switch Pokemon</li>
                  <li>• Spam Basic Packs mãi</li>
                </ul>
              </div>
              <div class="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
                <h4 class="font-semibold text-yellow-400 mb-2">⭐ Pro Tips</h4>
                <ul class="text-sm text-gray-300 space-y-1">
                  <li>• Type advantage = x1.5 damage!</li>
                  <li>• Save gems cho Legendary Pack</li>
                  <li>• 20-25 cards = deck tối ưu</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- CTA -->
      <div
        class="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-12 text-center shadow-2xl relative overflow-hidden"
      >
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="relative z-10">
          <div class="text-6xl mb-4 animate-bounce">🎮</div>
          <h2 class="text-4xl font-bold text-white mb-4">Sẵn sàng chiến đấu?</h2>
          <p class="text-xl text-gray-100 mb-8">
            Bắt đầu hành trình Pokemon Card Master của bạn ngay!
          </p>
          <router-link
            to="/pokecard-clash"
            class="inline-block bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all transform hover:scale-110 shadow-xl"
          >
            Chơi Ngay! ⚡
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const activeSection = ref('getting-started');

const sections = [
  { id: 'getting-started', title: 'Bắt Đầu', icon: '🚀' },
  { id: 'cards-guide', title: 'Loại Thẻ', icon: '🃏' },
  { id: 'battle-system', title: 'Chiến Đấu', icon: '⚔️' },
  { id: 'deck-building', title: 'Build Deck', icon: '🏗️' },
  { id: 'shop-resources', title: 'Shop', icon: '🛍️' },
  { id: 'tips-tricks', title: 'Tips', icon: '💡' },
];

const scrollToSection = id => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const updateActiveSection = () => {
  const scrollPosition = window.scrollY + 100;

  for (const section of sections) {
    const element = document.getElementById(section.id);
    if (element) {
      const { offsetTop, offsetHeight } = element;
      if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
        activeSection.value = section.id;
        break;
      }
    }
  }
};

onMounted(() => {
  window.addEventListener('scroll', updateActiveSection);
  updateActiveSection();
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection);
});
</script>
