# 灰烬渡口 · 本地战役

安装：`npm ci`

本地启动：`npm run dev`，打开终端显示的地址。

类型检查：`npm run typecheck`；生产构建：`npm run build`。

Docker 启动：`docker compose up --build`，访问 http://localhost:18071。

## 本地战役（多战场连续部署）

战役由三个战场组成（灰烬渡口 → 密林哨站 → 余烬要塞），全部运算与存档在浏览器本地完成，
持久化键为 `localStorage["we001-campaign-v1"]`。

### 跨场继承

- 上一场**存活**的苍蓝军角色、经验/等级、生命与补给（恢复药剂、秘术秘卷）带入下一场；
  阵亡者名册中 `hp=0`，需在简报阶段用药剂救回才能再次部署。
- 每场开战时，参战单位由名册**深拷贝快照**实例化（`model/forces.ts`）。战后升级只改写名册，
  不会回溯修改本场 `Session.initial/live/events`，因此**每场回放永远使用当场真实属性**。
- 职业升级按职业差异化成长（`model/growth.ts`）：`power` 进入伤害公式，
  `move` 决定寻路预算，`speed` 决定先攻顺序。例如游侠每级 `move+1`，卫士偏向生命/护甲。

### 一次性结算（防重复领奖）

- 战斗进入 `ended` 时由 `syncEndState` 驱动状态机。胜利走 `applyVictory`，
  以 `state.settlement` 作为幂等标记：经验、升级、补给只在胜利确认时写入一次，
  反复打开结算页或重复结束行动都不会再次累加。
- 失败只切换到 `defeat` 阶段，**不改动名册与补给、不生成结算单**；
  「重试本战场」丢弃本场 session 回到同一节点简报，失败期间的奖励一律不带出。

### 部署预览与合法位校验

- 简报阶段预览继承名单、部署顺位与空缺位置（地图上的数字标记）。
- `lib/deployment.ts` 校验：至少 1 人、人数不超过合法部署位、无重复部署、
  部署点不在地图外或断崖上。校验不通过时禁用开战并提示，当前简报与上场结果保留。
- 刷新页面后从持久化数据恢复，回到同一战役节点（简报选择或进行中的战斗）。

### 目录

- `features/campaign/model/battlefields.ts`：三个战场的地形、部署点、奖励与敌人模板。
- `features/campaign/model/growth.ts`：经验阈值、职业成长、一次性成长结算。
- `features/campaign/model/forces.ts`：名册快照实例化、敌人生成、存活生命回写。
- `features/campaign/model/battleSession.ts`：构建单场 Session（独立深拷贝）。
- `features/campaign/lib/deployment.ts`：地图展开与部署合法性校验。
- `features/campaign/lib/store.ts`：战役状态机与全部交互动作。
- `features/campaign/lib/persistence.ts`：本地存档读写与结构校验。
- `features/campaign/ui/`：进度条、简报、结算、完成界面。
