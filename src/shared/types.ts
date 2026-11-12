export type Terrain = "plain" | "forest" | "water" | "ridge" | "wall";
export type Profession = "guard" | "ranger" | "mage" | "medic";
export interface Point {
  x: number;
  y: number;
}
export interface Tile extends Point {
  terrain: Terrain;
}
export interface Status {
  kind: "slow" | "burn" | "guard";
  turns: number;
}
export interface Unit extends Point {
  id: string;
  name: string;
  job: Profession;
  team: "azure" | "ember";
  hp: number;
  maxHp: number;
  power: number;
  armor: number;
  speed: number;
  move: number;
  level: number;
  xp: number;
  statuses: Status[];
  moved: boolean;
  acted: boolean;
}
export interface Battle {
  tiles: Tile[];
  units: Unit[];
  round: number;
  queue: string[];
  active: string;
  ended: string | null;
}
export type EventKind = "move" | "skill" | "wait" | "terrain";
export interface BattleEvent {
  id: number;
  kind: EventKind;
  actor: string;
  label: string;
  path: Point[];
  before: Battle;
  after: Battle;
}
export interface Session {
  initial: Battle;
  live: Battle;
  events: BattleEvent[];
}
export interface Skill {
  id: string;
  name: string;
  range: number;
  power: number;
  target: "enemy" | "ally" | "self";
  status?: Status["kind"];
  description: string;
}

/** 战役持久化结构 ---------------------------------------------------- */
export type CampaignPhase =
  | "briefing"
  | "fighting"
  | "victory"
  | "defeat"
  | "complete";
export type SupplyKind = "tonic" | "scroll";
/** 补给库存：药剂恢复存活角色生命，秘卷直接转化为经验 */
export type Supplies = Record<SupplyKind, number>;
/** 跨场继承的苍蓝军角色（余烬军按场次重新生成，不进名册） */
export interface RosterUnit {
  id: string;
  name: string;
  job: Profession;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  power: number;
  armor: number;
  speed: number;
  move: number;
}
/** 单场成长结算结果，仅在胜利确认时生成一次 */
export interface GrowthEntry {
  unitId: string;
  name: string;
  xpGained: number;
  levelsGained: number;
}
export interface Settlement {
  stageIndex: number;
  tonicReward: number;
  scrollReward: number;
  entries: GrowthEntry[];
}
export interface Battlefield {
  index: number;
  name: string;
  subtitle: string;
  /** 地形生成函数名对应的数据，直接存 96 格地形，保证回放与场次解耦 */
  terrain: Terrain[];
  /** 苍蓝军合法部署点（最多可投入的存活角色数） */
  azureSlots: Point[];
  /** 余烬军出生点 */
  emberSlots: Point[];
  xpReward: number;
  tonicReward: number;
  scrollReward: number;
}
export interface CampaignState {
  version: 1;
  phase: CampaignPhase;
  stageIndex: number;
  roster: RosterUnit[];
  supplies: Supplies;
  /** 当前场次的部署选择（briefing 阶段编辑） */
  deployment: string[];
  /** 战斗中的场次快照；非战斗阶段为 null */
  session: Session | null;
  /** 最近一次胜利结算，重复打开结算页不会再次累加 */
  settlement: Settlement | null;
  /** 已完成场次的摘要，用于战役进度展示 */
  cleared: { stageIndex: number; name: string }[];
}
