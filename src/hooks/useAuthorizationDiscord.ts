import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { setSocialSourcesAsync } from '@/store/actions';
import { getAuthAttestation } from '@/services/api/cred';
import type { UserState } from '@/types/store';
import { getCurrentDate, postMsg, sub, getAuthUrl } from '@/utils/utils';
import { eventReport } from '@/services/api/usertracker';
import { checkIsLogin } from '@/services/api/user';
import useInterval from './useInterval';
import { BASEVENTNAME } from '@/config/events';
import useEventDetail from './useEventDetail';
import { SocailStoreVersion } from '@/config/constants';
import type { Dispatch } from 'react';
type CreateAuthWindowCallBack = (
  state: string,
  source: string,
  window?: chrome.windows.Window | undefined,
  onSubmit?: (p: any) => void
) => void;
type OauthFn = (source: string, onSubmit?: (p: any) => void) => void;
// create discord account attestation
const useAuthorization2 = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('id');
  const [authWindowId, setAuthWindowId] = useState<number>();
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>();
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const createAuthWindowCallBack: CreateAuthWindowCallBack = useCallback(
    (state, source, res, onSubmit) => {
      const newWindowId = res?.id;
      setAuthWindowId(newWindowId);
      chrome.windows.onRemoved.addListener((windowId) => {
        if (windowId === newWindowId) {
          if (timer) {
            chrome.runtime.sendMessage({
              type: 'googleAuth',
              name: 'cancelAttest',
            });
            clearInterval(timer);
            timer = null;
          }
        }
      });

      const pollingResultFn = async (state: string, source: string) => {
        const res = await getAuthAttestation({
          state,
          source,
          address: connectedWallet.address,
          schemaType: 'DISCORD_ACCOUNT_OWNER',
        });
        if (res.rc === 0 && res.result) {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          const fn = () => {
            setAuthWindowId(undefined);
            newWindowId &&
              chrome.windows.get(newWindowId, {}, (win) => {
                win?.id && chrome.windows.remove(newWindowId);
              });
            onSubmit && onSubmit(res.result);
          };
          const lowerCaseSourceName = source.toLowerCase();
          const storeRes = await chrome.storage.local.get([
            lowerCaseSourceName,
          ]);
          if (storeRes[lowerCaseSourceName]) {
            fn();
          } else {
            const fetchRes = await checkIsLogin({
              state,
              source,
            });
            const { rc, result, mc } = fetchRes;
            if (rc === 0) {
              const { dataInfo, userInfo } = result;
              let storageRes = await chrome.storage.local.get(
                lowerCaseSourceName
              );
              const lastData = storageRes[lowerCaseSourceName];
              let pnl: any = null;
              if (lastData) {
                const lastTotalBal = JSON.parse(lastData).followers;
                pnl = sub(dataInfo.followers, lastTotalBal).toFixed();
              }
              if (pnl !== null && pnl !== undefined) {
                dataInfo.pnl = pnl;
              }

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
              dispatch(setSocialSourcesAsync());

              const eventInfo = {
                eventType: 'DATA_SOURCE_INIT',
                rawData: { type: 'Social', dataSource: source },
              };
              eventReport(eventInfo);
              fn();
            } else {
            }
          }
        } else {
        }
      };
      let timer: any = setInterval(() => {
        pollingResultFn(state, source);
      }, 1000);
      setCheckIsAuthDialogTimer(timer);
    },
    [
      connectedWallet?.address,
      BASEventDetail?.ext?.schemaType,
      fromEvents,
      dispatch,
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
        const authUrl = getAuthUrl({
          source,
          state,
          token: parseUserInfo.token,
        });

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
          createAuthWindowCallBack(state, source, window, onSubmit);
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
    [authWindowId, createAuthWindowCallBack]
  );
  useEffect(() => {
    return () => {
      checkIsAuthDialogTimer && clearInterval(checkIsAuthDialogTimer);
    };
  }, [checkIsAuthDialogTimer]);

  return handleClickOAuthSource;
};

export default useAuthorization2;
