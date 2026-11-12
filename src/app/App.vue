<script setup lang="ts">
import { computed } from "vue";
import { BattleMap, TerrainPanel } from "../features/terrain";
import { RosterPanel } from "../features/roster";
import { ActionPanel } from "../features/tactics";
import { TurnOrder } from "../features/initiative";
import { ReplayPanel, downloadArchive } from "../features/replay";
import { key } from "../shared/document";
import {
  CampaignBriefing,
  CampaignProgress,
  SettlementPanel,
  CampaignComplete,
  BATTLEFIELDS,
} from "../features/campaign";
import { useWorkspace } from "./workspace";
const {
  state,
  field,
  session,
  cursor,
  selected,
  skill,
  brush,
  notice,
  blockNotice,
  battle,
  actor,
  locked,
  routes,
  targets,
  path,
  playback,
  events,
  deployBlockReason,
  cell,
  wait,
  seek,
  resetCampaign,
  toggleDeployment,
  startBattle,
  retry,
  advance,
  useTonic,
  useScroll,
} = useWorkspace();

const inBattle = computed(
  () => state.phase === "fighting" || state.phase === "victory" || state.phase === "defeat",
);
const fieldMeta = computed(() => BATTLEFIELDS[state.stageIndex]);
const previewTiles = computed(() =>
  field.value.terrain.map((terrain, i) => ({
    terrain,
    x: i % 12,
    y: Math.floor(i / 12),
  })),
);
const slotAt = (x: number, y: number) =>
  field.value.azureSlots.findIndex((s) => s.x === x && s.y === y) + 1;
</script>
<template>
  <main>
    <header>
      <a class="brand" href="./"
        ><span class="brand-mark">⌘</span>
        <div>灰烬渡口<small>ASHEN CROSSING / CAMPAIGN</small></div></a
      >
      <nav>
        <span class="nav-active">本地战役指挥台</span
        ><span>多战场连续部署 / {{ fieldMeta.name }}</span>
      </nav>
      <button @click="resetCampaign">↻ 重开战役</button>
    </header>

    <CampaignProgress :state="state" />

    <div class="mission">
      <div>
        <div class="eyebrow">{{ fieldMeta.subtitle }}</div>
        <h1>{{ fieldMeta.name }} —— 继承上一场的战果。</h1>
        <p>
          存活角色、经验与消耗资源跨场继承；升级影响寻路与伤害，但每场回放锁定当场属性。
        </p>
      </div>
      <div class="live-badge">
        <i />{{
          cursor < 0 ? "实战指挥" : "历史回放 · 只读"
        }}<small>消灭敌方所有角色获胜 · 胜利时一次性结算</small>
      </div>
    </div>

    <!-- 简报 / 结算 / 完成：非战斗阶段 -->
    <div v-if="!inBattle" class="workspace">
      <aside>
        <CampaignBriefing
          v-if="state.phase === 'briefing'"
          :state="state"
          :block-reason="deployBlockReason || blockNotice"
          @toggle="toggleDeployment"
          @launch="startBattle"
          @tonic="useTonic"
          @scroll="useScroll"
        />
        <CampaignComplete
          v-else-if="state.phase === 'complete'"
          @restart="resetCampaign"
        />
      </aside>
      <div class="center">
        <section class="map-frame">
          <div class="map-caption">
            <span>{{ fieldMeta.name }} / 部署预览</span
            ><span>12 × 8 · 数字为部署顺位</span>
          </div>
          <div class="battle-map briefing-map" role="grid" aria-label="部署预览地图">
            <button
              v-for="tile in previewTiles"
              :key="key(tile)"
              :class="['tile', tile.terrain]"
              disabled
            >
              <b v-if="slotAt(tile.x, tile.y)" class="slot-marker">{{
                slotAt(tile.x, tile.y)
              }}</b>
              <small>{{ tile.x + 1 }}·{{ tile.y + 1 }}</small>
            </button>
          </div>
          <div class="map-caption">
            <span>带数字格为苍蓝军合法部署位（共 {{ field.azureSlots.length }} 个）</span
            ><span>空缺位可留空，但合法位不足时无法开战</span>
          </div>
        </section>
        <div class="field-note">
          <span>✦ 继承规则</span>
          <p>
            阵亡角色不进入下一场，可用药剂救治；秘卷可在简报中转化为经验。资源与生命实时保存，刷新后回到同一战役节点。
          </p>
        </div>
      </div>
      <aside>
        <section class="panel">
          <div class="eyebrow">CAMPAIGN LOG</div>
          <h3>战役记录</h3>
          <ul class="cleared-list">
            <li v-if="!state.cleared.length" class="muted">尚未完成任何战场</li>
            <li v-for="c in state.cleared" :key="c.stageIndex">
              ✓ 第 {{ c.stageIndex + 1 }} 场 · {{ c.name }}
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <!-- 战斗阶段 -->
    <template v-else>
      <TurnOrder :battle="battle" />
      <div class="workspace">
        <aside>
          <RosterPanel
            :units="battle.units"
            :selected="selected"
            :active="battle.active"
            @select="selected = $event"
          /><TerrainPanel
            :brush="brush"
            :locked="locked"
            @paint="
              brush = $event;
              skill = '';
            "
          />
        </aside>
        <div class="center">
          <BattleMap
            :battle="battle"
            :selected="selected"
            :routes="[...routes.keys()]"
            :targets="targets.map(key)"
            :path="path"
            @cell="cell"
          />
          <div v-if="blockNotice" class="block-banner" role="alert">
            ⚠ {{ blockNotice }}
          </div>
          <div class="field-note">
            <span>✦ 战场提示</span>
            <p>
              密林提供 3 点掩护；高地攻击 +2；迟缓减少 2
              点移动；灼烧在自身行动结束时结算。职业升级会改变移动、速度与伤害。
            </p>
          </div>
        </div>
        <aside>
          <ActionPanel
            :unit="actor"
            :skill="skill"
            :locked="locked"
            :notice="notice"
            @skill="
              skill = $event;
              brush = null;
            "
            @wait="wait"
          />
          <ReplayPanel
            :events="events"
            :cursor="cursor"
            :playing="playback.playing.value"
            @seek="seek"
            @play="playback.play(cursor)"
            @stop="playback.stop"
            @download="session && downloadArchive(session)"
          />
          <SettlementPanel
            v-if="state.phase === 'victory' || state.phase === 'defeat'"
            :state="state"
            @advance="advance"
            @retry="retry"
          />
        </aside>
      </div>
    </template>

    <footer>
      <span>WE–001 / CAMPAIGN TACTICS</span
      ><span>自动保存于当前浏览器　·　全部运算在本地完成</span
      ><span>苍蓝军 <b>VS</b> 余烬军</span>
    </footer>
  </main>
</template>
