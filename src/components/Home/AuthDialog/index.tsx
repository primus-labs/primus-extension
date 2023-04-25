import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { connect } from 'react-redux'
import type { AuthSourcesItem, AuthSourcesItems } from '@/services/user';
import PHeader from '@/components/PHeader'

import PMask from '@/components/PMask'
import rightArrow from '@/assets/img/rightArrow.svg';
import './index.sass'

interface authDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  padoServicePort: chrome.runtime.Port;
}

const AuthDialog: React.FC<authDialogProps> = ({ onClose, onSubmit, padoServicePort }) => {
  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>([])
  const [activeSource, setActiveSource] = useState<string>()
  const [authWindowId, setAuthWindowId] = useState<number>()
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>()
  const handleClickNext = () => {
    // onSubmit()// TODO
  }
  const fetchAllOAuthSources = () => {
    padoServicePort.postMessage({
      fullScreenType: 'padoService',
      reqMethodName: 'getAllOAuthSources',
    })
    console.log("page_send:getAllOAuthSources request");
  }
  const getAllOAuthSources = async () => {
    const padoServicePortListener = async function (message: any) {
      if (message.resMethodName === 'getAllOAuthSources') {
        console.log("page_get:getAllOAuthSources:", message.res);
        setOAuthSources(message.res)
      }
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)
    fetchAllOAuthSources()
  }
  const fetchIsAuthDialog = (state: string, source: string) => {
    padoServicePort.postMessage({
      fullScreenType: 'padoService',
      reqMethodName: 'checkIsLogin',
      params: {
        state,
        source,
        data_type: 'LOGIN'
      }
    })
    console.log("page_send:checkIsLogin request");
  }
  const createAuthWindowCallBack: (state: string, source: string, window?: chrome.windows.Window | undefined) => void = (state, source, res) => {
    const newWindowId = res?.id
    setAuthWindowId(newWindowId)
    // console.log('create', newWindowId)
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
          // console.log('remove', newWindowId)
          newWindowId && chrome.windows.get(
            newWindowId,
            {},
            (win) => {
              win?.id && chrome.windows.remove(newWindowId)
            },
          )
          timer && clearInterval(timer)
          onSubmit()
        }
      }
    }
    chrome.windows.onRemoved.addListener(removeWindowCallBack)
    padoServicePort.onMessage.addListener(padoServicePortListener)
  }
  const handleClickOAuthSource = (source: string) => {
    setActiveSource(source)
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
    chrome.windows.create(windowOptions, (window) => { createAuthWindowCallBack(state, source, window) })
  }

  useEffect(() => {
    padoServicePort && getAllOAuthSources()
  }, [padoServicePort])
  useEffect(() => {
    return () => {
      checkIsAuthDialogTimer && clearInterval(checkIsAuthDialogTimer)
    }
  }, [checkIsAuthDialogTimer])

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog authDialog">
        <main>
          <PHeader />
          <h1>Sign up</h1>
          <ul className="licensorList">
            {oAuthSources.map((item: AuthSourcesItem) => {
              return (<li key={item.id} className={
                    item.name==='GOOGLE'?
                    "licensorItem":
                      "licensorItem disabled"
                  } onClick={() => { handleClickOAuthSource(item.name) }}>
                <img src={item.logoUrl} alt={item.name} />
              </li>)
            })}
          </ul>
        </main>
        <button className="nextBtn authDialogNextBtn" onClick={handleClickNext}>
          <span>Next</span>
          <img src={rightArrow} alt="right arrow" /></button>
      </div>
    </PMask>


  );
};

export default connect(({ padoServicePort }) => ({ padoServicePort }), {})(AuthDialog);
