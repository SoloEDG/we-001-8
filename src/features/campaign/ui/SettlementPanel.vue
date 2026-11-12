<script setup lang="ts">
import { computed } from "vue";
import type { CampaignState } from "../../../shared/types";
import { BATTLEFIELDS } from "../model/battlefields";
const props = defineProps<{ state: CampaignState }>();
const emit = defineEmits<{ advance: []; retry: [] }>();
const isLast = computed(
  () => props.state.stageIndex === BATTLEFIELDS.length - 1,
);
const fieldName = computed(
  () => BATTLEFIELDS[props.state.stageIndex]?.name ?? "",
);
</script>
<template>
  <section class="panel settlement-panel">
    <template v-if="state.phase === 'victory' && state.settlement">
      <div class="eyebrow">VICTORY / 一次性结算</div>
      <h3>{{ fieldName }} · 胜利确认</h3>
      <p class="instruction">
        奖励已在胜利确认时计入名册与补给，重复查看本页不会再次累加。
      </p>
      <ul class="reward-list">
        <li v-for="e in state.settlement.entries" :key="e.unitId">
          <span>{{ e.name }}</span>
          <b>+{{ e.xpGained }} 经验</b>
          <i v-if="e.levelsGained">升级 ×{{ e.levelsGained }}</i>
          <i v-else class="muted">经验累积</i>
        </li>
      </ul>
      <div class="reward-supply">
        <span>获得恢复药剂 ✚ {{ state.settlement.tonicReward }}</span>
        <span>获得秘术秘卷 ✦ {{ state.settlement.scrollReward }}</span>
      </div>
      <button class="primary launch" @click="emit('advance')">
        {{ isLast ? "完成战役" : "进入下一战场" }} <span>→</span>
      </button>
    </template>

    <template v-else-if="state.phase === 'defeat'">
      <div class="eyebrow">DEFEAT / 行动失败</div>
      <h3>{{ fieldName }} · 部队全灭</h3>
      <p class="instruction">
        本战场可重试。失败期间产生的经验与补给奖励一律不计入，名册与补给保持开战前状态。
      </p>
      <ul class="reward-list">
        <li
          v-for="u in (state.session?.live.units ?? []).filter(
            (u) => u.team === 'azure' && u.hp <= 0,
          )"
          :key="u.id"
        >
          <span>{{ u.name }}</span>
          <i class="muted">本场阵亡 · 重试后恢复</i>
        </li>
      </ul>
      <button class="primary launch" @click="emit('retry')">
        重试本战场 <span>↻</span>
      </button>
    </template>
  </section>
</template>
