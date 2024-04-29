import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { setSourceUpdateInfoAction } from '@/store/actions';
import iconUpdate from '@/assets/newImg/layout/iconUpdate.svg';
import './index.scss';
import { useDispatch } from 'react-redux';
import PButton from '@/newComponents/PButton';
import { UserState } from '@/types/store';

const UpdateDataSourceTip = memo(() => {
  const dispatch = useDispatch();
  const sourceUpdateInfo = useSelector((state: UserState) => state.sourceUpdateInfo);
  const handleClick = () => {
    dispatch(
      setSourceUpdateInfoAction({
        pollingFlag: false,
      })
    );
    setTimeout(() => {
      dispatch(
        setSourceUpdateInfoAction({
          pollingFlag: true,
        })
      );
    }, 500);
  };
  return (
    <div className="updateDataSourceTip">
      <span>
        {sourceUpdateInfo.lastUpdating
          ? `updating data`
          : `updated ${sourceUpdateInfo.lastUpdateFromNow}mins ago`}
      </span>
      <PButton
        className="updateBtn"
        type="icon"
        icon={
          <i
            className={`iconfont icon-iconUpdate1 ${
              sourceUpdateInfo.lastUpdating ? 'rotate' : ''
            }`}
          ></i>
        }
        onClick={handleClick}
      />
    </div>
  );
});

export default UpdateDataSourceTip;
