import { parseCookie } from '../utils/utils';
export const lumaAccountTemplateId = '94a214f4-c6bc-4186-bb39-cd2da2b95819';
export const lumaAccountTemplateReg =
  'https://api2.luma.com/home/get-events?.*';
export const lumaAccountTargetJumpUrlPrefix = `https://luma.com/user/`;

export const getUserIdFromCookie = (cookieStr) => {
  const cookieObj = parseCookie(cookieStr);
  const userId = cookieObj['luma.auth-session-key']?.split('.')[0];
  return userId;
};
export const getLumaAccountTargetJumpUrl = (userId) => {
  return `${lumaAccountTargetJumpUrlPrefix}${userId}`;
};
