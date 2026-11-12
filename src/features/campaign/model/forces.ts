import type { Battlefield, RosterUnit, Unit } from "../../../shared/types";
import { professions } from "../../roster/model/professions";
import { ENEMY_TEMPLATES } from "./battlefields";

/**
 * 用名册快照生成苍蓝军参战单位。
 * 关键：复制的是"开战时"的属性，之后升级只改名册，不会改写本场回放。
 */
export function instantiateRoster(
  roster: RosterUnit[],
  deployment: string[],
  slots: { x: number; y: number }[],
): Unit[] {
  return deployment.map((id, i) => {
    const r = roster.find((u) => u.id === id);
    if (!r) throw new Error(`名册中不存在角色 ${id}`);
    const slot = slots[i];
    if (!slot) throw new Error("部署位不足");
    return {
      id: r.id,
      name: r.name,
      job: r.job,
      team: "azure",
      x: slot.x,
      y: slot.y,
      hp: r.hp,
      maxHp: r.maxHp,
      power: r.power,
      armor: r.armor,
      speed: r.speed,
      move: r.move,
      level: r.level,
      xp: r.xp,
      statuses: [],
      moved: false,
      acted: false,
    };
  });
}

/** 余烬军随场次变强：等级 = 1 + 场次索引，属性按职业基础值缩放 */
export function createEnemies(field: Battlefield): Unit[] {
  const templates = ENEMY_TEMPLATES[field.index];
  const enemyLevel = 1 + field.index;
  return templates.map((t, i) => {
    const slot = field.emberSlots[i];
    if (!slot) throw new Error("余烬军出生点不足");
    const base = professions[t.job];
    const step = enemyLevel - 1;
    return {
      id: `e${field.index + 1}-${i + 1}`,
      name: t.name,
      job: t.job,
      team: "ember",
      x: slot.x,
      y: slot.y,
      hp: base.hp + 4 * step,
      maxHp: base.hp + 4 * step,
      power: base.power + Math.round(base.power * 0.18 * step) + step,
      armor: base.armor + (t.job === "guard" ? step : 0),
      speed: base.speed,
      move: base.move,
      level: enemyLevel,
      xp: 0,
      statuses: [],
      moved: false,
      acted: false,
    };
  });
}

/** 战斗结束后把存活角色的当前生命写回名册（阵亡者保持 hp=0，等待药剂救治） */
export function syncSurvivors(roster: RosterUnit[], units: Unit[]) {
  for (const r of roster) {
    const u = units.find((v) => v.id === r.id);
    if (!u) continue;
    r.hp = u.hp; // 0 表示本场阵亡；>0 为带伤存活
  }
}
