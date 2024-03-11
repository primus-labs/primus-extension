import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserInfo } from '@/services/api/achievements';

import useAllSources from '@/hooks/useAllSources';
import { DATASOURCEMAP } from '@/config/dataSource2';
import { EASInfo } from '@/config/chain';

import type { UserState } from '@/types/store';
import PButton from '@/newComponents/PButton';
import SplicedIcons from '@/newComponents/SplicedIcons';

import './index.scss';

type ItemMap = {
  [propName: string]: {
    id: string;
    title: string;
    num: number;
    operationName: string;
    link: string;
  };
};
const Overview = memo(() => {
  const { sourceMap2 } = useAllSources();
  const navigate = useNavigate();
  const [connectedDataSources, setConnectedDataSources] = useState<any>();
  const [onChains, setOnChains] = useState<any>();
  // const [totalScore, setTotalScore] = useState<string>();
  const [itemMap, setItemMap] = useState<ItemMap>({
    dataSource: {
      id: 'dataSource',
      title: 'Data connected',
      num: 0,
      operationName: 'Connect Data Source',
      link: '/datas',
    },
    zkAttestation: {
      id: 'zkAttestation',
      title: 'zkAttestation',
      num: 0,
      operationName: 'Create zkAttestation',
      link: '/zkAttestation',
    },
    achievement: {
      id: 'achievement',
      title: 'Points Earned',
      num: 0,
      operationName: 'Earn points',
      link: '/achievements',
    },
  });
  const hasData = useMemo(() => {
    return Object.values(itemMap).some(i =>i.num >0)
  }, [itemMap]);
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );

  const handleClick = useCallback(
    (link) => {
      navigate(link);
    },
    [navigate]
  );
  const initDataFn = useCallback(() => {
    const m = Object.keys(sourceMap2).reduce((prev, curr) => {
      const dataSourceId = curr.startsWith('0x') ? 'web3 wallet' : curr;
      if (dataSourceId in prev) {
      } else {
        prev[dataSourceId] = {
          id: curr,
          icon: DATASOURCEMAP[dataSourceId].icon,
        };
      }
      return prev;
    }, {});
    setConnectedDataSources(m);

    setItemMap((i) => {
      i.dataSource.num = Object.keys(m).length;
      return i;
    });
  }, [sourceMap2]);
  const initOnChainFn = useCallback(() => {
    const m = Object.values(credentialsFromStore).reduce((prev, curr) => {
      const provided = curr?.provided;
      if (provided) {
        let currCredM = provided.reduce((p, c) => {
          const { title } = c;
          p[title] = {
            id: title,
            icon: EASInfo[title].icon,
          };
          return p;
        }, {});
        prev = { ...prev, ...currCredM };
      }
      return prev;
    }, {});
    setOnChains(m);
    setItemMap((m) => {
      m.zkAttestation.num = Object.keys(credentialsFromStore).length;
      return m;
    });
  }, [credentialsFromStore]);
  const iconListFn = useCallback(
    (id) => {
      if (id === 'dataSource') {
        const l = Object.values(connectedDataSources).map((i: any) => i.icon);
        return l;
      } else if (id === 'zkAttestation') {
        return Object.values(onChains).map((i: any) => i.icon);
      } else {
        return [];
      }
    },
    [onChains, connectedDataSources]
  );
  const getUserInfoFn = async () => {
    const res = await getUserInfo();
    const { rc, result } = res;
    if (rc === 0) {
      setItemMap((m) => {
        m.achievement.num = result.totalScore;
        return m;
      });
    }
  };
  useEffect(() => {
    initDataFn();
  }, [initDataFn]);
  useEffect(() => {
    initOnChainFn();
  }, [initOnChainFn]);
  useEffect(() => {
    getUserInfoFn();
  }, []);
  return (
    <div className="homeOverview">
      <div className="title">
        <span>Overview</span>
        {/* <div className="updateTip">
          <span>Updated 4mins ago</span>
          <i className="iconfont "></i>
        </div> */}
      </div>
      <ul className="overviewItems">
        {Object.values(itemMap).map((i, k) => {
          return (
            <li className={`overviewItem ${hasData && 'hasContent'}`} key={k}>
              <h4 className="title">{i.title}</h4>
              <div className="desc">
                <div className="num">{i.num}</div>
                {i.num > 0 ? (
                  ['dataSource', 'zkAttestation'].includes(i.id) && (
                    <SplicedIcons list={iconListFn(i.id)} />
                  )
                ) : (
                  <PButton
                    className="operationBtn"
                    text={i.operationName}
                    type="text"
                    onClick={() => {
                      handleClick(i.link);
                    }}
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

export default Overview;
