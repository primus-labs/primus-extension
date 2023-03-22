import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { connect } from 'react-redux'
import type { AuthSourcesItem, AuthSourcesItems } from '@/services/user';
import PHeader from '@/components/PHeader'
import rightArrow from '@/assets/img/rightArrow.svg';
import './index.sass'

interface authDialogProps {
  onSubmit: () => void,
  padoServicePort: chrome.runtime.Port
}

const AuthDialog: React.FC<authDialogProps> = ({ onSubmit, padoServicePort }) => {
  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>([])
  const [authWindowId, setAuthWindowId] = useState<number>()
  const [checkIsAuthDialogTimer, setCheckIsAuthDialogTimer] = useState<any>()
  const handleClickNext = () => {
    // onSubmit()// TODO
  }
  const fetchAllOAuthSources = () => {
    padoServicePort.postMessage({
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
  const fetchIsAuthDialog = (state: string) => {
    padoServicePort.postMessage({
      reqMethodName: 'checkIsLogin',
      params: {
        state
      }
    })
    console.log("page_send:checkIsLogin request");
  }
  const createAuthWindowCallBack: (state: string, window?: chrome.windows.Window | undefined) => void = (state, res) => {
    const newWindowId = res?.id
    setAuthWindowId(newWindowId)
    // console.log('create', newWindowId)
    const timer = setInterval(() => { fetchIsAuthDialog(state) }, 1000)
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
    chrome.windows.create(windowOptions, (window) => { createAuthWindowCallBack(state, window) })
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
    <div className="pDialog authDialog">
      <PHeader />
      <main>
        <h1>Sign up</h1>
        <ul className="licensorList">
          {oAuthSources.map((item: AuthSourcesItem) => {
            return (<li key={item.id} className="licensorItem" onClick={() => { handleClickOAuthSource(item.name) }}>
              <img src={item.logoUrl} alt={item.name} />
            </li>)
          })}
        </ul>
      </main>
      <button className="nextBtn authDialogNextBtn" onClick={handleClickNext}>
        <span>Next</span>
        <img src={rightArrow} alt="right arrow" /></button>
    </div>
  );
};

export default connect((store) => store, {})(AuthDialog);
