import request from '@/utils/request';

export const getAchievementTaskList = async (size: number, page: number) => {
  return await request({
    method: 'get',
    url: `/achievement/tasks?size=${size}&page=${page}`,
  });
};

export const getUserInfo = async () => {
  return await request({
    method: 'get',
    url: `/users/info`,
  });
};

export const getAchievementClaimed = async (size, page) => {
  return await request({
    method: 'get',
    url: `/achievement/claimed?size=${size}&page=${page}`,
  });
};

export const finishTask = async (data) => {
  return await request({
    method: 'post',
    url: '/achievement/complete',
    data: data,
  });
};
export const finishTaskForEvent = async (data) => {
  return await request({
    method: 'get',
    url: `/public/discord/check/joined?discordUserId=${data.discordUserId}`,
  });
};

export const taskStatusCheck = async (tasks) => {
  return await request({
    method: 'get',
    url: '/achievement/check?tasks=' + tasks,
  });
};

export const shareTwitter = async (data) => {
  return await request({
    method: 'post',
    url: '/media/share/twitter',
    data: data,
  });
};

export const shareTelegram = async (data) => {
  return await request({
    method: 'post',
    url: '/media/share/telegram',
    data: data,
  });
};

export const shareDiscord = async (data) => {
  return await request({
    method: 'post',
    url: '/media/share/discord',
    data: data,
  });
};

export const checkHasFinishJoinDiscord = async (discordId: string) => {
  const queryStr = discordId ? `discordUserId=${discordId}` : '';
  return await request({
    method: 'get',
    url: `/achievement/discord/gm/check?${queryStr}`,
  });
};
