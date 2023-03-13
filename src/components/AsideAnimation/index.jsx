import React, {useRef} from 'react';
import './index.sass'
import illustration from '@/assets/img/illustration.svg';
const BackgroundAnimation = (props) => {
  const illustrationEl = useRef()
  function transformElement(x, y) {
    const element = illustrationEl.current
    const multiple = 20;
    let box = element.getBoundingClientRect();
    let calcX = (y - box.y - (box.height / 2)) / multiple;
    let calcY = -(x - box.x - (box.width / 2)) / multiple;
    element.style.transform = "rotateX(" + calcX + "deg) "
      + "rotateY(" + calcY + "deg)";
  }
  const handleMousemove = (e) => {
    window.requestAnimationFrame(function () {
      transformElement(e.clientX, e.clientY);
    });
  }
  return (
    <aside onMouseMove={handleMousemove}>
      <img ref={illustrationEl} src={illustration} className="illustration" alt="illustration" />
      {/* <div className="illustrationWrapper">
        <div className="circle-line1"></div>
        <div className="circle-line2"></div>
      </div> */}
    </aside>
  );
};

export default BackgroundAnimation;
