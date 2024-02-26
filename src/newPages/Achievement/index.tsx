import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';

import AchievementTopCard from "@/newComponents/Ahievements/TopCard";
import AchievementTaskItem from "@/newComponents/Ahievements/AchievementTaskItem";

import './index.scss';

const AchievementHome = memo(() => {

  return (
    <div className="pageAchievementTaskItem">
      <AchievementTopCard></AchievementTopCard>
      <div className={"achievementTasks"}>
        <div className={"achievementTasksTitle"}>Task list</div>

        </div>
        <AchievementTaskItem/>
        <AchievementTaskItem/>
        <AchievementTaskItem/>
        <AchievementTaskItem/>
        <AchievementTaskItem/>
        <AchievementTaskItem/>
        <AchievementTaskItem/>
    </div>
  );
});

export default AchievementHome;
