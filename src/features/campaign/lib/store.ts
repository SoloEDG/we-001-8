import { computed, reactive, ref } from "vue";
import type {
  Battle,
  BattleEvent,
  CampaignState,
  Point,
  Settlement,
  Terrain,
} from "../../../shared/types";
import { clone, findUnit, key } from "../../../shared/document";
import { reachable, terrainRules, paintTile } from "../../terrain";
import { moveBudget, armorValue, tickStatuses } from "../../roster";
import {
  getSkill,
  legalTargets,
  moveUnit,
  castSkill,
} from "../../tactics";
import { finishTurn } from "../../initiative";
import { record, frame, usePlayback } from "../../replay";
import { BATTLEFIELDS, getBattlefield } from "../model/battlefields";
import { grantXp, settleGrowth } from "../model/growth";
import { syncSurvivors } from "../model/forces";
import { buildBattleSession } from "../model/battleSession";
import { validateDeployment } from "./deployment";
import {
  createCampaign,
  loadCampaign,
  saveCampaign,
  clearCampaign,
} from "./persistence";

export function useCampaignStore() {
  const state = reactive<CampaignState>(loadCampaign() ?? createCampaign());
  const cursor = ref(-1);
  const selected = ref(state.session?.live.active ?? "");
  const skill = ref("");
  const brush = ref<Terrain | null>(null);
  const notice = ref("");
  /** 阻断性提示（如合法位置不足），由界面横幅展示，与普通 notice 区分 */
  const blockNotice = ref("");

  const playback = usePlayback(
    () => state.session?.events.length ?? 0,
    (n) => {
      cursor.value = n;
    },
  );

  const field = computed(() => getBattlefield(state.stageIndex));
  const session = computed(() => state.session);
  const battle = computed<Battle | null>(() =>
    state.session ? frame(state.session, cursor.value) : null,
  );
  const actor = computed(() => {
    const b = battle.value;
    return b && b.active ? findUnit(b, b.active) : null;
  });
  const locked = computed(
    () =>
      !state.session ||
      cursor.value >= 0 ||
      !!state.session.live.ended ||
      state.phase !== "fighting",
  );
  const routes = computed(() => {
    const b = state.session?.live;
    const u = actor.value;
    if (!b || !u || locked.value || u.moved || u.acted) return new Map();
    return reachable(b, u, moveBudget(u));
  });
  const targets = computed(() => {
    const b = battle.value;
    const u = actor.value;
    if (!b || !u) return [];
    const s = getSkill(u.job, skill.value);
    return s ? legalTargets(b, u, s) : [];
  });
  const path = computed(() => {
    if (!state.session || cursor.value <= 0) return [];
    return state.session.events[cursor.value - 1]?.path ?? [];
  });

  const livingRoster = computed(() => state.roster.filter((r) => r.hp > 0));
  const deadRoster = computed(() => state.roster.filter((r) => r.hp <= 0));
  const canDeploy = computed(() => {
    const check = validateDeployment(field.value, state.deployment);
    return check.ok;
  });
  const deployBlockReason = computed(() => {
    const check = validateDeployment(field.value, state.deployment);
    return check.ok ? "" : check.reason;
  });
  const isLastStage = computed(() => state.stageIndex === BATTLEFIELDS.length - 1);

  function persist() {
    saveCampaign(state);
  }

  // ---- 简报阶段：部署名单编辑 ----------------------------------------
  function toggleDeployment(id: string) {
    if (state.phase !== "briefing") return;
    blockNotice.value = "";
    const i = state.deployment.indexOf(id);
    if (i >= 0) {
      state.deployment.splice(i, 1);
    } else {
      if (state.deployment.length >= field.value.azureSlots.length) {
        blockNotice.value = `本战场只有 ${field.value.azureSlots.length} 个合法部署位`;
        return;
      }
      state.deployment.push(id);
    }
    persist();
  }

  /** 开战：合法位置不足时阻止，并保留当前简报与上场结果 */
  function startBattle() {
    if (state.phase !== "briefing") return;
    const check = validateDeployment(field.value, state.deployment);
    if (!check.ok) {
      blockNotice.value = check.reason;
      notice.value = check.reason;
      return;
    }
    const s = buildBattleSession(field.value, state.roster, state.deployment);
    state.session = s;
    state.phase = "fighting";
    state.settlement = null;
    cursor.value = -1;
    selected.value = s.live.active;
    skill.value = "";
    brush.value = null;
    blockNotice.value = "";
    notice.value = "战斗开始，利用地形掌握先机。";
    persist();
  }

  // ---- 战斗操作 ------------------------------------------------------
  function cell(p: Point) {
    try {
      if (!state.session) throw new Error("当前没有进行中的战斗");
      if (locked.value) throw new Error("回放只读，请返回实战");
      const before = clone(state.session.live);
      const u = actor.value!;
      if (brush.value) {
        paintTile(state.session.live, p, brush.value);
        record(
          state.session,
          before,
          "terrain",
          `地形调整为${terrainRules[brush.value].name}`,
        );
      } else if (skill.value) {
        const s = getSkill(u.job, skill.value)!;
        const t = state.session.live.units.find(
          (t) => t.hp > 0 && key(t) === key(p),
        );
        if (!t) throw new Error("请点击合法角色");
        const ground = state.session.live.tiles.find(
          (v) => key(v) === key(t),
        )!;
        const high =
          state.session.live.tiles.find((v) => key(v) === key(u))!.terrain ===
          "ridge";
        const value = castSkill(
          state.session.live,
          u.id,
          t.id,
          s,
          armorValue(t),
          terrainRules[ground.terrain].cover,
          high,
        );
        record(
          state.session,
          before,
          "skill",
          `${u.name} → ${t.name} · ${s.name} ${value}`,
        );
        skill.value = "";
      } else {
        const route = routes.value.get(key(p));
        if (!route?.path.length)
          throw new Error("此格不可达，请检查地形与占位");
        moveUnit(state.session.live, u.id, route.path);
        record(
          state.session,
          before,
          "move",
          `${u.name}移动 · 消耗${route.cost}`,
          route.path,
        );
      }
      persist();
      notice.value = state.session.events.at(-1)!.label;
      syncEndState();
    } catch (e) {
      notice.value = (e as Error).message;
    }
  }

  function wait() {
    if (!state.session || locked.value) return;
    const before = clone(state.session.live);
    finishTurn(state.session.live, tickStatuses);
    record(
      state.session,
      before,
      "wait",
      `${findUnit(before, before.active).name}结束行动`,
    );
    selected.value = state.session.live.active;
    skill.value = "";
    persist();
    syncEndState();
  }

  /**
   * 战斗结束判定：只在"尚未结算"时转移阶段。
   * 胜利→一次性结算；失败→进入可重试状态，不动名册与补给。
   */
  function syncEndState() {
    const s = state.session;
    if (!s || !s.live.ended) return;
    if (state.phase !== "fighting") return;
    if (s.live.ended === "azure") {
      applyVictory(s);
    } else {
      state.phase = "defeat";
      notice.value = "部队全灭，可重试本战场；失败期间的奖励不会保留。";
      persist();
    }
  }

  /**
   * 胜利确认时的一次性成长结算。
   * 用 settlement 标记幂等：重复打开结算页不会再次累加经验/补给。
   */
  function applyVictory(s: NonNullable<CampaignState["session"]>) {
    if (state.settlement) return;
    // 先把存活角色的带伤生命写回名册
    syncSurvivors(state.roster, s.live.units);
    const f = getBattlefield(state.stageIndex);
    const entries = settleGrowth(state.roster, s.live.units, f.xpReward);
    state.supplies.tonic += f.tonicReward;
    state.supplies.scroll += f.scrollReward;
    const settlement: Settlement = {
      stageIndex: state.stageIndex,
      tonicReward: f.tonicReward,
      scrollReward: f.scrollReward,
      entries,
    };
    state.settlement = settlement;
    state.phase = "victory";
    state.cleared.push({ stageIndex: state.stageIndex, name: f.name });
    notice.value = "胜利结算已确认，奖励仅发放一次。";
    persist();
  }

  // ---- 失败重试：丢弃本场 session，回到同一节点简报 ------------------
  function retry() {
    if (state.phase !== "defeat") return;
    playback.stop();
    state.session = null;
    state.phase = "briefing";
    state.settlement = null;
    cursor.value = -1;
    selected.value = "";
    skill.value = "";
    brush.value = null;
    blockNotice.value = "";
    notice.value = "已撤回简报，名册与补给保持失败前状态。";
    persist();
  }

  /** 胜利后进入下一场：预览继承名单与空缺，重新进入简报 */
  function advance() {
    if (state.phase !== "victory") return;
    playback.stop();
    if (isLastStage.value) {
      state.phase = "complete";
      persist();
      return;
    }
    state.stageIndex++;
    state.session = null;
    state.phase = "briefing";
    state.settlement = null;
    // 默认预选存活者，直到填满部署位，供玩家在简报调整
    state.deployment = livingRoster.value
      .slice(0, getBattlefield(state.stageIndex).azureSlots.length)
      .map((r) => r.id);
    cursor.value = -1;
    selected.value = "";
    blockNotice.value = "";
    notice.value = "进入下一战场，请确认继承名单与空缺位置。";
    persist();
  }

  // ---- 简报阶段补给：药剂救治/恢复，秘卷转经验 -----------------------
  function useTonic(id: string) {
    if (state.phase !== "briefing" || state.supplies.tonic <= 0) return;
    const r = state.roster.find((u) => u.id === id);
    if (!r || r.hp >= r.maxHp) return;
    state.supplies.tonic--;
    r.hp = Math.min(r.maxHp, r.hp + Math.ceil(r.maxHp * 0.5));
    persist();
  }

  function useScroll(id: string) {
    if (state.phase !== "briefing" || state.supplies.scroll <= 0) return;
    const r = state.roster.find((u) => u.id === id);
    if (!r || r.hp <= 0) return;
    state.supplies.scroll--;
    // grantXp(0) 复用同一套职业成长，只负责把已累积的经验转化为升级
    grantXp(r, 40);
    persist();
  }

  function seek(n: number) {
    playback.stop();
    cursor.value = n;
    skill.value = "";
    brush.value = null;
  }

  function resetCampaign() {
    playback.stop();
    clearCampaign();
    Object.assign(state, createCampaign());
    cursor.value = -1;
    selected.value = "";
    skill.value = "";
    brush.value = null;
    blockNotice.value = "";
    notice.value = "已开启新的本地战役。";
  }

  /** 回放用事件列表（只读，供面板渲染） */
  const events = computed<BattleEvent[]>(() => state.session?.events ?? []);

  return {
    state,
    field,
    session,
    battle,
    actor,
    locked,
    routes,
    targets,
    path,
    events,
    cursor,
    selected,
    skill,
    brush,
    notice,
    blockNotice,
    playback,
    livingRoster,
    deadRoster,
    canDeploy,
    deployBlockReason,
    isLastStage,
    toggleDeployment,
    startBattle,
    cell,
    wait,
    retry,
    advance,
    useTonic,
    useScroll,
    seek,
    resetCampaign,
  };
}
