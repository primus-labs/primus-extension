import React from 'react';
import './index.sass'
import bgLayer1 from '@/assets/img/bgLayer12.svg';
import bgLayer2 from '@/assets/img/bgLayer22.svg';
import bgLayer3 from '@/assets/img/bgLayer32.svg';
import bgLayer4 from '@/assets/img/bgLayer42.svg';

const BackgroundAnimation = (props) => {
  return (
    <div className="bgAnimation">
      <div className="shapeInnerWrapper2">
        <div className="layer2"><img src={bgLayer2}  alt="shapeImg"/></div>
      </div>
      <div className="shapeInnerWrapper">
      <div className="layer1"><img src={bgLayer1}  alt="shapeImg"/></div>
        <div className="layer3">
          <img src={bgLayer3}  alt="shapeImg"/>
          {/* <div className="imgBox"></div> */}
        </div>
        <div className="layer4"><img src={bgLayer4}  alt="shapeImg"/></div>
      </div>
    </div>
  );
};

export default BackgroundAnimation;
