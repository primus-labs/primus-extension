import React, { memo, useCallback, useMemo } from 'react';
import PButton from '@/newComponents/PButton';
import PTooltip from '@/newComponents/PTooltip';
import './index.scss';

type NavItem = {
  id: string;
  title?: any;
  desc?: any;
  time?: any;
  collapse?: boolean;
};

const NotificationDropdown: React.FC = memo(({}) => {
  const list: NavItem[] = [
    {
      id: '0',
      title: 'A new version 0.3.4 is updated.',
      desc: 'Optimized the Web3 data acquisition method, added a link button on the Early Bird NFT image to jump to OpenSea.',
      time: '2024/05/23 20:00',
      collapse: true,
    },
  ];

  const handleClickData = (item: NavItem) => {
    // if (!item.disabled) {
    //   onClick(item.value, item);
    // }
  };
  const handleShowMore = (item) => {
    item.collapse = !item.collapse;
  };
  return (
    <div className="notificationDropdown">
      <h6>Notification</h6>
      <ul className="dropdownOptions">
        {list.map((item) => {
          return (
            <li
              className="dropdownOption"
              key={item.id}
              
            >
              <div className="title">{item.title}</div>
              <div className="desc">
                {/* <div className={`descCon ${item.desc.length > 41? item.collapse? 'collapse': 'expand': ''}`}> */}
                <div className={`descCon`}>
                  {item.desc}
                </div>
                {/* {item.desc.length > 41 && (
                  <PButton
                    type="text"
                    text={!item.collapse ? 'Collapse' : 'More'}
                    suffix={
                      <i
                        className={`iconfont icon-DownArrow ${
                          !item.collapse && 'rotate'
                        }`}
                      ></i>
                    }
                    onClick={() => {
                      handleShowMore(item);
                    }}
                    className="moreBtn"
                  />
                )} */}
              </div>
              <div className="time">{item.time}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export default NotificationDropdown;
