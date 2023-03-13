import React from 'react';
import './index.sass'
import iconETH from '@/assets/img/iconETH.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import PInput from '@/components/PInput'

const Login = (props) => {
  const handleClickNext = () => {
    props.onSubmit()
  }
  return (
      <div className="pDialog authDialog setPwdDialog">
          <header className="setPwdDialogHeader">
            <div className="headerContent">
              <div className="iconWrapper">
                <img src={iconETH} alt="" />
              </div>
              <p className="address">0xCEd6324CaA3bF9df5ce0bc67   146b7A9E7657fFB1</p>
            </div>
          </header>
          <main>
            <h1>Set Password</h1>
            <h2>Set a password to protect the information you store locally</h2>
            <h6>Setting</h6>
            <PInput/>
            <div className="validateWrapper">
              <div className="descTitle">The following combinations are recommended：</div>
              <div className="descItem">
                <img src={iconChecked} alt="" />0-9 digits
              </div>
              <div className="descItem">
                <img src={iconChecked} alt="" />A-Z letters
              </div>
              <div className="descItem">
                <img src={iconChecked} alt="" />Special symbols
              </div>
              <div className="descItem">
                <img src={iconChecked} alt="" />Greater than 10 characters
              </div>
            </div>
            <h6>Reconfirm</h6>
            <PInput/>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>OK</span>
            </button>
        {/* </div> */}
      </div>
  );
};

export default Login;
