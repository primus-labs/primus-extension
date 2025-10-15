import React, { memo, useState, useEffect } from 'react';
import PButton from '@/newComponents/PButton';
import './index.scss';
import { useDispatch, useSelector } from 'react-redux';
import { UserState } from '@/types/store';
import { Dispatch } from 'react';

const NotificationDropdown: React.FC = memo(({}) => {
  const notifications = useSelector((state: UserState) => state.notifications);
  const [list, setList] = useState<any>([]);
  // const list = useMemo(() => {
  //   return Object.values(notifications).sort((a: any, b: any) => b.id - a.id);
  // }, [notifications]);
  useEffect(() => {
    let l: any[] = Object.values(notifications).sort(
      (a: any, b: any) => b.id - a.id
    );
    if (l) {
      l = l.map((item, k) => {
        item.collapse = k !== 0;
        item.disableCollapse = k === 0;
        return item;
      });
      setList(l);
    } else {
      setList([]);
    }
  }, [notifications]);

  const handleShowMore = async (id) => {
    setList((l) => {
      const item = l.find((i) => i.id === id);
      item.collapse = !item.collapse;
      return [...l];
    });
  };

  return (
    <div className="notificationDropdown">
      <h6>Notification</h6>
      <div className="scrollWrapper">
        <ul className="dropdownOptions">
          {list.map((item, k) => {
            return (
              <li className="dropdownOption" key={item?.id}>
                <div className="title">{item?.title}</div>
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
                  {item.desc.length > 41 &&
                    !item.disableCollapse &&
                    item.collapse && (
                      <PButton
                        type="text"
                        text={'More'}
                        suffix={<i className={`iconfont icon-DownArrow `}></i>}
                        onClick={() => {
                          handleShowMore(item.id);
                        }}
                        className="moreBtn"
                      />
                    )}
                </div>
                <div className="time">
                  <span className="timeCon">{item.time}</span>
                  {item.desc.length > 41 &&
                    !item.disableCollapse &&
                    !item.collapse && (
                      <PButton
                        type="text"
                        text={'Collapse'}
                        suffix={
                          <i
                            className={`iconfont icon-DownArrow rotate
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
    </div>
  );
});

export default NotificationDropdown;
