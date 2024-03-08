import React, { memo } from 'react'; 
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import adLinea from '@/assets/newImg/events/adLinea.svg'
import adBas from '@/assets/newImg/events/adBas.svg';
import './index.scss';
interface PBackProps {
  
}
var settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: false,
  pauseOnHover: true,
  nextArrow: <></>,
  prevArrow: <></>,
};
const PBack: React.FC<PBackProps> = memo(({  }) => {
  return (
    <div className="eventsSlider">
      <Slider {...settings}>
        <img src={adLinea} alt="" />
        <img src={adBas} alt="" />
      </Slider>
    </div>
  );
});

export default PBack;
