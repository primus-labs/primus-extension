import React from 'react';
import PHeader from '@/components/PHeader'
import './index.sass'
import iconGoogle from '@/assets/img/iconGoogle.svg';
import iconDC from '@/assets/img/iconDC.svg';
import iconTwitter from '@/assets/img/iconTwitter.svg';
import iconGithub from '@/assets/img/iconGithub.svg';
import rightArrow from '@/assets/img/rightArrow.svg';
const Login = () => {
  const licensorList = [
    {
      icon: iconGoogle,
      title: 'google'
    },
    {
      icon: iconDC,
      title: 'dc'
    },
    {
      icon: iconTwitter,
      title: 'twitter'
    },
    {
      icon: iconGithub,
      title: 'github'
    },
  ]
  const handleClickNext = () => {
    
  }
  return (
      <div className="pDialog authDialog appContentWrapper">
        {/* <div className="appContent"> */}
          <PHeader/>
          <main>
            <h1>Contratulations</h1>
            <ul className="licensorList">
              {licensorList.map(licensor => {
                return (<li className="licensorItem">
                  <img src={licensor.icon} alt="" />
                </li>)
              })}
            </ul>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>Next</span>
            <img src={rightArrow} alt="right arrow" /></button>
        {/* </div> */}
      </div>
  );
};

export default Login;
