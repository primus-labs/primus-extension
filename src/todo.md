primus-extension 无用文件清理计划

分析结论

当前路由 [src/router/index.jsx](primus-extension/src/router/index.jsx) 仅使用以下页面：





Guide (pages/Home/Home.jsx)



Layout + 子路由：Home、ZkAttestation、ComingSoon



TransactionDetail (pages/Transaction)

以下 newPages 未在路由中注册，无入口可达：





Setting、Rewards、Events、EventDetail、Achievement

删除清单

1. newPages（5 个目录，共 10 个文件）







路径



说明





src/newPages/Setting/



未在路由中





src/newPages/Rewards/



未在路由中





src/newPages/Events/



未在路由中





src/newPages/EventDetail/



未在路由中





src/newPages/Achievement/



未在路由中

2. newComponents - 独立未引用（4 个）







路径



说明





src/newComponents/new/



从未被 import





src/newComponents/Test/



从未被 import





src/newComponents/SetPwdDialog/



从未被 import（与 Settings/SettingSetPwdDialog 不同）





src/newComponents/SetAPIDialog/



从未被 import

3. newComponents - 仅被已删 newPages 引用

Settings（仅删 SettingSetPwdDialog，保留 WebComeBack）：





Settings/SettingSetPwdDialog/（含 SetPwdForm）— 仅被 Setting 使用

Rewards：





Rewards/RewardsWrapper/、Rewards/RewardCards/ — 仅被 Rewards 使用

ReferralCodeDialog：





ReferralCodeDialog/ — 未被 import

PBack：





PBack/ — 仅被 EventDetail、RewardsWrapper 使用

Events（保留 Slider，删除其余）：





Events/CurrentEvents/、Events/PastEvents/、Events/EventCards/



Events/EventQS/、Events/EventBrief/、Events/EventTaskList/



Events/SocialTasksDialog/、Events/AttestationTasks/、Events/AttestationTasksDialog/



Events/Slider 保留：被 newPages/Home 与 newPages/ZkAttestation 引用

Ahievements（保留 ShareComponent，删除其余）：





Ahievements/Banner/、Ahievements/TopCard/（含 ShareButton）



Ahievements/AchievementTaskItem/、Ahievements/AchievementRewardHistory/



Ahievements/ReferralCodeInput/、Ahievements/PageSelect/



Ahievements/ShareComponent 保留：被 ZkAttestation/AttestationCards 引用（AttestationCards 在路由可达的 ZkAttestation 中使用）

不删除项





pages/：全部保留（Home、Transaction、Background 均有使用）



newComponents/Nav：被 Layout/Sidebar 引用



newComponents/Settings/WebComeBack：被 newPages/Home 引用



newComponents/Events/Slider：被 Home、ZkAttestation 引用



newComponents/Ahievements/ShareComponent：被 AttestationCards 引用

执行步骤





删除 5 个 newPages 目录



删除上述 newComponents 目录/文件



运行 npm run build 验证

