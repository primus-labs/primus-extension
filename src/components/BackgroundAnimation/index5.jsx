import React from 'react';
import './index.sass'
import bgLayer1 from '@/assets/img/bgLayer1.svg';
import bgLayer2 from '@/assets/img/bgLayer2.svg';
import bgLayer3 from '@/assets/img/bgLayer3.svg';
import bgLayer4 from '@/assets/img/bgLayer4.svg';

const BackgroundAnimation = (props) => {
  return (
    <div className="bgAnimation">
      <div className="layer1"><img src={bgLayer1}  alt="shapeImg"/></div>
      <div className="layer2"><img src={bgLayer2}  alt="shapeImg"/></div>
      <div className="layer3"><img src={bgLayer3}  alt="shapeImg"/></div>
      <div className="layer4"><img src={bgLayer4}  alt="shapeImg"/></div>
    </div>
  );
};

export default BackgroundAnimation;
