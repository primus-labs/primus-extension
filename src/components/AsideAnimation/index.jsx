import React from 'react';
import './index.sass'
// import illustration from '@/assets/img/illustration.svg';
const BackgroundAnimation = (props) => {
  return (
    <aside>
      {/* <img src={illustration} className="illustration" alt="illustration" /> */}
      <div className="illustrationWrapper">
        <div class="circle-line1"></div>
        <div class="circle-line2"></div>
      </div>
    </aside>
  );
};

export default BackgroundAnimation;
