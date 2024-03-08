import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import PButton from '@/newComponents/PButton';
import iconAlarm from '@/assets/newImg/home/iconAlarm.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceDiscord from '@/assets/img/iconDataSourceDiscord.svg';

type mediaItemsMap = {
  [propName: string]: {
    id: string;
    name: string;
    link: string;
    icon: any;
  };
};
const Overview = memo(() => {
  const navigate = useNavigate();
  const itemMap = {
    x: {
      id: 'x',
      link: 'https://twitter.com/padolabs',
    },
    discord: {
      id: 'discord',
      link: 'https://discord.com/invite/YxJftNRxhh',
    },
  };
  const formatItemsMap = useMemo(() => {
    // const m: mediaItemsMap = Object.keys(itemMap).reduce((prev, curr) => {
    //   const { icon, name } = DATASOURCEMETAMAP[curr];
    //   prev[curr] = {
    //     ...itemMap[curr],
    //     icon,
    //     name,
    //   };
    //   return prev;
    // }, {});
    // m.docs = {
    //   id: 'docs',
    //   link: 'https://docs.padolabs.org/',
    //   icon: iconAlarm,
    //   name: 'Support Docs',
    // };
    const m: mediaItemsMap = {
      x: {
        id: 'x',
        link: 'https://twitter.com/padolabs',
        name: 'X',
        icon: iconDataSourceTwitter,
      },

      discord: {
        id: 'discord',
        link: 'https://discord.com/invite/YxJftNRxhh',
        name: 'Discord',
        icon: iconDataSourceDiscord,
      },
      docs: {
        id: 'docs',
        link: 'https://docs.padolabs.org/',
        icon: iconAlarm,
        name: 'Support Docs',
      },
    };
    return m;
  }, []);
  const handleClick = useCallback(
    (link) => {
      navigate(link);
    },
    [navigate]
  );
  return (
    <div className="homeSupport">
      <div className="title">
        <h2>Support</h2>
      </div>
      <div className="content">
        <div className="title">Find us on:</div>
        <ul className="mediaItems">
          {Object.values(formatItemsMap).map((i, k) => {
            return (
              <li
                key={k}
                className="mediaItem"
                onClick={() => {
                  handleClick(i.link);
                }}
              >
                <img src={i.icon} alt="" />
                <span>{i.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
});

export default Overview;
