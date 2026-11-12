import { computed } from "vue";
import type { Battle, Unit } from "../shared/types";
import { useCampaignStore } from "../features/campaign";

/**
 * 视图适配层：把战役 store 暴露成指挥台模板需要的形状。
 * 战斗逻辑与持久化全部集中在 features/campaign/lib/store.ts。
 */
export function useWorkspace() {
  const store = useCampaignStore();

  // 战斗视图始终在存在 session 时渲染，这里给出非空兜底，简化模板判空
  const battle = computed<Battle>(
    () =>
      store.battle.value ?? {
        tiles: [],
        units: [],
        round: 1,
        queue: [],
        active: "",
        ended: null,
      },
  );
  const session = computed(() => store.session.value);
  const EMPTY_ACTOR: Unit = {
    id: "",
    name: "",
    job: "guard",
    team: "azure",
    x: 0,
    y: 0,
    hp: 1,
    maxHp: 1,
    power: 0,
    armor: 0,
    speed: 0,
    move: 0,
    level: 1,
    xp: 0,
    statuses: [],
    moved: true,
    acted: true,
  };
  const actor = computed(() => store.actor.value ?? EMPTY_ACTOR);

  return {
    ...store,
    // 用非空版本覆盖 store 的可空计算属性
    battle,
    session,
    actor,
  };
}
