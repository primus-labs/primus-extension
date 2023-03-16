import React, {useState, useEffect} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AuthSourcesItem, AuthSourcesItems } from '@/services/user';
import PHeader from '@/components/PHeader'
import rightArrow from '@/assets/img/rightArrow.svg';
import './index.sass'

interface authDialogProps {
  onSubmit: () => void
}

const AuthDialog: React.FC<authDialogProps> = ({onSubmit}) => {
  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>([])
  const [authWindowId, setAuthWindowId] = useState<number>()
  const [padoServicePort, setPadoServicePort] = useState<any>()
  console.log('auth======padoServicePort', padoServicePort)

  const handleClickNext = () => {
    onSubmit()// TODO
  }
  const fetchAllOAuthSources = () => {
    padoServicePort.postMessage({
      reqMethodName: 'getAllOAuthSources',
    })
    console.log("page_send:getAllOAuthSources request");
  }
  const getAllOAuthSources = async () => {
    const padoServicePortListener = async function(message:any){
      if(message.resMethodName === 'getAllOAuthSources') {
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
  const createAuthWindowCallBack:(state: string, window?: chrome.windows.Window | undefined) => void = (state, res) => {
    const newWindowId = res?.id
    setAuthWindowId(newWindowId)
    const checkIsAuthDialogTimer = setInterval(() => {fetchIsAuthDialog(state)}, 1000)
    const removeWindowCallBack = (windowId: number) => {
      windowId === newWindowId && checkIsAuthDialogTimer && clearInterval(checkIsAuthDialogTimer)
    } 
    const padoServicePortListener = async function(message:any){
      if( message.resMethodName === 'checkIsLogin') {
        console.log("page_get:checkIsLogin:", message.res);
        if (message.res) {
          newWindowId && chrome.windows.remove(newWindowId)
          checkIsAuthDialogTimer && clearInterval(checkIsAuthDialogTimer)
          onSubmit()
        }
      }
    }
    chrome.windows.onRemoved.addListener(removeWindowCallBack)
    padoServicePort.onMessage.addListener(padoServicePortListener)
  }
  const handleClickOAuthSource = (source:string) => {
    // If the authorization window is open,focus on it
    if ( authWindowId ) {
      chrome.windows.update(
        authWindowId,
        {
          focused: true
        }
      )
      return 
    }
    const state = uuidv4()
    const windowOptions:chrome.windows.CreateData = {
      url:`https://18.179.8.186:8081/public/render/${source}?state=${state}`,
      // state: 'minimized',
      type:'popup',
      // top: parseInt(screen.availHeight/4),
      // left: parseInt(screen.availWidth/3),
      // width: screen.availWidth/3,
      // height: screen.availHeight/2
    }
    chrome.windows.create(windowOptions, (window) => {createAuthWindowCallBack(state, window)})
  }
  
  useEffect(() => {
    setPadoServicePort(chrome.runtime.connect({name:"padoService"}))
  }, [])
  useEffect(() => {
    padoServicePort && getAllOAuthSources()
  }, [padoServicePort])

  return (
      <div className="pDialog authDialog">
        <PHeader/>
        <main>
          <h1>Sign up</h1>
          <ul className="licensorList">
            {oAuthSources.map((item:AuthSourcesItem) => {
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

export default AuthDialog;
