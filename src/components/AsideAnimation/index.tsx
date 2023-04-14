import React, { useRef } from 'react';
import type { MouseEvent } from 'react'
import './index.sass'
import illustration from '@/assets/img/illustration.svg';
const BackgroundAnimation = () => {
  const illustrationEl = useRef<any>(null)
  function transformElement(x: number, y: number) {
    const element = illustrationEl.current
    const multiple = 40;
    let box = element.getBoundingClientRect();
    let calcX = -(y - box.y - (box.height / 2)) / multiple;
    let calcY = (x - box.x - (box.width / 2)) / multiple;
    element.style.transform = "rotateX(" + calcX + "deg) "
      + "rotateY(" + calcY + "deg)";
  }
  const handleMousemove = (e: MouseEvent) => {
    window.requestAnimationFrame(function () {
      transformElement(e.clientX, e.clientY);
    });
  }
  const handleMouseLeave = (e: MouseEvent) => {
    const element = illustrationEl.current
    element.style.transform = "rotateX(0) rotateY(0)";
  }
  return (
    <aside onMouseMove={handleMousemove} onMouseLeave={handleMouseLeave}>
      <img ref={illustrationEl} src={illustration} className="illustration" alt="illustration" />
    </aside>
  );
};

export default BackgroundAnimation;
