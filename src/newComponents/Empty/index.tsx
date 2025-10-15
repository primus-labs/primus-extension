import React, { memo, useEffect } from 'react';

import empty from '@/assets/newImg/zkAttestation/empty.svg';
import './index.scss';
import PButton from '@/newComponents/PButton';

interface EmptyProps {
  title: string;
  desc?: string;
  btnTxt?: string;
  onSubmit?: () => void;
  emptyImg?: any;
}
const Empty: React.FC<EmptyProps> = memo(
  ({ title, desc, btnTxt, onSubmit, emptyImg = empty }) => {
    useEffect(() => {}, []);
    return (
      <div className="pEmpty">
        <img src={emptyImg} alt="" />
        <div className="introTxt">
          <div className="title">{title}</div>
          <div className="desc">{desc}</div>
        </div>
        {btnTxt && (
          <PButton
            text={btnTxt}
            type="primary"
            onClick={onSubmit as () => void}
            className="submitBtn"
          />
        )}
      </div>
    );
  }
);

export default Empty;
