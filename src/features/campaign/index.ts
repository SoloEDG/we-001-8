export { useCampaignStore } from "./lib/store";
export {
  BATTLEFIELDS,
  ENEMY_TEMPLATES,
  getBattlefield,
} from "./model/battlefields";
export { buildBattleSession } from "./model/battleSession";
export { xpForNext } from "./model/growth";
export {
  validateDeployment,
  buildTiles,
} from "./lib/deployment";
export {
  createCampaign,
  loadCampaign,
  saveCampaign,
  clearCampaign,
} from "./lib/persistence";
export { default as CampaignBriefing } from "./ui/CampaignBriefing.vue";
export { default as SettlementPanel } from "./ui/SettlementPanel.vue";
export { default as CampaignProgress } from "./ui/CampaignProgress.vue";
export { default as CampaignComplete } from "./ui/CampaignComplete.vue";
