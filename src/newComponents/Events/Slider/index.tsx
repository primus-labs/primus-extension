import React, { memo } from 'react';
import Slider from 'react-slick';
import { useNavigate } from 'react-router-dom';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
  BASEVENTNAME,
  LINEAEVENTNAME,
  ETHSIGNEVENTNAME,
} from '@/config/events';
import adLinea from '@/assets/newImg/events/adLinea.svg';
import adBas from '@/assets/newImg/events/adBas.svg';
import adEthSign from '@/assets/newImg/events/adEthSign.svg';
import './index.scss';

interface PBackProps {}
var settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  pauseOnHover: true,
  nextArrow: <></>,
  prevArrow: <></>,
};
const PBack: React.FC<PBackProps> = memo(({}) => {
  const navigate = useNavigate();
  const eventMap = {
    [LINEAEVENTNAME]: {
      id: LINEAEVENTNAME,
      adImg: adLinea,
      // link: '/',
    },
    [ETHSIGNEVENTNAME]: {
      id: ETHSIGNEVENTNAME,
      adImg: adEthSign,
    },
    [BASEVENTNAME]: {
      id: BASEVENTNAME,
      adImg: adBas,
      // link: `/events/detail?id=BAS_EVENT_PROOF_OF_HUMANITY`,
    },
  };
  const handleClick = (i: any) => {
    navigate(`/events/detail?id=${i.id}`);
  };
  return (
    <div className="eventsSlider">
      <Slider {...settings}>
        {Object.values(eventMap).map((i) => {
          return (
            <img
              className="sliderImg"
              src={i.adImg}
              alt=""
              onClick={() => {
                handleClick(i);
              }}
              key={i.id}
            />
          );
        })}
      </Slider>
    </div>
  );
});

export default PBack;
