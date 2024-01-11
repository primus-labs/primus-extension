import React, {
  FC,
  memo,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import { queryEventDetail } from '@/services/api/event';
import PButton from '@/components/PButton';
import bannerIllstration from '@/assets/img/events/bannerIllstration.svg';
import nftIllstration from '@/assets/img/events/nftIllstration.png';
import './index.scss';
interface AdSpaceProps {
  onClick: () => void;
}
dayjs.extend(utc);
const AdSpace: FC<AdSpaceProps> = memo(({ onClick }) => {
  const [scrollEventPeriod, setScrollEventPeriod] = useState({
    startTime: '1701864000000',
    endTime: '1703075400000',
  });
  const formatPeriod = useMemo(() => {
    // return '2023.12.06 ~ 2023.12.19';
    const { startTime, endTime } = scrollEventPeriod;
    const s = dayjs.utc(+startTime).format('YYYY.MM.DD-h-a');
    const e = dayjs.utc(+endTime).format('YYYY.MM.DD-h-a');

    const sArr = s.split('-');
    const eArr = e.split('-');
    return `${sArr[0]} ~ ${eArr[0]}`;
  }, [scrollEventPeriod]);

  const scrollEventActiveFlag = useMemo(() => {
    // const { startTime, endTime } = scrollEventPeriod;
    // const isActive =
    //   dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
    // const isEnd = dayjs().isAfter(dayjs(+endTime));
    // if (isActive) {
    //   return 1;
    // }
    // if (isEnd) {
    //   return 2;
    // }
    // return 0;
    return 2
  }, []);
  const formatCN = useMemo(() => {
    if (scrollEventActiveFlag === 1) {
      return 'adSpace adSpaceBadge';
    } else {
      return 'adSpace adSpaceNft';
    }
  }, [scrollEventActiveFlag]);
  const formatImgCN = useMemo(() => {
    if (scrollEventActiveFlag === 1) {
      return 'activeImg';
    } else {
      return ;
    }
  }, [scrollEventActiveFlag]);
  const formatImgSrc = useMemo(() => {
    if (scrollEventActiveFlag === 1) {
      return bannerIllstration;
    } else {
      return nftIllstration;
    }
  }, [scrollEventActiveFlag]);
  const fetchEventDetail = useCallback(async () => {
    try {
      const res = await queryEventDetail({
        event: 'LINEA_DEFI_VOYAGE',
      });
      const { rc, result } = res;
      if (rc === 0) {
        setScrollEventPeriod({
          startTime: result.startTime,
          endTime: result.endTime,
        });

        //     "startTime": "1699819200000",
        // "endTime": "1700942400000",
        //   "ext": {
        //     "intractUrl": "https://www.intract.io/linea"
        // }
      }
    } catch {}
  }, []);
  useEffect(() => {
    fetchEventDetail();
  }, [fetchEventDetail]);

  return (
    <>
      <div className={formatCN}>
        <div className="left">
          <img className={formatImgCN} src={formatImgSrc} alt="" />
          <div className="bannerContent">
            <h3 className="ct">Linea DeFi Voyage : Proof of Humanity</h3>
            <div className="cn">
              <p>Get an attestation with a KYCed account on Binance</p>
              {scrollEventActiveFlag === 1 && <p>{formatPeriod}</p>}
            </div>
          </div>
        </div>
        <PButton
          text="Join Now"
          suffix={
            scrollEventActiveFlag === 1 && (
              <i className="iconfont icon-rightArrow"></i>
            )
          }
          onClick={onClick}
        />
      </div>
    </>
  );
});
export default AdSpace;
