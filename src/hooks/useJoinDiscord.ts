import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getAuthAttestation } from '@/services/api/cred';
import type { UserState } from '@/types/store';
import { postMsg, getAuthUrl, getCurrentDate } from '@/utils/utils';
import { eventReport } from '@/services/api/usertracker';
import useInterval from './useInterval';
import { BASEVENTNAME } from '@/config/constants';
import useEventDetail from './useEventDetail';
import useAllSources from './useAllSources';
import { schemaTypeMap } from '../config/constants';
import { SocailStoreVersion } from '@/config/constants';
import { checkIsLogin } from '@/services/api/user';
import { finishTask } from '@/services/api/achievements';

type CreateAuthWindowCallBack = (
  state: string,
  source: string,
  window?: chrome.windows.Window | undefined,
  onSubmit?: (p: any) => void,
  needCheckLogin?: boolean
) => void;
type OauthFn = (source: string, onSubmit?: (p: any) => void) => void;
// connect & join discord
const DISCORDINVITEURL = 'https://discord.com/invite/K8Uqm5ww';
const useAuthorization2 = () => {
  // const { sourceMap2 } = useAllSources();
  const [allSourceList, allSourceMap] = useAllSources();
  const sourceMap2 = allSourceMap.socialSources;
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('fromEvents');
  const [authWindowId, setAuthWindowId] = useState<number>();
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>();
  const [checkIsJoinDialogTimer, setCheckIsJoinDialogTimer] = useState<any>();
  
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );

  const createAuthWindowCallBack: CreateAuthWindowCallBack = useCallback(
    (state, source, res, onSubmit, needCheckLogin) => {
      const newWindowId = res?.id;
      setAuthWindowId(newWindowId);
      let timer, joinTimer;
      chrome.windows.onRemoved.addListener((windowId) => {
        if (windowId === newWindowId) {
          if (timer) {
            // chrome.runtime.sendMessage({
            //   type: 'googleAuth',
            //   name: 'cancelAttest',
            // });
            clearInterval(timer);
            timer = null;
          }
          if (joinTimer) {
            clearInterval(joinTimer);
            joinTimer = null;
          }
        }
      });
      if (needCheckLogin) {
        const checkIsLoginFn = async (state, source) => {
          const res = await checkIsLogin({
            state: state,
            source: source,
            data_type: 'LOGIN',
          });
          const rc = res.rc;
          const result = res.result;
          if (rc === 0) {
            clearInterval(timer);
            timer = null;
            const { dataInfo, userInfo } = result;
            const lowerCaseSourceName = source.toLowerCase();
            const socialSourceData = {
              ...dataInfo,
              date: getCurrentDate(),
              timestamp: +new Date(),
              version: SocailStoreVersion,
            };
            socialSourceData.userInfo = {};
            socialSourceData.userInfo.userName = socialSourceData.userName;
            await chrome.storage.local.set({
              [lowerCaseSourceName]: JSON.stringify(socialSourceData),
            });
          }
        };
        timer = setInterval(() => {
          checkIsLoginFn(state, source);
        }, 1000);
        setCheckIsAuthDialogTimer(timer);
      }
      const pollingResultFn = async (state: string, source: string) => {
        const data = await chrome.storage.local.get(['discord']);
        console.log('222sourceMap2.discord', sourceMap2.discord, data);// delete
        if (!data.discord) {
          return;
        }
        if (timer) {
          clearInterval(timer);
        }
        const discordObj = JSON.parse(data.discord);
        let ext = {
          discordUserId: discordObj.uniqueId.replace('DISCORD_', ''),
        };
        const finishBody = {
          taskIdentifier: 'JOIN_PADO_DISCORD',
          ext: ext,
        };
        const finishCheckRsp = await finishTask(finishBody);
        if (finishCheckRsp.rc === 0) {
          // setFinished(true);
          clearInterval(joinTimer);
          // redresh score TODO
          setAuthWindowId(undefined);
          newWindowId &&
            chrome.windows.get(newWindowId, {}, (win) => {
              win?.id && chrome.windows.remove(newWindowId);
            });
          onSubmit && onSubmit(true);
        }
      };
      joinTimer = setInterval(() => {
        pollingResultFn(state, source);
      }, 1000);
      setCheckIsJoinDialogTimer(joinTimer);
    },
    [
      connectedWallet?.address,
      BASEventDetail?.ext?.schemaType,
      fromEvents,
    ]
  );
  const handleClickOAuthSource: OauthFn = useCallback(
    async (source, onSubmit) => {
      const fn = async () => {
        const state = uuidv4();
        var width = 520;
        var height = 620;
        const windowScreen: Screen = window.screen;
        var left = Math.round(windowScreen.width / 2 - width / 2);
        var top = Math.round(windowScreen.height / 2 - height / 2);
        const { userInfo } = await chrome.storage.local.get(['userInfo']);
        const parseUserInfo = JSON.parse(userInfo);
        let authUrl = getAuthUrl({
          source,
          state,
          token: parseUserInfo.token,
        });
        let needCheckLogin = false
        if (sourceMap2['discord']) {
          authUrl = DISCORDINVITEURL;
          needCheckLogin = false
        } else {
          authUrl = `${authUrl}&redirectUrl=${DISCORDINVITEURL}`;
          needCheckLogin = true;
        }
        const windowOptions: chrome.windows.CreateData = {
          url: authUrl,
          type: 'popup',
          focused: true,
          // setSelfAsOpener: false,
          top,
          left,
          width,
          height,
        };
        chrome.windows.create(windowOptions, (window) => {
          createAuthWindowCallBack(
            state,
            source,
            window,
            onSubmit,
            needCheckLogin
          );
        });
      };
      // If the authorization window is open,focus on it
      if (authWindowId) {
        try {
          chrome.windows.get(authWindowId, {}, (win) => {
            if (win?.id) {
              chrome.windows.update(authWindowId, {
                focused: true,
              });
              return;
            } else {
              fn();
              return;
            }
          });
          return;
        } catch {}
      }
      fn();
    },
    [authWindowId, createAuthWindowCallBack, sourceMap2]
  );
  useEffect(() => {
    return () => {
      checkIsAuthDialogTimer && clearInterval(checkIsAuthDialogTimer);
    };
  }, [checkIsAuthDialogTimer]);

  return handleClickOAuthSource;
};

export default useAuthorization2;
