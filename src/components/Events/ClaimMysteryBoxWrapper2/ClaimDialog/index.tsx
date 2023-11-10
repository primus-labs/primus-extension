import React, {
  FC,
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { useSelector } from 'react-redux';
import PRadioNew from '@/components/PRadioNew';
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
import { SCROLLEVENTNAME } from '@/config/constants';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import { switchAccount } from '@/services/wallets/metamask';
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

const agreeList = [
  {
    label: 'Fully acknowledged.',
    disabled: false,
    defaultValue: false,
  },
];
const stepList: StepItem[] = [
  {
    id: 1,
    icon: iconDataSourceOnChainAssets,
    title: 'Connected to',
    subTitle: '',
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
    const [errorTip, setErrorTip] = useState<string>();
    const [eventDetail, setEventDetail] = useState<any>();
    const [scrollEventHistoryObj, setScrollEventHistoryObj] = useState<any>({});
    // compaignQuestnCheckPageCheckFlag compaignCheckpageFlag
    const [activeStep, setActiveStep] = useState<number>();
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const proofX = useMemo(() => {
      let credArr = Object.values(credentialsFromStore);
      const haveXProof = credArr.find(
        (i) => i.event === SCROLLEVENTNAME && i.source === 'x'
      );
      return haveXProof;
    }, [credentialsFromStore]);
    const proofBinance = useMemo(() => {
      let credArr = Object.values(credentialsFromStore);
      const haveBinanceProof = credArr.find(
        (i) => i?.event === SCROLLEVENTNAME && i.source === 'binance'
      );
      return haveBinanceProof;
    }, [credentialsFromStore]);
    const formatStepList: StepItem[] = useMemo(() => {
      if (connectedWallet?.address) {
        stepList[0].subTitle = connectedWallet?.address;
      }
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
      connectedWallet?.address,
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
    const isSwitchable = useMemo(() => {
      const haveProof = [formatStepList[1], formatStepList[2]].some(
        (i) => i.finished
      );
      return !haveProof;
    }, [formatStepList]);

    const hanldeSubmit = useCallback(() => {
      if (!scrollEventHistoryObj?.campaignPageCheckFlag) {
        setErrorTip('Please check the checkbox to proceed with the tasks.');
      } else if (!proofX || !proofBinance) {
        setErrorTip('Please complete the task above first.');
      } else {
        onSubmit();
      }
    }, [
      scrollEventHistoryObj?.campaignPageCheckFlag,
      proofX,
      proofBinance,
      onSubmit,
    ]);
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
            if (!item.finished) {
                onChange(2);
            }
            
            break;
          case 3:
            if (!item.finished) {
              onChange(3);
            }
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
        event: SCROLLEVENTNAME,
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
      openWindow(eventDetail?.ext?.campaignPageUrl);
    };
    const onSwitchAccount = useCallback(() => {
      if (isSwitchable) {
        switchAccount(connectedWallet?.provider);
      }
    }, [connectedWallet, isSwitchable]);
    const handleChangeAgree = useCallback((label: string | undefined) => {
      if (label && label !== 'All') {
        setScrollEventHistoryFn({
          campaignPageCheckFlag: 1,
        });
      }
    }, []);

    useEffect(() => {
      setScrollEventHistoryFn({});
    }, []);
    useEffect(() => {
      fetchEventDetail();
    }, [fetchEventDetail]);
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog claimDialog claimScrollEventDialog">
          <main>
            <div className="headerWrapper">
              <ClaimDialogHeaderDialog
                title={title}
                illustration={titleIllustration}
              />
            </div>
            <div className="descContent">
              <div className="tipWrapper">
                <p onClick={onClickPage}>
                  The giveaway will be distributed through QuestN. Please check
                  the <span>CAMPAIGN PAGE</span> and make sure that your
                  connected address is the same!{' '}
                </p>
                <div className="aggreeWrapper">
                  <PRadioNew
                    onChange={handleChangeAgree}
                    list={agreeList}
                    type="checkbox"
                  />
                </div>
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
                      {item.id === 1 ? (
                        <PButton
                          className={isSwitchable ? 'switchBtn' : 'switchBtn disabled'}
                          text="Switch"
                          onClick={onSwitchAccount}
                        />
                      ) : (
                        item.finished && <img src={iconSuc} alt="" />
                      )}
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
            {errorTip && <PBottomErrorTip text={errorTip} />}
          </footer>
        </div>
      </PMask>
    );
  }
);
export default ClaimDialog;
