import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getAuthAttestation } from '@/services/api/cred';
import type { UserState } from '@/types/store';
import { postMsg, getAuthUrl } from '@/utils/utils';
import { eventReport } from '@/services/api/usertracker';
import useInterval from './useInterval';
import { BASEVENTNAME } from '@/config/constants';
import useEventDetail from './useEventDetail'
import { schemaTypeMap } from '../config/constants';
type CreateAuthWindowCallBack = (
  state: string,
  source: string,
  window?: chrome.windows.Window | undefined,
  onSubmit?: (p: any) => void,
) => void;
type OauthFn = (source: string, onSubmit?: (p: any) => void) => void;
const useAuthorization2 = () => {
  const [BASEventDetail] = useEventDetail(BASEVENTNAME);
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('fromEvents');
  const [authWindowId, setAuthWindowId] = useState<number>();
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>();
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  // const pollingResultFn = async (state: string, source: string) => {
  //   const res = await getAuthAttestation({
  //     state,
  //     source,
  //     schemaType: 'GOOGLE_ACCOUNT_OWNER',
  //     address: connectedWallet.address,
  //   });
  //   if (res.code === 0 && res.result) {
  //     // clear
  //   }
  // };
  // useInterval(pollingResultFn, 1000, pollingFlag, false);
  const createAuthWindowCallBack: CreateAuthWindowCallBack = useCallback(
    (state, source, res, onSubmit) => {
      const newWindowId = res?.id;
      setAuthWindowId(newWindowId);
      const pollingResultFn = async (state: string, source: string) => {
        const res = await getAuthAttestation({
          state,
          source,
          address: connectedWallet.address,
          schemaType:
            fromEvents === BASEVENTNAME
              ? BASEventDetail?.ext?.schemaType
              : 'GOOGLE_ACCOUNT_OWNER',
        });
        if (res.rc === 0 && res.result) {
          setAuthWindowId(undefined);
          newWindowId &&
            chrome.windows.get(newWindowId, {}, (win) => {
              win?.id && chrome.windows.remove(newWindowId);
            });
          timer && clearInterval(timer);
          onSubmit && onSubmit(res.result);
        } else {
        }
      };
      const timer = setInterval(() => {
        pollingResultFn(state, source);
      }, 1000);
      setCheckIsAuthDialogTimer(timer);
    },
    [connectedWallet?.address, BASEventDetail?.ext?.schemaType, fromEvents]
  );
  const handleClickOAuthSource: OauthFn = useCallback(
    async (source, onSubmit) => {
      // If the authorization window is open,focus on it
      if (authWindowId) {
        chrome.windows.update(authWindowId, {
          focused: true,
        });
        return;
      }
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
        createAuthWindowCallBack(
          state,
          source,
          window,
          onSubmit
        );
      });
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
