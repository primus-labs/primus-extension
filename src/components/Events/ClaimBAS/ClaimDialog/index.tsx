import React, {
  FC,
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { useSelector, useNavigate, useDispatch } from 'react-redux';

import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
// import iconShield from '@/assets/img/events/iconShield.svg';
import './index.scss';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';
import iconSuc from '@/assets/img/iconSuc.svg';
import iconStep1 from '@/assets/img/events/iconStep1.svg';
import iconStep2 from '@/assets/img/events/iconStep2.svg';
import iconStep3 from '@/assets/img/events/iconStep3.svg';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';
import { queryEventDetail } from '@/services/api/event';
import { SCROLLEVENTNAME } from '@/config/constants';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import { switchAccount } from '@/services/wallets/metamask';
import { BASEVENTNAME } from '@/config/constants';
import useAuthorization from '@/hooks/useAuthorization';
import { setSocialSourcesAsync } from '@/store/actions';
import type { Dispatch } from 'react';
dayjs.extend(utc);
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
    subTitle: '',
    finished: true,
  },
  {
    id: 2,
    icon: iconStep1,
    title: 'Follow @padolabs',
    subTitle: 'Authorize twitter and follow @padolabs',
    finished: false,
  },
  {
    id: 3,
    icon: iconStep2,
    title: 'Complete Attestation',
    subTitle: 'Choose POH tasks to attest',
    finished: false,
  },
  {
    id: 4,
    icon: iconStep3,
    title: 'Submit Attestation ',
    subTitle: 'Submit to BSC or Greenfield',
    finished: false,
  },
];
const ClaimDialog: FC<ClaimDialogProps> = memo(
  ({ onClose, onSubmit, onChange, title = '', titleIllustration = false }) => {
    const [xTabId, setXTabId] = useState<number>();
    const [stepObj, setStepObj] = useState<any>({
      step1: 0,
      step2: 0,
      step3: 0,
    });
    const [errorTip, setErrorTip] = useState<string>();
    const [eventDetail, setEventDetail] = useState<any>({ ext: {} });
    
    const [activeStep, setActiveStep] = useState<number>();
    const dispatch: Dispatch<any> = useDispatch();
    const socialSources = useSelector(
      (state: UserState) => state.socialSources
    );

    const BASEventPeriod = useSelector(
      (state: UserState) => state.BASEventPeriod
    );
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );

    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const eventActiveFlag = useMemo(() => {
      const { startTime, endTime } = BASEventPeriod;
      const isActive =
        dayjs().isAfter(dayjs(+startTime)) && dayjs().isBefore(dayjs(+endTime));
      const isEnd = dayjs().isAfter(dayjs(+endTime));
      if (isActive) {
        return 1;
      }
      if (isEnd) {
        return 2;
      }
      return 0;
    }, [BASEventPeriod]);
    const proofX = useMemo(() => {
      let credArr: CredTypeItemType[] = Object.values(credentialsFromStore);
      const haveXProof = credArr.find(
        (i: any) => i.event === SCROLLEVENTNAME && i.source === 'x'
      );
      return haveXProof;
    }, [credentialsFromStore]);
    const proofBinance = useMemo(() => {
      let credArr: CredTypeItemType[] = Object.values(credentialsFromStore);
      const haveBinanceProof = credArr.find(
        (i: any) => i?.event === SCROLLEVENTNAME && i.source === 'binance'
      );
      return haveBinanceProof;
    }, [credentialsFromStore]);
    const addressForScrollEvent = useMemo(() => {
      let addr = '';
      if (!!proofX) {
        addr = proofX.address;
      }
      if (!!proofBinance) {
        addr = proofBinance.address;
      }
      return addr;
    }, [proofX, proofBinance]);
    const formatStepList: StepItem[] = useMemo(() => {
      if (!proofX && !proofBinance && connectedWallet?.address) {
        stepList[0].subTitle = connectedWallet?.address;
      } else {
        stepList[0].subTitle = addressForScrollEvent;
      }
      stepList[1].finished = stepObj.step1 === 1;

      stepList[2].finished = stepObj.step2 === 1;

      stepList[3].finished = stepObj.step3 === 1;
      const newArr = [...stepList];
      return newArr;
    }, [
      proofX,
      proofBinance,
      connectedWallet?.address,
      addressForScrollEvent,
      stepObj,
    ]);
    const isComplete = useMemo(() => {
      const hasComplete = formatStepList.every((i) => i.id === 1 || i.finished);
      return hasComplete;
    }, [formatStepList]);
    const btnCN = useMemo(() => {
      return isComplete ? '' : 'gray';
    }, [isComplete]);
    const btcTxt = useMemo(() => {
      if (eventActiveFlag === 1) {
        return 'Claim your points';
      } else {
        return 'Complete';
      }
    }, [eventActiveFlag]);

    const isSwitchable = useMemo(() => {
      

      return true;
    }, []);

    const authorize = useAuthorization();

    const hanldeSubmit = useCallback(() => {
      if (!isComplete) {
        setErrorTip('Please complete the tasks above first.');
      } else {
        if (eventActiveFlag === 1) {
          window.open(eventDetail.ext.claimPointsUrl); // TODO!!!
        }
        onSubmit();
      }
    }, [isComplete, onSubmit, eventActiveFlag, eventDetail.ext.claimPointsUrl]);

    const liClassName = useCallback(
      (item: StepItem) => {
        let defaultCN = 'credTypeItem';

        // if (item.id === activeStep) {
        //   defaultCN += ' active';
        // }
        if (item.id === 1) {
          isSwitchable && (defaultCN += ' clickable');
        }
        if (item.id === 2) {
          !formatStepList[1].finished && (defaultCN += ' clickable');
        }
        if (item.id === 3) {
          !formatStepList[2].finished && (defaultCN += ' clickable');
        }
        if (item.id === 4) {
          !formatStepList[3].finished && (defaultCN += ' clickable');
        }
        return defaultCN;
      },
      [
        isSwitchable,
        formatStepList
      ]
    );
    const fetchEventDetail = useCallback(async () => {
      try {
        const res = await queryEventDetail({
          event: BASEVENTNAME,
        });
        const { rc, result } = res;
        if (rc === 0) {
          setEventDetail(result);
          //     "startTime": "1699819200000",
          // "endTime": "1700942400000",
          // "ext": {
          //   "claimPointsUrl": "https://padolabs.org",
          //   "scoreList": "https://padolabs.org"
          // }
        }
      } catch {}
    }, []);

    const onSwitchAccount = useCallback(() => {
      if (isSwitchable) {
        switchAccount(connectedWallet?.provider);
      }
    }, [connectedWallet, isSwitchable]);
    const onFollowX = useCallback(async () => {
      if (xTabId) {
        await chrome.tabs.update(xTabId as number, {
          active: true,
        });
        return;
      }
      const targetUrl =
        'https://twitter.com/intent/follow?screen_name=padolabs';
      const openXUrlFn = async () => {
        const tabCreatedByPado = await chrome.tabs.create({
          url: targetUrl,
        });
        console.log('222123 create tab', tabCreatedByPado.id);
        setXTabId(tabCreatedByPado.id);
      };
      if (socialSources['x']) {
        await openXUrlFn();
      } else {
        authorize('X', async () => {
          dispatch(setSocialSourcesAsync());
          await openXUrlFn();
        });
      }
    }, [socialSources, authorize, dispatch]);
    const handleChange = useCallback(
      async (item: StepItem) => {
        if (item.finished) {
          return;
        }
        if (item.id === 1) {
          return;
        } else if (item.id === 2) {
          onFollowX();
        } else if (item.id === 3) {
          if (!formatStepList[1].finished) {
            setErrorTip('Please complete the tasks above first.');
            return;
          }
          if (!item.finished) {
            onChange(item.id);
          }
        } else if (item.id === 4) {
          if (!formatStepList[2].finished) {
            setErrorTip('Please complete the tasks above first.');
            return;
          }
          if (!item.finished) {
            onChange(item.id);
          }
        }
        setActiveStep(item.id);
      },
      [onChange, onFollowX, formatStepList]
    );
    const optionButton = useCallback(
      (item) => {
        let btn;
        switch (item.id) {
          case 1:
            btn = (
              <PButton
                className={isSwitchable ? 'switchBtn' : 'switchBtn disabled'}
                text="Switch"
                onClick={onSwitchAccount}
              />
            );
            break;
          case 2:
            btn = (
              <PButton
                className={'switchBtn'}
                text="Follow"
                onClick={() => {
                  handleChange(item);
                }}
              />
            );
            break;
          case 3:
            btn = (
              <PButton
                className={'switchBtn'}
                text="Attest"
                onClick={() => {
                  handleChange(item);
                }}
              />
            );
            break;
          case 4:
            btn = (
              <PButton
                className={'switchBtn'}
                text="Submit"
                onClick={() => {
                  handleChange(item);
                }}
              />
            );
            break;
        }
        return btn;
      },
      [isSwitchable, onSwitchAccount, handleChange]
    );

    useEffect(() => {
      fetchEventDetail();
    }, [fetchEventDetail]);

    useEffect(() => {
      console.log('222ClaimDialog useEffect');

      chrome.storage.local.get([BASEVENTNAME], (res) => {
        if (res[BASEVENTNAME]) {
          const lastInfo = JSON.parse(res[BASEVENTNAME]);
          // console.log('222111', lastInfo);
          const newObj = lastInfo.steps.reduce((prev, curr, currK) => {
            prev[`step${currK + 1}`] = curr.status;
            return prev;
          }, {});
          setStepObj(newObj);
        }
      });
    }, []);

    useEffect(() => {
      const listerFn = async (message, sender, sendResponse) => {
        console.log('ClaimBAS onMessage message', message);
        if (message.type === 'xFollow' && message.name === 'follow') {
          const res = await chrome.storage.local.get([BASEVENTNAME]);
          if (res[BASEVENTNAME]) {
            const lastInfo = JSON.parse(res[BASEVENTNAME]);
            lastInfo.steps[0].status = 1;
            await chrome.storage.local.set({
              [BASEVENTNAME]: JSON.stringify(lastInfo),
            });
            setStepObj((obj) => ({ ...obj, step1: 1 }));
            console.log('222123tabdId', xTabId);
            const xTab = await chrome.tabs.get(xTabId as number);
            if (xTab) {
              setXTabId(undefined);
              await chrome.tabs.remove(xTabId as number);
            }
          }
        }
      };
      chrome.runtime.onMessage.addListener(listerFn);
      return () => {
        chrome.runtime.onMessage.removeListener(listerFn);
      };
    }, [xTabId]);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog claimDialog claimScrollEventDialog claimBASEventDialog">
          <main>
            <div className="headerWrapper">
              <ClaimDialogHeaderDialog
                title={title}
                illustration={titleIllustration}
              />
            </div>
            <div className="descContent">
              <p className="attensionTip">
                Follow the 3 steps to enjoy your BAS campaign.
              </p>
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
                      {/* {item.id === 1 && optionButton(item)} */}
                      {item.id !== 1 && item.finished ? (
                        <img src={iconSuc} alt="" />
                      ) : (
                        optionButton(item)
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </main>
          <footer>
            <PButton
              className={btnCN}
              text={btcTxt}
              suffix={
                isComplete && <i className="iconfont icon-rightArrow"></i>
              }
              onClick={hanldeSubmit}
            />
            {errorTip && <PBottomErrorTip text={errorTip} />}
          </footer>
        </div>
      </PMask>
    );
  }
);
export default ClaimDialog;
