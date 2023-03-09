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
  const handleClickNext = () => {
    onSubmit()
  }
  const ajaxGetAllOAuthSources = async () => {
    const response = await getAllOAuthSources()
    const { rc, msg, result } = response
    if (rc === 0) {
      setOAuthSources(result)
    } else {
      return response
    }
  }
  const ajaxGetIsLogin = async(state: string,windowId: number) => {
    console.log('windowId:', windowId)
    let queryLoginTimer;
    const response = await checkIsLogin({state})
    const { rc, msg, result } = response
    if (rc === 0 && result?.uniqueId) {
      clearTimeout(queryLoginTimer)
      // debugger
      // chrome.storage.local.set({ b: '1' }, () => {
      //   console.log('suc????')
      // })
      chrome.storage.local.set({ userInfo: JSON.stringify(result) })
      chrome.windows.remove(windowId)
      onSubmit()
    } else {
      queryLoginTimer = setTimeout(async() => {
        ajaxGetIsLogin(state, windowId)
      }, 500)
    }
  }
  const handleClickOAuthSource = (source:string) => {
    const state = uuidv4()
    const windowOptions = {
      url:`https://18.179.8.186:8081/public/render/${source}?state=${state}`,
      // state: 'minimized',
      type:'popup',
      top: parseInt(screen.availHeight/4),
      left: parseInt(screen.availWidth/3),
      width: screen.availWidth/3,
      height: screen.availHeight/2
    }
    console.log(state)
    chrome.windows.create(windowOptions)
    .then(res => {
      console.log('授权Url:', windowOptions.url)
      const newWindowId = res.tabs[0].windowId
      ajaxGetIsLogin(state, newWindowId)
    })
  }
  useEffect(() => {
    ajaxGetAllOAuthSources()
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
