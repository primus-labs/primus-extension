import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import type { UserState } from '@/types/store';
import { postMsg, getAuthUrl } from '@/utils/utils';
import { eventReport } from '@/services/api/usertracker';

type CreateAuthWindowCallBack = (
  state: string,
  source: string,
  window?: chrome.windows.Window | undefined,
  onSubmit?: () => void,
  dataType?: string
) => void;
type OauthFn = (
  source: string,
  onSubmit?: () => void,
  dataType?: string
) => void;
const useAuthorization = () => {
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [authWindowId, setAuthWindowId] = useState<number>();
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>();

  const createAuthWindowCallBack: CreateAuthWindowCallBack = useCallback(
    (state, source, res, onSubmit, dataType = 'DATASOURCE') => {
      const newWindowId = res?.id;
      setAuthWindowId(newWindowId);
      // console.log('create', newWindowId)
      const fetchIsAuthDialog = async (state: string, source: string) => {
        const { invitationCode } = await chrome.storage.local.get([
          'invitationCode',
        ]);
        postMsg(padoServicePort, {
          fullScreenType: 'padoService',
          reqMethodName: 'checkIsLogin',
          params: {
            state,
            source,
            data_type: dataType,
          },
          config: {
            extraHeader: {
              'invite-code': invitationCode,
            },
          },
        });
        console.log('page_send:checkIsLogin request');
      };
      const timer = setInterval(() => {
        fetchIsAuthDialog(state, source);
      }, 1000);
      setCheckIsAuthDialogTimer(timer);
      const removeWindowCallBack = (windowId: number) => {
        setAuthWindowId(undefined);
        windowId === newWindowId && timer && clearInterval(timer);
        padoServicePort.onMessage.removeListener(padoServicePortListener);
      };
      const padoServicePortListener = async function (message: any) {
        if (message.resMethodName === 'checkIsLogin') {
          console.log('page_get:checkIsLogin:', message.res);
          if (message.res) {
            // if (message.params?.data_type === 'DATASOURCE') {
            // console.log('remove', newWindowId)
            newWindowId &&
              chrome.windows.get(newWindowId, {}, (win) => {
                win?.id && chrome.windows.remove(newWindowId);
              });
            timer && clearInterval(timer);
            onSubmit && onSubmit();

            if (dataType === 'DATASOURCE') {
              const eventInfo = {
                eventType: 'DATA_SOURCE_INIT',
                rawData: {type: 'Social', dataSource: source},
              };
              eventReport(eventInfo);
            }
          }
          // }
        }
      };
      chrome.windows.onRemoved.addListener(removeWindowCallBack);
      padoServicePort.onMessage.addListener(padoServicePortListener);
    },
    [padoServicePort]
  );
  const handleClickOAuthSource: OauthFn = useCallback(
    async (source, onSubmit, dataType = 'DATASOURCE') => {
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
      const { invitationCode } = await chrome.storage.local.get([
        'invitationCode',
      ]);
      const authUrl = getAuthUrl({
        source,
        state,
        invitationCode,
        type: dataType,
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
        createAuthWindowCallBack(state, source, window, onSubmit, dataType);
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

export default useAuthorization;
