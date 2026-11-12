import type { Battlefield, Tile } from "../../../shared/types";
import { key } from "../../../shared/document";

/** 把战役战场的地形数组展开为 96 格 Tile */
export function buildTiles(field: Battlefield): Tile[] {
  return field.terrain.map((terrain, i) => ({
    x: i % 12,
    y: Math.floor(i / 12),
    terrain,
  }));
}

/** 部署点必须存在、不重复、且不能落在断崖（不可通行）上 */
export function validateDeployment(
  field: Battlefield,
  deployment: string[],
): { ok: true } | { ok: false; reason: string } {
  if (!deployment.length) return { ok: false, reason: "至少部署一名角色才能开战" };
  if (deployment.length > field.azureSlots.length)
    return {
      ok: false,
      reason: `本战场仅有 ${field.azureSlots.length} 个合法部署位，无法容纳 ${deployment.length} 名角色`,
    };
  const seen = new Set<string>();
  for (const id of deployment) {
    if (seen.has(id)) return { ok: false, reason: "同一名角色被重复部署" };
    seen.add(id);
  }
  const tiles = buildTiles(field);
  for (const slot of field.azureSlots.slice(0, deployment.length)) {
    const tile = tiles.find((t) => key(t) === key(slot));
    if (!tile) return { ok: false, reason: "部署点位于地图之外" };
    if (tile.terrain === "wall")
      return { ok: false, reason: `部署点 (${slot.x + 1}, ${slot.y + 1}) 被断崖占据，无法开战` };
  }
  return { ok: true };
}

/** 校验全部战场数据，仅在初始化/开发时使用 */
export function assertBattlefield(field: Battlefield) {
  if (field.terrain.length !== 96) throw new Error(`战场 ${field.name} 地形数据不完整`);
  if (field.emberSlots.length < 1) throw new Error(`战场 ${field.name} 缺少余烬军出生点`);
  const check = validateDeployment(
    field,
    field.azureSlots.map((_, i) => `slot-${i}`),
  );
  if (!check.ok) throw new Error(`战场 ${field.name}：${check.reason}`);
}
