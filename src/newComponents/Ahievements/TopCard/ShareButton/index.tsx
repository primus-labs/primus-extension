import React, { memo, useEffect, useRef, useState } from 'react';
import './index.scss';


interface PButtonProps {
  // sourceName: string;
  onClick: () => void;
  btnDesc: string;
  img: any;
  imgHover: any;

}

const ShareButton: React.FC<PButtonProps> = memo(
  ({ onClick, btnDesc, img, imgHover }) => {
    const [isHovered, setIsHovered] = useState(false);
    const imgCom = () => {
      if (isHovered) {
        return imgHover;
      } else {
        return img;
      }
    };
    useEffect(() => {
      imgCom();
    }, [isHovered]);
    return (
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick} style={{ display: 'flex', alignItems: 'center' }}>
        <span className={'shareDescFont'}>{btnDesc}</span>
        <span><img src={imgCom()} /></span>
      </button>
    );
  },
);

export default ShareButton;
