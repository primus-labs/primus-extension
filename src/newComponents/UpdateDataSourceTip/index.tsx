import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { setSourceUpdateInfoAction } from '@/store/actions';
import iconUpdate from '@/assets/newImg/layout/iconUpdate.svg';
import './index.scss';
import { useDispatch } from 'react-redux';

const UpdateDataSourceTip = memo(() => {
  const dispatch = useDispatch();
  const sourceUpdateInfo = useSelector((state) => state.sourceUpdateInfo);
  const handleClick = () => {
    // dispatch(
    //   setSourceUpdateInfoAction({
    //     pollingFlag: false,
    //   })
    // );
  };
  return (
    <div className="updateTip" onClick={handleClick}>
      <span>Updated {sourceUpdateInfo.lastUpdateFromNow}mins ago</span>
      <img
        src={iconUpdate}
        className={`${sourceUpdateInfo.lastUpdating ? 'rotate' : ''}`}
      />
    </div>
  );
});

export default UpdateDataSourceTip;
