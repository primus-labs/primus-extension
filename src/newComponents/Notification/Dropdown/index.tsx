import React, { memo, useCallback, useMemo, useState } from 'react';
import PButton from '@/newComponents/PButton';
import PTooltip from '@/newComponents/PTooltip';
import './index.scss';
import { useDispatch, useSelector } from 'react-redux';
import { initSetNotificationsAction } from '@/store/actions';
import { UserState } from '@/types/store';
import { Dispatch } from 'react';

const NotificationDropdown: React.FC = memo(({}) => {
  const dispatch: Dispatch<any> = useDispatch();
  const notifications = useSelector((state: UserState) => state.notifications);
  const list = useMemo(() => {
    return Object.values(notifications);
  }, [notifications]);

  const handleShowMore = async (id) => {
    const { notifications } = await chrome.storage.local.get(['notifications']);
    if (notifications) {
      const lastObj = JSON.parse(notifications);
      lastObj[id].collapse = !lastObj[id].collapse;
      await chrome.storage.local.set({
        notifications: JSON.stringify(lastObj),
      });
      dispatch(initSetNotificationsAction());
    }
  };

  return (
    <div className="notificationDropdown">
      <h6>Notification</h6>
      <ul className="dropdownOptions">
        {list.map((item, k) => {
          return (
            <li className="dropdownOption" key={item.id}>
              <div className="title">{item.title}</div>
              <div className="desc">
                <div
                  className={`descCon ${
                    item.desc.length > 41
                      ? item.collapse
                        ? 'collapse'
                        : 'expand'
                      : ''
                  }`}
                >
                  {item.desc}
                </div>
                {item.desc.length > 41 && item.collapse && (
                  <PButton
                    type="text"
                    text={'More'}
                    suffix={
                      <i
                        className={`iconfont icon-DownArrow rotate
                        `}
                      ></i>
                    }
                    onClick={() => {
                      handleShowMore(item.id);
                    }}
                    className="moreBtn"
                  />
                )}
              </div>
              <div className="time">
                <span className="timeCon">{item.time}</span>
                {item.desc.length > 41 && !item.collapse && (
                  <PButton
                    type="text"
                    text={'Collapse'}
                    suffix={
                      <i
                        className={`iconfont icon-DownArrow
                        }`}
                      ></i>
                    }
                    onClick={() => {
                      handleShowMore(item.id);
                    }}
                    className="moreBtn"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export default NotificationDropdown;
