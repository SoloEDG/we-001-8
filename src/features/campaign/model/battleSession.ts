import type { Battle, Battlefield, RosterUnit, Session } from "../../../shared/types";
import { clone } from "../../../shared/document";
import { order } from "../../initiative/lib/order";
import { createEnemies, instantiateRoster } from "./forces";
import { buildTiles } from "../lib/deployment";

/**
 * 依据战场、名册快照与部署选择构建一场新战斗。
 * initial 与 live 都是独立深拷贝，回放帧永远引用本场快照属性，
 * 后续场次的升级无法回溯改写。
 */
export function buildBattleSession(
  field: Battlefield,
  roster: RosterUnit[],
  deployment: string[],
): Session {
  const azure = instantiateRoster(roster, deployment, field.azureSlots);
  const ember = createEnemies(field);
  const live: Battle = {
    tiles: buildTiles(field),
    units: [...azure, ...ember],
    round: 1,
    queue: [],
    active: "",
    ended: null,
  };
  live.queue = order(live);
  live.active = live.queue[0];
  return { initial: clone(live), live, events: [] };
}
