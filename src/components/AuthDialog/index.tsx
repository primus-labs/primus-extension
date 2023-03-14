import React, {useState, useEffect, useCallback} from 'react';
import { v4 as uuidv4 } from 'uuid';
import PHeader from '@/components/PHeader'
import './index.sass'
import rightArrow from '@/assets/img/rightArrow.svg';
import {getAllOAuthSources, checkIsLogin} from '@/services/user'
import type { AuthSourcesItem, AuthSourcesItems } from '@/services/user';




const onMessage: typeof chrome.runtime.onMessage.addListener = () => {
   //...code
}
interface authDialogProps {
  onSubmit: () => void
}
type WindowState = 'normal' | 'minimized' | 'maximized'| 'fullscreen'| 'locked-fullscreen'
type WindowType = 'normal' | 'popup'
type WindowCreateData = {
  focused?: boolean;
  height?: number;
  width?: number;
  top?: number;
  left?: number;
  incognito?: boolean;
  setSelfAsOpener?: boolean;
  tabId?: number;
  state?: WindowState;
  type?: WindowType;
  url?:string | string[];
}

const Login: React.FC<authDialogProps> = ({onSubmit}) => {
  const EXTENSION_CONTEXT_INVALIDATED_CHROMIUM_ERROR =
  'Extension context invalidated.';
const WORKER_KEEP_ALIVE_INTERVAL = 1000;
const ACK_KEEP_ALIVE_MESSAGE = 'ACK_KEEP_ALIVE_MESSAGE';
const WORKER_KEEP_ALIVE_MESSAGE = 'WORKER_KEEP_ALIVE_MESSAGE';
const TIME_45_MIN_IN_MS = 45 * 60 * 1000;
let keepAliveInterval: any;
let keepAliveTimer: any;

  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>([])
  const [userState, setUserState] = useState()
  const [userSource, setUserSource] = useState<string>()
  const [newWindowId, setNewWindowId] = useState<number>()
  const [padoServicePort, setPadoServicePort] = useState<any>()
  console.log('auth======padoServicePort', padoServicePort)
  const handleClickNext = () => {
    onSubmit()
  }
  const fetchGetAllOAuthSources = async () => {
    padoServicePort.onMessage.addListener(async function(message:any){
      switch (message.resMethodName) {
        case "getAllOAuthSources":
          console.log("page_get:getAllOAuthSources:", message.res);
          setOAuthSources(message.res)
          break;
        case ACK_KEEP_ALIVE_MESSAGE:
          console.log("page_get:", message.resMethodName);
          break;
        default:
          break;
      }
    })
    padoServicePort.postMessage({
      reqMethodName: 'getAllOAuthSources',
    })
    console.log("page_send:getAllOAuthSources request");
  }
  const fetchIsLogin = async () => {
    padoServicePort.postMessage({
      reqMethodName: 'checkIsLogin',
      params: {
        state: userState
      }
    })
  }
  
  const handleClickOAuthSource = (source:string) => {
    const state = uuidv4()
    setUserState(state)
    setUserSource(source)
    // const { source, state } = message.params
    
  }
  const handleAuth = () => {
    const windowOptions:chrome.windows.CreateData = {
      url:`https://18.179.8.186:8081/public/render/${userSource}?state=${userState}`,
      // state: 'minimized',
      type:'popup',
      // top: parseInt(screen.availHeight/4),
      // left: parseInt(screen.availWidth/3),
      // width: screen.availWidth/3,
      // height: screen.availHeight/2
    }
    const createWindowCallBack:(window?: chrome.windows.Window | undefined) => void = res => {
      console.log('授权Url:', windowOptions.url)
      const newWindowId = res?.id
      newWindowId && setNewWindowId(newWindowId)
      const fetchCheckIsLogin = () => {
        padoServicePort.postMessage({
          reqMethodName: 'checkIsLogin',
          params: {
            state: userState
          }
        })
        console.log("page_send:checkIsLogin request", userState);
      }
      padoServicePort.onMessage.addListener(async function(message:any){
        switch (message.resMethodName) {
          case "checkIsLogin":
            console.log("page_get:checkIsLogin:", message.res);
            if (message.res.rc === 0) {
              newWindowId && chrome.windows.remove(newWindowId)
              onSubmit()
            } else {
              fetchCheckIsLogin()
            }
            break;
          default:
            break;
        }
      })
      fetchCheckIsLogin()
    }
    chrome.windows.create(windowOptions, createWindowCallBack)
  }
  

  useEffect(() => {
    setPadoServicePort(chrome.runtime.connect({name:"padoService"}))
    
  }, [])
  useEffect(() => {
    if(padoServicePort ){
      runWorkerKeepAliveInterval();
      // padoServicePort.onMessage.addListener(padoServicePortMsgListener)
      fetchGetAllOAuthSources()
    }
  }, [padoServicePort])
  useEffect(() => {
    if(userState && userSource ){
      handleAuth()
    }
  }, [userState, userSource])
  const sendMessageWorkerKeepAlive = () => {
    padoServicePort.postMessage({ reqMethodName: WORKER_KEEP_ALIVE_MESSAGE })
      // .catch((e) => {
      //   e.message === EXTENSION_CONTEXT_INVALIDATED_CHROMIUM_ERROR
      //     ? console.error(`Please refresh the page. PADO: ${e}`)
      //     : console.error(`PADO: ${e}`);
      // });
      console.log("page_send:", WORKER_KEEP_ALIVE_MESSAGE);
  };
  const runWorkerKeepAliveInterval = () => {
    clearTimeout(keepAliveTimer);
    keepAliveTimer = setTimeout(() => {
      clearInterval(keepAliveInterval);
    }, TIME_45_MIN_IN_MS);
    clearInterval(keepAliveInterval);
    sendMessageWorkerKeepAlive();
    keepAliveInterval = setInterval(() => {
      if (padoServicePort) {
        sendMessageWorkerKeepAlive();
      }
    }, WORKER_KEEP_ALIVE_INTERVAL);
  };
  return (
      <div className="pDialog authDialog">
        <PHeader/>
        <main>
          <h1>Sign up</h1>
          <ul className="licensorList">
            {oAuthSources && oAuthSources.map((item:AuthSourcesItem) => {
              return (<li key={item.id} className="licensorItem" onClick={() => {handleClickOAuthSource(item.name)}}>
                <img src={item.logoUrl} alt={item.name} />
              </li>)
            })}
          </ul>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>Next</span>
          <img src={rightArrow} alt="right arrow" /></button>
      </div>
  );
};

export default Login;
