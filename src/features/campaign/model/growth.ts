import type { GrowthEntry, Profession, RosterUnit, Unit } from "../../../shared/types";
import { professions } from "../../roster/model/professions";

/** 升至下一级所需经验，随等级缓慢提高 */
export const xpForNext = (level: number) => 50 + (level - 1) * 35;

/**
 * 各职业每级的属性成长方向。
 * power 直接进入伤害公式；move 决定寻路预算；speed 决定先攻顺序。
 */
const GROWTH: Record<
  Profession,
  { hp: number; power: number; armor: number; speed: number; move: number }
> = {
  guard: { hp: 6, power: 2, armor: 1, speed: 1, move: 0 },
  ranger: { hp: 3, power: 2, armor: 0, speed: 2, move: 1 },
  mage: { hp: 2, power: 3, armor: 0, speed: 1, move: 0 },
  medic: { hp: 4, power: 1, armor: 1, speed: 1, move: 1 },
};

/** 把一次经验奖励计入名册角色，返回升级次数（原地修改） */
export function grantXp(r: RosterUnit, xp: number): number {
  r.xp += xp;
  let levels = 0;
  while (r.xp >= xpForNext(r.level) && r.level < 10) {
    r.xp -= xpForNext(r.level);
    levelUp(r);
    levels++;
  }
  return levels;
}

function levelUp(r: RosterUnit) {
  const g = GROWTH[r.job];
  r.level++;
  r.maxHp += g.hp;
  r.power += g.power;
  r.armor += g.armor;
  r.speed += g.speed;
  r.move += g.move;
  // 升级休整：新上限的一部分转化为当前生命，但不超过上限
  r.hp = Math.min(r.maxHp, r.hp + Math.ceil(g.hp / 2) + 4);
}

/** 胜利时对所有存活角色一次性结算经验与升级 */
export function settleGrowth(
  roster: RosterUnit[],
  survivors: Unit[],
  fieldXp: number,
): GrowthEntry[] {
  const alive = new Set(survivors.filter((u) => u.team === "azure").map((u) => u.id));
  const entries: GrowthEntry[] = [];
  for (const r of roster) {
    if (!alive.has(r.id)) continue;
    const xpGained = fieldXp;
    const levelsGained = grantXp(r, xpGained);
    entries.push({ unitId: r.id, name: r.name, xpGained, levelsGained });
  }
  return entries;
}

/** 新建战役的初始苍蓝军名册（1 级，职业基础属性） */
export function initialRoster(): RosterUnit[] {
  const defs: [string, string, Profession][] = [
    ["a1", "凛", "ranger"],
    ["a2", "铎", "guard"],
    ["a3", "诺亚", "mage"],
    ["a4", "芙", "medic"],
  ];
  return defs.map(([id, name, job]) => {
    const base = professions[job];
    return {
      id,
      name,
      job,
      level: 1,
      xp: 0,
      hp: base.hp,
      maxHp: base.hp,
      power: base.power,
      armor: base.armor,
      speed: base.speed,
      move: base.move,
    };
  });
}
