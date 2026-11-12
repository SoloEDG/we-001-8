<script setup lang="ts">
defineEmits<{ restart: [] }>();
</script>
<template>
  <section class="panel complete-panel">
    <div class="eyebrow">CAMPAIGN COMPLETE</div>
    <h3>北境战线已平定</h3>
    <p class="instruction">
      三个战场全部攻克。所有成长与补给均来自各场胜利时的一次性结算，
      每场回放仍保留当场真实属性。
    </p>
    <button class="primary launch" @click="$emit('restart')">
      开启新战役 <span>↻</span>
    </button>
  </section>
</template>
