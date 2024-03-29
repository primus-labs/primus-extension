import React, {
  FC,
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
import './index.scss';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';
import iconSuc from '@/assets/img/iconSuc.svg';
import iconStep1 from '@/assets/img/events/iconStep1.svg';
import iconStep2 from '@/assets/img/events/iconStep2.svg';
import iconStep3 from '@/assets/img/events/iconStep3.svg';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';
import { SCROLLEVENTNAME } from '@/config/constants';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import { switchAccount } from '@/services/wallets/metamask';
import { ETHSIGNEVENTNAME } from '@/config/constants';
import type { Dispatch } from 'react';
import useEventDetail from '@/hooks/useEventDetail';
dayjs.extend(utc);
interface ClaimDialogProps {
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
  extra?: string;
};

const stepList: StepItem[] = [
  {
    id: 1,
    icon: iconDataSourceOnChainAssets,
    title: 'Participate address',
    subTitle: '',
    finished: true,
  },
  {
    id: 2,
    icon: iconStep1,
    title: 'Follow PADO social media',
    subTitle: 'Authorize twitter and discord',
    finished: false,
  },
  {
    id: 3,
    icon: iconStep2,
    title: 'Attest your social engagement',
    subTitle: 'Attest your X follower number',
    finished: false,
  },
  {
    id: 4,
    icon: iconStep3,
    title: 'Submit on-chain',
    subTitle: 'Submit to opBNB',
    finished: false,
  },
];
const ClaimDialog: FC<ClaimDialogProps> = memo(
  ({ onSubmit, onChange, title = '', titleIllustration = false }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('fromEvents') as string;
    const [PADOTabId, setPADOTabId] = useState<number>();
    const [xTabId, setXTabId] = useState<number>();
    const [credNum, setCredNum] = useState<number>(0);
    const [credAddress, setCredAddress] = useState<string>();
    const [stepObj, setStepObj] = useState<any>({
      step1: 0,
      step2: 0,
      step3: 0,
    });
    const [errorTip, setErrorTip] = useState<string>();

    const [BASEventDetail] = useEventDetail(ETHSIGNEVENTNAME);
    const BASEventPeriod = useMemo(() => {
      if (BASEventDetail?.startTime) {
        const { startTime, endTime } = BASEventDetail;
        return {
          startTime,
          endTime,
        };
      } else {
        return {};
      }
    }, [BASEventDetail]);
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

    const formatStepList: StepItem[] = useMemo(() => {
      if (credAddress) {
        stepList[0].subTitle = credAddress;
      } else {
        stepList[0].subTitle = connectedWallet?.address;
      }
      stepList[1].finished = stepObj.step1 === 1;

      stepList[2].finished = stepObj.step2 === 1;
      stepList[2].extra = `${credNum}/4`;
      stepList[3].finished = stepObj.step3 === 1;
      const newArr = [...stepList];
      return newArr;
    }, [connectedWallet?.address, stepObj, credNum, credAddress]);
    const isComplete = useMemo(() => {
      const hasComplete = formatStepList.every((i) => i.id === 1 || i.finished);
      return hasComplete;
    }, [formatStepList]);
    const btnCN = useMemo(() => {
      return isComplete ? '' : 'gray';
    }, [isComplete]);
    const btcTxt = useMemo(() => {
      // if (eventActiveFlag === 1) {
      //   return 'Claim your points';
      // } else {
      //   return 'Complete';
      // }
      return 'OK';
    }, [eventActiveFlag]);

    const isSwitchable = useMemo(() => {
      return credNum === 0;
    }, [credNum]);
    const eventPlateUrl = useMemo(() => {
      return BASEventDetail?.ext?.claimPointsUrl;
    }, [BASEventDetail]);

    const hanldeSubmit = useCallback(() => {
      if (!isComplete) {
        setErrorTip('Please complete the tasks above first.');
      } else {
        if (eventActiveFlag === 1) {
          window.open(eventPlateUrl); // TODO-basevent
        }
        onSubmit();
        navigate('/cred', { replace: true });
      }
    }, [isComplete, onSubmit, eventActiveFlag, eventPlateUrl, navigate]);

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
      [isSwitchable, formatStepList]
    );

    const onSwitchAccount = useCallback(() => {
      if (isSwitchable) {
        switchAccount(connectedWallet?.provider);
      }
    }, [connectedWallet, isSwitchable]);
    const onFollowX = useCallback(async () => {
      const targetUrl =
        'https://twitter.com/intent/follow?screen_name=padolabs';
      const openXUrlFn = async () => {
        const currentWindowTabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        setPADOTabId(currentWindowTabs[0].id);
        const tabCreatedByPado = await chrome.tabs.create({
          url: targetUrl,
        });

        console.log(
          '222123 create tab',
          tabCreatedByPado.id,
          currentWindowTabs[0].id
        );
        setXTabId(tabCreatedByPado.id);
      };
      if (xTabId) {
        try {
          await chrome.tabs.update(xTabId as number, {
            active: true,
          });
          return;
        } catch {
          await openXUrlFn();
          return;
        }
      }
      await openXUrlFn();
    }, [xTabId]);
    const handleChange = useCallback(
      async (item: StepItem) => {
        if (item.finished && item.id !== 3) {
          return;
        }
        if (item.id === 1) {
          return;
        } else if (item.id === 2) {
          if (!item.finished) {
            onChange(item.id);
          }

          // onFollowX();
        } else if (item.id === 3) {
          if (!formatStepList[1].finished) {
            setErrorTip('Please complete the tasks above first.');
            return;
          }
          if (formatStepList[3].finished) {
            return;
          }
          onChange(item.id);
        } else if (item.id === 4) {
          if (!formatStepList[2].finished) {
            setErrorTip('Please complete the tasks above first.');
            return;
          }
          if (!item.finished) {
            onChange(item.id);
          }
        }
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
      chrome.storage.local.get([ETHSIGNEVENTNAME], (res) => {
        if (res[ETHSIGNEVENTNAME]) {
          const lastInfo = JSON.parse(res[ETHSIGNEVENTNAME]);
          console.log('222ClaimDialog useEffect', lastInfo);
          const newObj = lastInfo.steps.reduce((prev, curr, currK) => {
            prev[`step${currK + 1}`] = curr.status;
            return prev;
          }, {});
          setStepObj(newObj);
          setCredNum(Object.values(lastInfo.steps[1].tasks).length);
          setCredAddress(lastInfo.address);
        }
      });
    }, []);

    return (
      <PMask closeable={false}>
        <div className="padoDialog claimDialog claimScrollEventDialog claimEthSignEventDialog ">
          <main>
            <div className="headerWrapper">
              <ClaimDialogHeaderDialog
                title={title}
                illustration={titleIllustration}
              />
            </div>
            <div className="descContent">
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

              <p className="tip">
                Bridge your opBNB here: &nbsp;
                <a href="https://opbnb-bridge.bnbchain.org/deposit">
                  opBNB Bridge
                </a>
              </p>
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
