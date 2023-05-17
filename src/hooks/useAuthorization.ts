import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid';
import type { UserState } from '@/store/reducers'
import {postMsg} from '@/utils/utils'
const useAuthorization = () => {
  const padoServicePort = useSelector((state: UserState) => state.padoServicePort)
  const [authWindowId, setAuthWindowId] = useState<number>()
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>()

  const createAuthWindowCallBack: (state: string, source: string, window?: chrome.windows.Window | undefined, onSubmit?:()=>void) => void
    = useCallback((state, source, res, onSubmit) => {
      const newWindowId = res?.id
      setAuthWindowId(newWindowId)
      // console.log('create', newWindowId)
      const fetchIsAuthDialog = (state: string, source: string) => {
        postMsg(padoServicePort, {
          fullScreenType: 'padoService',
          reqMethodName: 'checkIsLogin',
          params: {
            state,
            source,
            data_type: 'DATASOURCE'
          }
        })
        console.log("page_send:checkIsLogin request");
      }
      const timer = setInterval(() => { fetchIsAuthDialog(state, source) }, 1000)
      setCheckIsAuthDialogTimer(timer)
      const removeWindowCallBack = (windowId: number) => {
        setAuthWindowId(undefined)
        windowId === newWindowId && timer && clearInterval(timer)
        padoServicePort.onMessage.removeListener(padoServicePortListener)
      }
      const padoServicePortListener = async function (message: any) {
        if (message.resMethodName === 'checkIsLogin') {
          console.log("page_get:checkIsLogin:", message.res);
          if (message.res) {
            if (message.params?.data_type === 'DATASOURCE') {
              // console.log('remove', newWindowId)
              newWindowId && chrome.windows.get(
                newWindowId,
                {},
                (win) => {
                  win?.id && chrome.windows.remove(newWindowId)
                },
              )
              timer && clearInterval(timer)
              onSubmit && onSubmit()
            }
          }
        }
      }
      chrome.windows.onRemoved.addListener(removeWindowCallBack)
      padoServicePort.onMessage.addListener(padoServicePortListener)
    }, [ padoServicePort])
  const handleClickOAuthSource = useCallback((source: string,onSubmit?:() => void) => {
    // If the authorization window is open,focus on it
    if (authWindowId) {
      chrome.windows.update(
        authWindowId,
        {
          focused: true
        }
      )
      return
    }
    const state = uuidv4()
    var width = 520;
    var height = 620;
    const windowScreen: Screen = window.screen
    var left = Math.round((windowScreen.width / 2) - (width / 2));
    var top = Math.round((windowScreen.height / 2) - (height / 2));
    const windowOptions: chrome.windows.CreateData = {
      url: `https://18.179.8.186:8081/public/render/${source}?state=${state}`,
      type: 'popup',
      focused: true,
      // setSelfAsOpener: false,
      top,
      left,
      width,
      height
    }
    chrome.windows.create(windowOptions, (window) => { createAuthWindowCallBack(state, source, window,onSubmit) })
  }, [authWindowId, createAuthWindowCallBack])

  useEffect(() => {
    return () => {
      checkIsAuthDialogTimer && clearInterval(checkIsAuthDialogTimer)
    }
  }, [checkIsAuthDialogTimer])

  return handleClickOAuthSource
}

export default useAuthorization