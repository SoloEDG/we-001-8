<script setup lang="ts">
import { computed } from "vue";
import type { CampaignState } from "../../../shared/types";
import { professions } from "../../roster/model/professions";
import { xpForNext } from "../model/growth";
import { BATTLEFIELDS } from "../model/battlefields";
const props = defineProps<{
  state: CampaignState;
  blockReason: string;
}>();
const emit = defineEmits<{
  toggle: [id: string];
  launch: [];
  tonic: [id: string];
  scroll: [id: string];
}>();
const slotTotal = computed(
  () => BATTLEFIELDS[props.state.stageIndex].azureSlots.length,
);
const vacancies = computed(() => slotTotal.value - props.state.deployment.length);
const chosen = (id: string) => props.state.deployment.includes(id);
const orderIndex = (id: string) => props.state.deployment.indexOf(id) + 1;
</script>
<template>
  <section class="panel briefing-panel">
    <div class="eyebrow">01 / DEPLOYMENT BRIEFING</div>
    <h3>
      继承名单与部署
      <small>{{ state.deployment.length }} / {{ slotTotal }} 已部署 ·
        {{ vacancies }} 个空缺</small>
    </h3>
    <p class="instruction">
      勾选存活角色编入本战场；阵亡角色需先用恢复药剂救回。每场部署位独立，
      角色以当前属性参战，战后升级不会改写本场回放。
    </p>

    <div class="roster-pick">
      <button
        v-for="r in state.roster"
        :key="r.id"
        :class="[
          'pick-row',
          {
            chosen: chosen(r.id),
            down: r.hp <= 0,
          },
        ]"
        :disabled="r.hp <= 0"
        @click="emit('toggle', r.id)"
      >
        <span class="pick-check">{{ chosen(r.id) ? orderIndex(r.id) : "○" }}</span>
        <span class="pick-body">
          <b>{{ r.name }} <i>Lv.{{ r.level }} {{ professions[r.job].name }}</i></b>
          <small>
            攻 {{ r.power }} · 护 {{ r.armor }} · 速 {{ r.speed }} · 移
            {{ r.move }}
          </small>
          <span class="xp-line">
            <i :style="{ width: (r.xp / xpForNext(r.level)) * 100 + '%' }" />
          </span>
        </span>
        <span class="pick-hp" :class="{ hurt: r.hp < r.maxHp }">
          {{ r.hp }}<small>/{{ r.maxHp }}</small>
        </span>
      </button>
    </div>

    <div class="supply-actions">
      <template v-for="r in state.roster" :key="r.id">
        <div v-if="r.hp < r.maxHp" class="supply-row">
          <span>{{ r.name }}（{{ r.hp }}/{{ r.maxHp }}）</span>
          <button
            :disabled="state.supplies.tonic <= 0"
            @click="emit('tonic', r.id)"
          >
            ✚ 药剂 ×{{ state.supplies.tonic }}
          </button>
          <button
            v-if="r.hp > 0"
            :disabled="state.supplies.scroll <= 0"
            @click="emit('scroll', r.id)"
          >
            ✦ 秘卷 ×{{ state.supplies.scroll }}
          </button>
        </div>
      </template>
    </div>

    <div v-if="blockReason" class="block-banner" role="alert">
      ⚠ {{ blockReason }}
    </div>
    <button class="primary launch" :disabled="!!blockReason" @click="emit('launch')">
      开战确认 <span>→</span>
    </button>
    <p v-if="vacancies > 0" class="vacancy-note">
      尚有 {{ vacancies }} 个空缺部署位，可直接以 {{ state.deployment.length || 0 }}
      人参战。
    </p>
  </section>
</template>
