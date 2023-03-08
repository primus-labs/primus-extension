import React from 'react';
import './index.sass'
import rightArrow from '@/assets/img/rightArrow.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import iconETH from '@/assets/img/iconETH.svg';
import iconBinance from '@/assets/img/iconBinance.svg';
import iconNetwork3 from '@/assets/img/iconNetwork3.svg';
import iconNetwork4 from '@/assets/img/iconNetwork4.svg';
import iconNetwork5 from '@/assets/img/iconNetwork5.svg';
import iconNetwork6 from '@/assets/img/iconNetwork6.svg';
const Login = (props) => {
  const networkList = [
    // {
    //   icon: iconETH,
    //   title: 'ETH'
    // },
    {
      icon: iconBinance,
      title: 'Binance'
    },
    {
      icon: iconNetwork3,
      title: '3'
    },
    {
      icon: iconNetwork4,
      title: '4'
    },
    {
      icon: iconNetwork5,
      title: '5'
    },
    {
      icon: iconNetwork6,
      title: '6'
    },
  ]
  const handleClickNext = () => {
    props.onSubmit()
  }
  return (
      <div className="pDialog authDialog createAccountDialog">
          <header className="createAccountDialogHeader">
            <i></i>
            <span>tate@padolabs.org</span>
            <img src={iconChecked} alt="back" />
          </header>
          <main>
            <h1>Create account</h1>
            <h2>An on-chain address will be created for you to manage your own data more safely. You can select the following networks</h2>
            <h6>Continue with</h6>
            <div className="activeNetwork networkItem">
              <img src={iconETH} alt="ETH" />
            </div>
            <div className="dividerWrapper">
              <i></i>
              <div className="divider">or</div>
              <i></i>
            </div>
            <ul className="networkList">
              {networkList.map(licensor => {
                return (<li className="networkItem">
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
