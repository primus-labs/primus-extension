import React, {
  FC,
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { useSelector } from 'react-redux';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
// import iconShield from '@/assets/img/events/iconShield.svg';
import './index.scss';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';
import iconSuc from '@/assets/img/iconSuc.svg';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';
import iconQuestN from '@/assets/img/events/iconQuestN.svg';
import { queryEventDetail } from '@/services/api/event';
interface ClaimDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onChange: (step: number) => void;
  title?: string;
  titleIllustration?: boolean;
  subTitle?: string;
}

type StepItem = {
  id: number;
  icon: any;
  title: string;
  subTitle: string;
  finished?: boolean;
};
const stepList: StepItem[] = [
  {
    id: 1,
    icon: iconDataSourceOnChainAssets,
    title: 'Connected to',
    subTitle: '0x4EeF39D1c9f3c8928c8c289c3Dd55e579115221e',
    finished: true,
  },
  {
    id: 2,
    icon: iconDataSourceTwitter,
    title: 'Owns X account',
    subTitle: 'Connect your account to attest',
    finished: false,
  },
  {
    id: 3,
    icon: iconDataSourceBinance,
    title: 'Owns Binance account',
    subTitle: 'Connect your account to attest',
    finished: false,
  },
  {
    id: 4,
    icon: iconQuestN,
    title: 'Campaign check',
    subTitle: 'Finished all the PADO quests on QuestN',
    finished: false,
  },
];
const ClaimDialog: FC<ClaimDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    onChange,
    title = '',
    titleIllustration = false,
    subTitle = '',
  }) => {
    const [eventDetail, setEventDetail] = useState<any>();
    const [scrollEventHistoryObj, setScrollEventHistoryObj] = useState<any>({});
    // compaignQuestnCheckPageCheckFlag compaignCheckpageFlag
    const [activeStep, setActiveStep] = useState<number>();
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const proofX = useMemo(() => {
      let credArr = Object.values(credentialsFromStore);
      const haveXProof = credArr.find(
        (i) => i.event === 'SCROLL_LAUNCH_CAMPAIGN' && i.source === 'x'
      );
      return haveXProof;
    }, [credentialsFromStore]);
    const proofBinance = useMemo(() => {
      let credArr = Object.values(credentialsFromStore);
      const haveBinanceProof = credArr.find(
        (i) => i?.event === 'SCROLL_LAUNCH_CAMPAIGN' && i.source === 'binance'
      );
      return haveBinanceProof;
    }, [credentialsFromStore]);
    const formatStepList: StepItem[] = useMemo(() => {
      if (!!proofX) {
        stepList[1].finished = true;
      }
      if (!!proofBinance) {
        stepList[2].finished = true;
      }
      if (scrollEventHistoryObj?.compaignQuestnCheckPageCheckFlag) {
        stepList[3].finished = true;
      }
      return stepList;
    }, [
      proofX,
      proofBinance,
      scrollEventHistoryObj?.compaignQuestnCheckPageCheckFlag,
    ]);
    const btnCN = useMemo(() => {
      if (
        !!proofX &&
        !!proofBinance &&
        !!scrollEventHistoryObj?.compaignQuestnCheckPageCheckFlag
      ) {
        return '';
      } else {
        return 'gray';
      }
    }, [
      proofX,
      proofBinance,
      scrollEventHistoryObj?.compaignQuestnCheckPageCheckFlag,
    ]);

    const hanldeSubmit = useCallback(() => {
      if (!scrollEventHistoryObj?.campaignPageCheckFlag) {
        return;
      } else {
        if (btnCN === '') {
          onSubmit();
        }
      }
    }, [scrollEventHistoryObj?.campaignPageCheckFlag, onSubmit, btnCN]);
    const openWindow = (url: string) => {
      window.open(url);
    };
    const handleChange = useCallback(
      async (item: StepItem) => {
        if (!scrollEventHistoryObj?.campaignPageCheckFlag) {
          return;
        }
        if (item.id === 1) {
          return;
        }
        switch (item.id) {
          case 2:
            onChange(2);
            break;
          case 3:
            onChange(3);
            break;
          case 4:
            if (!scrollEventHistoryObj?.compaignQuestnCheckPageCheckFlag) {
              if (proofX && proofBinance) {
                openWindow(eventDetail?.ext?.compaignQuestnCheckPageUrl);
                setScrollEventHistoryFn({
                  compaignQuestnCheckPageCheckFlag: 1,
                });
              }
            }

            break;
        }
        setActiveStep(item.id);
      },
      [
        onChange,
        proofX,
        proofBinance,
        scrollEventHistoryObj,
        eventDetail?.ext?.compaignQuestnCheckPageUrl,
      ]
    );

    const liClassName = useCallback(
      (item: StepItem) => {
        let defaultCN = 'credTypeItem';

        if (item.id === activeStep) {
          defaultCN += ' active';
        }
        return defaultCN;
      },
      [activeStep]
    );
    const fetchEventDetail = useCallback(async () => {
      const res = await queryEventDetail({
        event: 'SCROLL_LAUNCH_CAMPAIGN',
      });
      const { rc, result } = res;
      if (rc === 0) {
        setEventDetail(result);
        //     "startTime": "1699819200000",
        // "endTime": "1700942400000",
        // "ext": {
        //   "campaignPageUrl": "https://padolabs.org",
        //   "compaignQuestnCheckPageUrl": "https://padolabs.org"
        // }
      }
    }, []);
    const setScrollEventHistoryFn = async (obj: object) => {
      const { scrollEvent } = await chrome.storage.local.get(['scrollEvent']);
      const scrollEventObj = scrollEvent ? JSON.parse(scrollEvent) : {};
      Object.assign(scrollEventObj, obj);
      chrome.storage.local.set({
        scrollEvent: JSON.stringify(scrollEventObj),
      });
      setScrollEventHistoryObj(scrollEventObj);
    };
    const onClickPage = async () => {
      if (
        scrollEventHistoryObj &&
        !scrollEventHistoryObj?.campaignPageCheckFlag
      ) {
        openWindow(eventDetail?.ext?.campaignPageUrl);
        setScrollEventHistoryFn({
          campaignPageCheckFlag: 1,
        });
      }
    };

    useEffect(() => {
      setScrollEventHistoryFn({});
    }, []);
    useEffect(() => {
      fetchEventDetail();
    }, [fetchEventDetail]);
    return (
      <PMask onClose={onClose}>
        <div
          className="padoDialog claimDialog claimScrollEventDialog"
          onClick={onClickPage}
        >
          <main>
            <div className="headerWrapper">
              <ClaimDialogHeaderDialog
                title={title}
                illustration={titleIllustration}
              />
            </div>
            <div className="descContent">
              <div className="tipWrapper">
                <p>The giveaway will be distributed through QuestN. </p>
                <p>
                  Check the <span>CAMPAIGN PAGE</span> first!
                </p>
                <p>Complete the following tasks to win your rewards!</p>
              </div>
              <ul className="credTypeList">
                {formatStepList.map((item) => (
                  <li
                    className={liClassName(item)}
                    onClick={() => {
                      handleChange(item);
                    }}
                    key={item.id}
                  >
                    <div className="innerContent">
                      <img className="icon" src={item.icon} alt="" />
                      <div className="con">
                        <h5 className="title">{item.title}</h5>
                        <h6 className="desc">{item.subTitle}</h6>
                      </div>
                      {item.finished && <img src={iconSuc} alt="" />}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="descWrapper">
                Bridge your ETH here:{' '}
                <a
                  href="https://scroll.io/bridge"
                  target="_blank"
                  rel="noreferrer"
                >
                  Scroll Bridge
                </a>{' '}
                or&nbsp;
                <a
                  href="https://www.orbiter.finance/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Orbiter Finance
                </a>
              </div>
            </div>
          </main>
          <footer>
            <PButton className={btnCN} text="Submit" onClick={hanldeSubmit} />
          </footer>
        </div>
      </PMask>
    );
  }
);
export default ClaimDialog;
