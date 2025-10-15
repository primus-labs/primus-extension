import React, { memo, useEffect, useState } from 'react';
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
    const [fontStyle, setFontStyle] = useState('false');
    const imgCom = () => {
      if (isHovered) {
        return imgHover;
      } else {
        return img;
      }
    };
    const fontStyleFn = () => {
      if (isHovered) {
        setFontStyle("shareDescFontHover") ;
      } else {
        setFontStyle("shareDescFont");
      }
    };

    useEffect(() => {
      imgCom();
      fontStyleFn();
    }, [isHovered]);
    return (
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick} style={{ display: 'flex', alignItems: 'center' }}>
        <span className={fontStyle}>{btnDesc}</span>
        <span><img  src={imgCom()} /></span>
      </button>
    );
  },
);

export default ShareButton;
