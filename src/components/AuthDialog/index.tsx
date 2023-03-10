import React, {useState, useEffect} from 'react';
import { v4 as uuidv4 } from 'uuid';
import PHeader from '@/components/PHeader'
import './index.sass'
import iconGoogle from '@/assets/img/iconGoogle.svg';
import iconDC from '@/assets/img/iconDC.svg';
import iconTwitter from '@/assets/img/iconTwitter.svg';
import iconGithub from '@/assets/img/iconGithub.svg';
import rightArrow from '@/assets/img/rightArrow.svg';
import {getAllOAuthSources, checkIsLogin} from '@/services/user'
import type { AuthSourcesItem, AuthSourcesItems } from '@/services/user';

interface authDialogProps {
  onSubmit: () => void
}

const Login: React.FC<authDialogProps> = ({onSubmit}) => {
  const [oAuthSources, setOAuthSources] = useState<AuthSourcesItems>([])
  const padoServicePort = chrome.runtime.connect({name:"padoService"})
  const handleClickNext = () => {
    onSubmit()
  }
  const fetchGetAllOAuthSources = async () => {
    padoServicePort.postMessage({
      reqMethodName: 'getAllOAuthSources',
    })
    console.log("content_send:getAllOAuthSources request");
    padoServicePort.onMessage.addListener(async function(message){
      switch (message.resMethodName) {
        case "getAllOAuthSources":
          console.log("content_get:", message.res);
          setOAuthSources(message.res)
          break;
        case "auth":
          console.log("content_get:", message.res);
          onSubmit()
          break;
        default:
          break;
      }
    })
  }
  const handleClickOAuthSource = (source:string) => {
    const state = uuidv4()
    padoServicePort.postMessage({
      reqMethodName: 'auth',
      params: {
        source,
        state
      }
    })
  }
  useEffect(() => {
    fetchGetAllOAuthSources()
  }, [])
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

export default Login;
