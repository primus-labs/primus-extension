import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import type { SyntheticEvent } from 'react';
import type { UserState } from '@/types/store';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconBinance from '@/assets/img/iconBinance.png';
import iconUpChainEthereum from '@/assets/img/iconUpChainEthereum.svg';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';
import bgCombineType0 from '@/assets/newImg/events/bgCombineType0.svg';
import bgCombineType1 from '@/assets/newImg/events/bgCombineType1.svg';
import iconPado from '@/assets/newImg/events/iconPado.svg';
import './index.scss';

type NavItem = {
  type: string;
  icon: any;
  desc: any;
  name: string;

  importType?: string;
  provider?: string;
};
interface PDropdownProps {
  onClick?: (item: NavItem) => void;
  // list: NavItem[];
}
const list = Object.values(DATASOURCEMAP);
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const navigate = useNavigate();
    const [activeDataSourceName, setActiveDataSourceName] =
      useState<string>('');
    const { deleteFn: deleteDataSourceFn } =
      useDataSource(activeDataSourceName);
    const dataSourceQueryStr = useSelector(
      (state: UserState) => state.dataSourceQueryStr
    );
    const dataSourceQueryType = useSelector(
      (state: UserState) => state.dataSourceQueryType
    );
    const filterdList = useMemo(() => {
      var newList = [
        {
          id: '1',
          combineType: '1', // 0： pado，1:pado combine with partner
          parterIcon: iconNetworkLinea, // required when combineType is 1

          periodType: '1', // 0: period，1:long period
          // period: {startTime,endTime}, // required when periodType is 0
          chainDesc: 'Linea Voyage XP', // required when period is 1

          picTxt: 'The Linea Voyage Proof of Humanity',

          title: 'The Linea Voyage: Proof of Humanity',
          desc: 'Complete an attestation with a KYCed account on Binance.',
          gift: '100 PADO points',
        },
        {
          id: '2',
          combineType: '1',
          parterIcon: iconDataSourceBinance,

          periodType: '1',
          chainDesc: 'BAS XPS',

          picTxt: 'BAS Attestation Alliance',

          title: 'BAS Attestation Alliance',
          desc: 'Bringing more traditional data attestations to the BNB ecosystem.',
          gift: '100 PADO points',
        },
        {
          id: '2',
          combineType: '0',

          periodType: '1',
          chainDesc: 'PADO Early Birld NFT',

          picTxt: 'PADO Early Bird NFT Rewards',

          title: 'BNBChain Attestation Alliance',
          desc: 'Complete an attestation with any kind of Asset Certificate.',
          gift: '100 PADO points',
        },
      ];

      return newList;
    }, [list, dataSourceQueryStr, dataSourceQueryType]);
    const { sourceMap, sourceMap2 } = useAllSources();
    const handleJoin = (i) => {

    }
    return (
      <div className="currentEvents">
        <h2 className="title">Current events</h2>
        <ul className="currentEventsCards">
          {filterdList.map((i) => {
            return (
              <li
                className="dataSourceCard"
                onClick={() => {
                  handleJoin(i);
                }}
                key={i.id}
              >
                <div className="cardContent">
                  <div className="picWrapper">
                    <div className={`picContent ${i.combineType === '1' && 'combine'}`}>
                      <SplicedIcons
                        list={
                          i.combineType === '1'
                            ? [i.parterIcon, iconPado]
                            : [iconPado]
                        }
                      />
                      <span>{i.picTxt}</span>
                    </div>
                    <div className="endMask">END</div>
                  </div>
                  <div className="txtWrapper">
                    <div className="title">{i.title}</div>
                    <div className="descItems">
                      {i.periodType === '1' && (
                        <div className="descItem">
                          <i className="iconfont icon-iconBlockChain"></i>
                          <span>{i.chainDesc}</span>
                        </div>
                      )}
                      {i.periodType === '0' && (
                        <div className="descItem">
                          <i className="iconfont icon-iconCalendar"></i>
                          <span>{JSON.stringify(i.period)}</span>
                        </div>
                      )}
                      <div className="descItem">
                        <i className="iconfont icon-iconGift"></i>
                        <span>{i.gift}</span>
                      </div>
                    </div>
                    <div className="desc">{i.desc}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
);

export default Cards;
