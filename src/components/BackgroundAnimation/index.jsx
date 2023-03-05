import React, {useRef,useEffect} from 'react';
import './index.sass'
import bgLayer1 from '@/assets/img/bgLayer1.svg';
import bgLayer2 from '@/assets/img/bgLayer2.svg';
import bgLayer3 from '@/assets/img/bgLayer3.svg';
import bgLayer4 from '@/assets/img/bgLayer4.svg';

const BackgroundAnimation = (props) => {
  const shape1 = useRef()
  const shape2 = useRef()
  const shape3 = useRef()
  const shape4 = useRef()
  const getRandomPostion = (ref) =>{
    // console.dir(shape1.current)
    const shapeWidth = ref.current.offsetWidth
    const shapeHeight = ref.current.offsetHeight
    const minX = -shapeWidth/2
    const maxX = shapeWidth/2 + document.documentElement.clientWidth
    const randomX = Math.random()*(maxX+Math.abs(minX)) -Math.abs(minX)
    const minY = -shapeHeight/2
    const maxY = shapeHeight/2 + document.documentElement.clientHeight
    const randomY = Math.random()*(maxX+Math.abs(minY)) -Math.abs(minY)
    console.dir(shape1.current)
    console.log(minX, maxX, randomX)
    console.log(minY, maxY, randomY)
    ref.current.style.left = randomX+'px'
    ref.current.style.top = randomY+'px'
  }
  // useEffect(()=> {
  //   const animationTimer = setInterval(() => {
  //     getRandomPostion(shape1)
  //     getRandomPostion(shape2)
  //     getRandomPostion(shape3)
  //     getRandomPostion(shape4)
  //   }, 1000)
  //   return () => {
  //     clearInterval(animationTimer)
  //   }
  // }, [])
  return (
    <div className="bgAnimation">
      <img ref={shape1} src={bgLayer1} className="layer1" alt="shapeImg" />
      <img ref={shape2} src={bgLayer2} className="layer2" alt="shapeImg" />
      <img ref={shape3} src={bgLayer3} className="layer3" alt="shapeImg" />
      <img ref={shape4} src={bgLayer4} className="layer4" alt="shapeImg" />
      <div className="layer5"></div>
    </div>
  );
};

export default BackgroundAnimation;
