import React from 'react';
import './index.sass'
// import illustration from '@/assets/img/illustration.svg';
const BackgroundAnimation = (props) => {
  return (
    <aside>
      {/* <img src={illustration} className="illustration" alt="illustration" /> */}
      <div className="illustrationWrapper">
        <div className="circle-line1"></div>
        <div className="circle-line2"></div>
      </div>
    </aside>
  );
};

export default BackgroundAnimation;
