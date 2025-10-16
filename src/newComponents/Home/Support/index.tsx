import React, { memo, useCallback, useMemo } from 'react';
import './index.scss';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceX.svg';
import iconDataSourceDiscord from '@/assets/img/iconDataSourceDiscord.png';
import { useSelector } from 'react-redux';
import { UserState } from '@/types/store';

type mediaItemsMap = {
  [propName: string]: {
    id: string;
    name: string;
    link: string;
    icon?: any;
    iconName?: string;
  };
};
const Overview = memo(() => {
  const sysConfig = useSelector((state: UserState) => state.sysConfig);

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
        link: sysConfig.TWITTER_HOME_LINK ?? 'https://x.com/padolabs',
        name: 'X',
        icon: iconDataSourceTwitter,
      },
      discord: {
        id: 'discord',
        link: sysConfig.DISCORD_INVITE_LINK ?? 'https://discord.gg/pdrNxRrApX',
        name: 'Discord',
        icon: iconDataSourceDiscord,
      },
      docs: {
        id: 'docs',
        link: sysConfig.SUPPORT_DOCS_LINK ?? 'https://docs.padolabs.org/',
        // icon: iconAlarm,
        iconName: 'icon-iconAlarm',
        name: 'Support Docs',
      },
    };
    return m;
  }, [sysConfig]);
  const handleClick = useCallback((link) => {
    window.open(link);
  }, []);
  return (
    <div className="homeSupport">
      <div className="title">
        <span>Support</span>
      </div>
      <div className="content">
        <div className="title">Find Us On:</div>
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
                {i.iconName ? (
                  <i className={`iconfont ${i.iconName}`}></i>
                ) : (
                  <img src={i.icon} alt="" />
                )}
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
