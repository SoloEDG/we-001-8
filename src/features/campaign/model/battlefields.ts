import type { Battlefield, Profession, Terrain } from "../../../shared/types";

/** 12 × 8 网格，按行优先生成 96 格地形 */
function grid(fn: (x: number, y: number) => Terrain): Terrain[] {
  const out: Terrain[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) out.push(fn(x, y));
  return out;
}

export interface EnemyTemplate {
  name: string;
  job: Profession;
}

/** 战场 1：沿用原渡口地形，保证老玩家熟悉的第一战 */
const crossingTerrain = grid((x, y) =>
  x === 6 && y !== 3 && y !== 4
    ? "water"
    : (x === 4 && y < 3) || (x === 8 && y > 3)
      ? "forest"
      : x === 9 && y < 3
        ? "ridge"
        : x === 5 && y === 6
          ? "wall"
          : "plain",
);

/** 战场 2：密林割裂视野，哨站高地控制中路 */
const outpostTerrain = grid((x, y) => {
  if ((x === 5 && y === 3) || (x === 6 && y === 4)) return "wall";
  if (x === 2 || x === 3 || ((x === 8 || x === 9) && y > 2)) return "forest";
  if (y === 0 && (x === 5 || x === 6)) return "water";
  if (x === 10 && y === 3) return "ridge";
  return "plain";
});

/** 战场 3：要塞门廊，断崖夹住中央通道，利于排兵布阵 */
const citadelTerrain = grid((x, y) => {
  if ((x === 5 || x === 6) && (y === 2 || y === 5)) return "wall";
  if ((x === 9 && y <= 1) || (x === 2 && y >= 6)) return "ridge";
  if ((x === 3 && y <= 1) || (x === 8 && y >= 6)) return "forest";
  if (x === 2 && y === 0) return "water";
  return "plain";
});

export const BATTLEFIELDS: Battlefield[] = [
  {
    index: 0,
    name: "灰烬渡口",
    subtitle: "OPERATION 01 / 浅滩阻击",
    terrain: crossingTerrain,
    azureSlots: [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 4 },
      { x: 1, y: 6 },
      { x: 2, y: 3 },
    ],
    emberSlots: [
      { x: 10, y: 1 },
      { x: 10, y: 3 },
      { x: 9, y: 5 },
      { x: 10, y: 6 },
      { x: 11, y: 3 },
    ],
    xpReward: 90,
    tonicReward: 1,
    scrollReward: 1,
  },
  {
    index: 1,
    name: "密林哨站",
    subtitle: "OPERATION 02 / 纵深穿插",
    terrain: outpostTerrain,
    azureSlots: [
      { x: 0, y: 1 },
      { x: 0, y: 3 },
      { x: 0, y: 5 },
      { x: 1, y: 2 },
      { x: 1, y: 6 },
    ],
    emberSlots: [
      { x: 11, y: 1 },
      { x: 11, y: 3 },
      { x: 11, y: 5 },
      { x: 10, y: 2 },
      { x: 10, y: 6 },
    ],
    xpReward: 120,
    tonicReward: 1,
    scrollReward: 1,
  },
  {
    index: 2,
    name: "余烬要塞",
    subtitle: "OPERATION 03 / 最终攻夺",
    terrain: citadelTerrain,
    azureSlots: [
      { x: 0, y: 1 },
      { x: 0, y: 3 },
      { x: 0, y: 5 },
      { x: 1, y: 3 },
      { x: 1, y: 5 },
    ],
    emberSlots: [
      { x: 11, y: 1 },
      { x: 11, y: 3 },
      { x: 11, y: 5 },
      { x: 10, y: 3 },
      { x: 10, y: 5 },
    ],
    xpReward: 160,
    tonicReward: 2,
    scrollReward: 2,
  },
];

/** 各场次余烬军模板，数量逐场增加；属性缩放见 createEnemies */
export const ENEMY_TEMPLATES: EnemyTemplate[][] = [
  [
    { name: "斥候", job: "ranger" },
    { name: "铁卫", job: "guard" },
    { name: "焰使", job: "mage" },
  ],
  [
    { name: "斥候", job: "ranger" },
    { name: "铁卫", job: "guard" },
    { name: "焰使", job: "mage" },
    { name: "异端司祭", job: "medic" },
  ],
  [
    { name: "近卫长", job: "guard" },
    { name: "铁卫", job: "guard" },
    { name: "神射手", job: "ranger" },
    { name: "焰使", job: "mage" },
    { name: "异端司祭", job: "medic" },
  ],
];

export function getBattlefield(index: number): Battlefield {
  const field = BATTLEFIELDS[index];
  if (!field) throw new Error("战场节点不存在");
  return field;
}
