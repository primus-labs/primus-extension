import React, {useEffect} from 'react';
import './index.sass'
import rightArrow from '@/assets/img/rightArrow.svg';
import iconETH from '@/assets/img/iconETH.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import iconSuc from '@/assets/img/iconSuc.svg';
import PInput from '@/components/PInput'

const Login = (props) => {
  const handleClickNext = () => {
    props.onSubmit()
  }
  useEffect(() => {
    chrome.storage.local.get(['wallet', 'userInfo'],  (items) => {
      console.log(2, items)
    })
  }, [])
  return (
      <div className="pDialog authDialog setSucDialog">
        <header className="createAccountDialogHeader">
          <i></i>
          <span>tate@padolabs.org</span>
          <img src={iconChecked} alt="back" />
        </header>
        <header className="setPwdDialogHeader">
          <div className="headerContent">
            <div className="iconWrapper">
              <img src={iconETH} alt="" />
            </div>
            <p className="address">0xCEd6324CaA3bF9df5ce0bc67   146b7A9E7657fFB1</p>
          </div>
        </header>
        <main>
          <img src={iconSuc} alt="" />
          <h1>Congratulations</h1>
          <h2>Your setup was successful</h2>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>OK</span>
          </button>
      </div>
  );
};

export default Login;
