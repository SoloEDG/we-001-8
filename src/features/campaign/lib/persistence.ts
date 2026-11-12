import type { CampaignState, RosterUnit } from "../../../shared/types";
import { assertBattle } from "../../../shared/document";
import { BATTLEFIELDS } from "../model/battlefields";
import { initialRoster } from "../model/growth";

const STORAGE_KEY = "we001-campaign-v1";

export function createCampaign(): CampaignState {
  return {
    version: 1,
    phase: "briefing",
    stageIndex: 0,
    roster: initialRoster(),
    supplies: { tonic: 1, scroll: 0 },
    deployment: [],
    session: null,
    settlement: null,
    cleared: [],
  };
}

function isRosterUnit(u: unknown): u is RosterUnit {
  const r = u as RosterUnit;
  return (
    !!r &&
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.level === "number" &&
    typeof r.hp === "number" &&
    typeof r.maxHp === "number"
  );
}

/** 校验持久化数据；任一结构不合法则返回 null，由调用方开新战役 */
export function loadCampaign(): CampaignState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CampaignState;
    if (c.version !== 1 || !Array.isArray(c.roster) || !c.roster.every(isRosterUnit))
      return null;
    if (
      typeof c.stageIndex !== "number" ||
      c.stageIndex < 0 ||
      c.stageIndex >= BATTLEFIELDS.length
    )
      return null;
    if (
      !["briefing", "fighting", "victory", "defeat", "complete"].includes(
        c.phase,
      )
    )
      return null;
    if (c.phase === "fighting") {
      if (!c.session) return null;
      assertBattle(c.session.live);
      assertBattle(c.session.initial);
      if (!Array.isArray(c.session.events)) return null;
    }
    return c;
  } catch {
    return null;
  }
}

export function saveCampaign(c: CampaignState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function clearCampaign() {
  localStorage.removeItem(STORAGE_KEY);
}
