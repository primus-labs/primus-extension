import request from '@/utils/request';

export const getAchievementTaskList =  async (size: number, page: number) => {
    return await request({
        method: "get",
        url: `/achievement/tasks?size=${size}&page=${page}`,
    });
}