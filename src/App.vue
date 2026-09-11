<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CircleInfo, Copy, History, Shuffle, Ticket, Trash } from 'reicon-vue'
import {
  LOTTERY_RULES,
  formatBatch,
  formatNumber,
  generateTickets,
  type GameId,
  type GenerationBatch,
} from './lottery'

const selectedGame = ref<GameId>('ssq')
const ticketCount = ref<1 | 3 | 5>(1)
const currentBatch = ref<GenerationBatch | null>(null)
const history = ref<GenerationBatch[]>([])
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let batchSequence = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined

const activeRule = computed(() => LOTTERY_RULES[selectedGame.value])

watch(selectedGame, () => {
  currentBatch.value = null
})

function showToast(message: string, type: 'success' | 'error') {
  toast.value = { message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 2200)
}

function generate() {
  batchSequence += 1
  const batch: GenerationBatch = {
    id: `${Date.now()}-${batchSequence}`,
    gameId: selectedGame.value,
    tickets: generateTickets(activeRule.value, ticketCount.value),
    createdAt: new Date(),
  }

  currentBatch.value = batch
  history.value = [batch, ...history.value].slice(0, 10)
}

async function copyBatch(batch: GenerationBatch) {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API unavailable')
    }
    await navigator.clipboard.writeText(formatBatch(batch))
    showToast('号码已复制', 'success')
  } catch {
    showToast('复制失败，请稍后重试', 'error')
  }
}

function clearHistory() {
  history.value = []
  showToast('历史记录已清空', 'success')
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

onBeforeUnmount(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="app-shell">
    <div class="ambient ambient-red" aria-hidden="true"></div>
    <div class="ambient ambient-blue" aria-hidden="true"></div>

    <header class="site-header">
      <a class="brand" href="#top" aria-label="幸运选号首页">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-ball brand-ball-red"></span>
          <span class="brand-ball brand-ball-blue"></span>
        </span>
        <span>幸运选号</span>
      </a>
      <span class="header-note"><Ticket :size="18" weight="Outline" /> 公平随机 · 免费使用</span>
    </header>

    <main id="top" class="main-content">
      <section class="hero" aria-labelledby="page-title">
        <span class="eyebrow">LUCKY NUMBER GENERATOR</span>
        <h1 id="page-title">双色球 · 大乐透随机选号</h1>
        <p>简单、公平，一键生成你的幸运号码</p>
      </section>

      <section class="generator-panel" aria-label="选号设置">
        <div class="game-tabs" role="tablist" aria-label="彩票类型">
          <button
            v-for="rule in LOTTERY_RULES"
            :id="`tab-${rule.id}`"
            :key="rule.id"
            class="game-tab"
            :class="{ active: selectedGame === rule.id }"
            type="button"
            role="tab"
            :aria-selected="selectedGame === rule.id"
            :aria-controls="`panel-${rule.id}`"
            @click="selectedGame = rule.id"
          >
            {{ rule.name }}
          </button>
        </div>

        <div class="generator-controls">
          <div class="count-control">
            <span id="count-label">生成注数</span>
            <div class="segmented" role="group" aria-labelledby="count-label">
              <button
                v-for="count in ([1, 3, 5] as const)"
                :key="count"
                type="button"
                :class="{ active: ticketCount === count }"
                :aria-pressed="ticketCount === count"
                @click="ticketCount = count"
              >
                {{ count }}注
              </button>
            </div>
          </div>

          <button class="generate-button" type="button" @click="generate">
            <Shuffle :size="24" weight="Outline" />
            {{ currentBatch ? '再来一组' : '立即生成' }}
          </button>
        </div>

        <p class="rule-preview">
          <CircleInfo :size="17" weight="Outline" />
          {{ activeRule.shortRule }}
        </p>
      </section>

      <div class="content-grid">
        <section
          :id="`panel-${selectedGame}`"
          class="result-card card"
          role="tabpanel"
          :aria-labelledby="`tab-${selectedGame}`"
        >
          <div class="card-heading">
            <div>
              <span class="section-kicker">CURRENT PICKS</span>
              <h2>本次号码</h2>
            </div>
            <button
              v-if="currentBatch"
              class="secondary-button"
              type="button"
              aria-label="复制本次号码"
              @click="copyBatch(currentBatch)"
            >
              <Copy :size="18" weight="Outline" />
              复制结果
            </button>
          </div>

          <div v-if="currentBatch" class="ticket-list" aria-live="polite">
            <div
              v-for="(ticketItem, index) in currentBatch.tickets"
              :key="`${currentBatch.id}-${index}`"
              class="ticket-row"
            >
              <span v-if="currentBatch.tickets.length > 1" class="ticket-index">第{{ index + 1 }}注</span>
              <div class="number-line">
                <span class="number-group">
                  <span
                    v-for="number in ticketItem.primary"
                    :key="`primary-${number}`"
                    class="number-ball primary-ball"
                  >
                    {{ formatNumber(number) }}
                  </span>
                </span>
                <span class="plus" aria-label="加">+</span>
                <span class="number-group secondary-group">
                  <span
                    v-for="number in ticketItem.secondary"
                    :key="`secondary-${number}`"
                    class="number-ball secondary-ball"
                  >
                    {{ formatNumber(number) }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div v-else class="empty-result">
            <span class="empty-icon"><Shuffle :size="30" weight="Outline" /></span>
            <h3>准备好了吗？</h3>
            <p>选择注数，点击“立即生成”获取号码</p>
          </div>
        </section>

        <section class="history-card card" aria-labelledby="history-title">
          <div class="card-heading">
            <div>
              <span class="section-kicker">RECENT</span>
              <h2 id="history-title"><History :size="22" weight="Outline" /> 最近记录</h2>
            </div>
            <button
              v-if="history.length"
              class="text-button"
              type="button"
              aria-label="清空历史记录"
              @click="clearHistory"
            >
              <Trash :size="17" weight="Outline" />
              清空
            </button>
          </div>

          <div v-if="history.length" class="history-list">
            <article v-for="batch in history" :key="batch.id" class="history-item">
              <div class="history-meta">
                <span class="game-chip" :class="batch.gameId">{{ LOTTERY_RULES[batch.gameId].name }}</span>
                <time :datetime="batch.createdAt.toISOString()">{{ formatTime(batch.createdAt) }}</time>
                <button
                  class="icon-button"
                  type="button"
                  :aria-label="`复制${LOTTERY_RULES[batch.gameId].name}记录`"
                  title="复制这组号码"
                  @click="copyBatch(batch)"
                >
                  <Copy :size="17" weight="Outline" />
                </button>
              </div>
              <div
                v-for="(ticketItem, index) in batch.tickets"
                :key="`${batch.id}-history-${index}`"
                class="history-numbers"
              >
                <span>{{ ticketItem.primary.map(formatNumber).join(' ') }}</span>
                <b>+</b>
                <span class="history-secondary">{{ ticketItem.secondary.map(formatNumber).join(' ') }}</span>
              </div>
            </article>
          </div>

          <div v-else class="empty-history">
            <History :size="28" weight="Outline" />
            <p>生成的号码会暂存在这里</p>
            <span>最多保留最近 10 批记录</span>
          </div>
        </section>
      </div>
    </main>

    <footer>
      <CircleInfo :size="16" weight="Outline" />
      随机结果仅供娱乐，请理性参与
    </footer>

    <Transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type" role="status" aria-live="polite">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>
