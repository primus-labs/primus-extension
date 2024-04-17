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
import PButton from '@/newComponents/PButton';
import adLinea from '@/assets/newImg/events/adLinea.svg';
import adBas from '@/assets/newImg/events/adBas.svg';
import adEthSign from '@/assets/newImg/events/adEthSign.svg';
import bannerBgBas from '@/assets/newImg/events/bannerBgBas.svg';
import bannerBgLinea from '@/assets/newImg/events/bannerBgLinea.svg';
import bannerBgEthSign from '@/assets/newImg/events/bannerBgEthSign.svg';
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

const eventIntroMap = {
  [LINEAEVENTNAME]: {
    id: LINEAEVENTNAME,
    title: 'The Linea Voyage: Proof of Humanity',
    desc: 'Complete an attestation with a KYCed account on Binance. Bringing more PoH attestations to Verax and Linea ecosystem!',
    pointIconFont: 'icon-iconBlockChain',
    pointDesc: 'LXP',
    bg: bannerBgLinea,
  },
  [ETHSIGNEVENTNAME]: {
    id: ETHSIGNEVENTNAME,
    title: 'SignX Program',
    desc: 'Attest your X followers, building trust in trustless systems.',
    pointIconFont: 'icon-iconGift',
    pointDesc: 'PADO Points',
    bg: bannerBgEthSign,
  },
  [BASEVENTNAME]: {
    id: BASEVENTNAME,
    title: 'BNBChain Attestation Alliance',
    desc: 'Bringing more traditional data attestations to the BNB ecosystem. Finish simple tasks to win your XP！',
    pointIconFont: 'icon-iconBlockChain',
    pointDesc: 'BAS XP',
    bg: bannerBgBas,
  },
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
        {Object.values(eventIntroMap).map((i) => {
          return (
            <div className="homeBanner" key={i.id}>
              <img src={i.bg} alt="" className="bg" />
              <div className="content">
                <div className="intro">
                  <div className="brief">
                    <h1>{i.title}</h1>
                    <h3>{i.desc}</h3>
                  </div>
                  <div className="desc">
                    <div className="left">
                      <div className={`iconfont ${i.pointIconFont}`}></div>
                      <span>{i.pointDesc}</span>
                    </div>
                  </div>
                </div>
                <PButton
                  text="Join now"
                  type="primary"
                  size="m"
                  className="joinBtn"
                  onClick={() => {handleClick(i)}}
                />
              </div>
            </div>
          );
        })}
        {/* {Object.values(eventMap).map((i) => {
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
        })} */}
      </Slider>
    </div>
  );
});

export default PBack;
