<script setup lang="ts">
import { computed } from "vue";
import type { CampaignState } from "../../../shared/types";
import { BATTLEFIELDS } from "../model/battlefields";
const props = defineProps<{ state: CampaignState }>();
const phaseLabel: Record<CampaignState["phase"], string> = {
  briefing: "部署简报",
  fighting: "交战中",
  victory: "胜利结算",
  defeat: "战败 · 可重试",
  complete: "战役完成",
};
const alive = computed(() => props.state.roster.filter((r) => r.hp > 0).length);
</script>
<template>
  <section class="campaign-strip panel">
    <div class="campaign-head">
      <div class="eyebrow">LOCAL CAMPAIGN / 北境战线</div>
      <h3>
        本地战役 · 第 {{ state.stageIndex + 1 }} / {{ BATTLEFIELDS.length }} 场
        <small>{{ phaseLabel[state.phase] }}</small>
      </h3>
    </div>
    <ol class="stage-track">
      <li
        v-for="f in BATTLEFIELDS"
        :key="f.index"
        :class="{
          done: state.cleared.some((c) => c.stageIndex === f.index),
          current: f.index === state.stageIndex && state.phase !== 'complete',
        }"
      >
        <b>{{ f.index + 1 }}</b><span>{{ f.name }}</span>
      </li>
    </ol>
    <div class="campaign-meta">
      <span>存活名册 <b>{{ alive }} / {{ state.roster.length }}</b></span>
      <span>恢复药剂 <b>✚ {{ state.supplies.tonic }}</b></span>
      <span>秘术秘卷 <b>✦ {{ state.supplies.scroll }}</b></span>
    </div>
  </section>
</template>
