import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { setAttestLoading, setActiveAttestation } from '@/store/actions';
import useMsgs from '@/hooks/useMsgs';
import {
  ASSETSVERIFICATIONCONTENTTYPELIST,
  ASSETSVERIFICATIONVALUETYPELIST,
  ASSETSVOLVERIFICATIONVALUETYPELIST,
  ASSETSVERIFICATIONCONTENTTYPEEMAP,
  ALLVERIFICATIONCONTENTTYPEEMAP,
} from '@/config/attestation';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import {
  mul,
  gt,
  gte,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
  getAccount,
} from '@/utils/utils';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';
import PTooltip from '@/newComponents/PTooltip';
import PInput from '@/newComponents/PInput';

import './index.scss';
import useAllSources from '@/hooks/useAllSources';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
type PswFormType = {
  dataSourceId: string;
  verificationContent: string;
  verificationValue: string;
  account: string;
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  // dataSourceId: string;
  presets: any;
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, presets }) => {
    const { deleteErrorMsgs } = useMsgs();
    const dataSourceId = presets.dataSourceId;
    // const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    const { tokenIconFn } = useAssetsStatistic();
    const [activeDataSouceUserInfo, setActiveDataSouceUserInfo] =
      useState<any>();
    console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo); //delete
    const dispatch: Dispatch<any> = useDispatch();
    const [pswForm, setPswForm] = useState<PswFormType>({
      verificationContent: '',
      verificationValue: '',
      account: '',
      dataSourceId: '',
    });
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const activeAttestation = useSelector(
      (state: UserState) => state.activeAttestation
    );
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const verificationValueTooltip = useMemo(() => {
      if (pswForm.verificationContent === 'Token Holding') {
        if (presets.dataSourceId === 'binance') {
          return 'Tokens in Spot account';
        } else {
          return '';
        }
      } else {
        return '';
      }
    }, [pswForm.verificationContent, presets.dataSourceId]);
    const verificationContentCN = useMemo(() => {
      let cN = 'verificationContent';
      const v = pswForm.verificationContent;
      if (v) {
        cN += ' hasValue';
      }
      return cN;
    }, [pswForm.verificationContent]);
    const verificationValueCN = useMemo(() => {
      let cN = 'verificationValue';
      const v = pswForm.verificationValue;
      if (v) {
        cN += ' hasValue';
      }
      return cN;
    }, [pswForm.verificationValue]);
    const contentList = useMemo(() => {
      let supportedContentIdArr: any = [];

      if (dataSourceId === 'coinbase') {
        supportedContentIdArr = ['Token Holding'];
        let list = supportedContentIdArr.map(
          (i) => ASSETSVERIFICATIONCONTENTTYPEEMAP[i]
        );
        return list;
      } else if (['bitget', 'bybit'].includes(dataSourceId)) {
        supportedContentIdArr = ['Spot 30-Day Trade Vol'];
        let list = supportedContentIdArr.map(
          (i) => ASSETSVERIFICATIONCONTENTTYPEEMAP[i]
        );
        return list;
      } else {
        return ASSETSVERIFICATIONCONTENTTYPELIST;
      }
    }, [
      dataSourceId,
      ASSETSVERIFICATIONCONTENTTYPEEMAP,
      ASSETSVERIFICATIONCONTENTTYPELIST,
    ]);
    const valueList = useMemo(() => {
      let list: any = [];
      if (pswForm.verificationContent === 'Assets Proof') {
        list = [...ASSETSVERIFICATIONVALUETYPELIST];
      } else if (pswForm.verificationContent === 'Token Holding') {
        if (activeDataSouceUserInfo) {
          let symbolList: any[] = [];
          if (dataSourceId === 'okx') {
            symbolList = Object.values(
              activeDataSouceUserInfo.tokenListMap
            ).map((i: any) => i.symbol);
          } else if (dataSourceId === 'binance') {
            symbolList = Object.keys(
              activeDataSouceUserInfo.tradingAccountFreeTokenAmountObj
            ).filter((t) => {
              const curVal = mul(
                Number(
                  activeDataSouceUserInfo.tradingAccountFreeTokenAmountObj[t]
                ),
                activeDataSouceUserInfo.tokenPriceMap[t]
              ).toFixed();
              const f = gt(Number(curVal), 0.01);
              return f;
            });
            // symbolList = Object.keys(
            //   activeDataSouceUserInfo.spotAccountTokenMap
            // ).filter((t) => {
            //   const f = gt(
            //     Number(activeDataSouceUserInfo.spotAccountTokenMap[t].value),
            //     0.01
            //   );
            //   return f;
            // });
          } else {
            symbolList = Object.keys(
              activeDataSouceUserInfo.tokenListMap
            ).filter((t) => {
              const f = gt(
                Number(activeDataSouceUserInfo.spotAccountTokenMap[t].value),
                0.01
              );
              return f;
            });
          }
          list = symbolList.map((i) => ({
            label: i,
            value: i,
            icon: tokenIconFn({ symbol: i }, dataSourceId),
          }));
        }
      } else if (pswForm.verificationContent === 'Spot 30-Day Trade Vol') {
        list = [...ASSETSVOLVERIFICATIONVALUETYPELIST];
      }
      console.log('222valueList', list, pswForm.verificationContent);
      return list;
    }, [pswForm.verificationContent, activeDataSouceUserInfo]);

    const activeAccount = useMemo(() => {
      if (activeDataSouceUserInfo) {
        const metaInfo = DATASOURCEMAP[dataSourceId];
        const acc = getAccount(metaInfo, activeDataSouceUserInfo);
        return acc;
      } else {
        return '';
      }
    }, [activeDataSouceUserInfo]);
    const totalBalanceForAttest = useMemo(() => {
      let totalBalance = '0';
      if (activeDataSouceUserInfo) {
        if (dataSourceId === 'binance') {
          totalBalance = getTotalBalFromNumObjAPriceObj(
            activeDataSouceUserInfo?.tradingAccountTokenAmountObj,
            activeDataSouceUserInfo?.tokenPriceMap
          );
        } else {
          totalBalance = activeDataSouceUserInfo?.totalBalance;
        }
      }

      return totalBalance;
    }, [dataSourceId, activeDataSouceUserInfo]);
    const formLegal = useMemo(() => {
      let valueLegal = true;
      if (pswForm.verificationContent === 'Assets Proof') {
        if (activeDataSouceUserInfo) {
          valueLegal = gt(
            Number(totalBalanceForAttest),
            Number(pswForm.verificationValue)
          );
        }
      }
      if (pswForm.verificationContent === 'Spot 30-Day Trade Vol') {
        if (activeDataSouceUserInfo) {
          // gte DEL!!!-TEST-spot30dVol
          valueLegal = gt(
            Number(activeDataSouceUserInfo.spot30dVol),
            Number(pswForm.verificationValue)
          );
        }
      }

      return (
        !!(pswForm.verificationContent && pswForm.verificationValue) &&
        valueLegal
      );
    }, [pswForm, activeDataSouceUserInfo, totalBalanceForAttest]);
    const loading = useMemo(() => {
      return formLegal && attestLoading === 1;
    }, [formLegal, attestLoading]);

    const formatBtnTxt = useMemo(() => {
      return attestLoading === 3
        ? activeAttestation?.msgObj?.btnTxt
          ? activeAttestation?.msgObj?.btnTxt
          : 'OK'
        : 'To Verify';
    }, [attestLoading, activeAttestation]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      if (loading) {
        return;
      }
      deleteErrorMsgs();
      if (formatBtnTxt === 'OK') {
        dispatch(setAttestLoading(2));
        dispatch(setActiveAttestation(undefined));
      } else {
        //different
        if (
          pswForm.verificationContent === 'Assets Proof' &&
          activeDataSouceUserInfo &&
          gt(Number(pswForm.verificationValue), Number(totalBalanceForAttest))
        ) {
          // alert('Not met the requirements');
          return;
          // setActiveRequest({
          //   type: 'warn',
          //   title: 'Not met the requirements',
          //   desc: (
          //     <>
          //       <p>
          //         Insufficient assets in your{' '}
          //         {source === 'okx' ? 'Trading' : 'Spot'} Account.
          //       </p>
          //       <p>Please confirm and try again later.</p>
          //     </>
          //   ),
          // });
          // return;
        }

        onSubmit(pswForm);
      }

      return;
    }, [
      formLegal,
      pswForm,
      activeDataSouceUserInfo,
      totalBalanceForAttest,
      loading,
    ]);

    const handleChangePswForm = useCallback(
      (v, formKey, upperFlag?: boolean) => {
        setPswForm((f) => {
          const newV = upperFlag ? v.toUpperCase() : v;
          const newForm = { ...f, [formKey]: newV };
          console.log('newForm', f, newForm);
          return newForm;
        });
      },
      []
    );
    useEffect(() => {
      if (activeDataSouceUserInfo?.userInfo?.userName) {
        handleChangePswForm(
          activeDataSouceUserInfo?.userInfo?.userName,
          'account'
        );
      }
    }, [activeDataSouceUserInfo]);

    useEffect(() => {
      if (!presets.verificationContent) {
        if (pswForm.verificationContent) {
          handleChangePswForm('', 'verificationValue');
        }
      }
    }, [pswForm.verificationContent, handleChangePswForm, presets]);
    useEffect(() => {
      if (presets) {
        setPswForm((f) => ({ ...f, ...presets }));
      }
    }, [presets]);
    const initActiveDataSouceUserInfo = useCallback(async () => {
      const res = await chrome.storage.local.get([dataSourceId]);
      if (res[dataSourceId]) {
        setActiveDataSouceUserInfo(JSON.parse(res[dataSourceId]));
      }
    }, []);
    useEffect(() => {
      initActiveDataSouceUserInfo();
    }, []);
    useEffect(() => {
      initActiveDataSouceUserInfo();
    }, []);
    const initAttestLoadingFn = useCallback(() => {
      if (attestLoading > 1) {
        dispatch(setAttestLoading(0));
      }
    }, [attestLoading, dispatch]);
    useEffect(() => {
      initAttestLoadingFn();
    }, [pswForm]);

    return (
      <div className="pFormWrapper detailForm">
        <div
          className={`formItem ${presets.verificationContent ? 'preset' : ''}`}
        >
          {presets.verificationContent ? (
            <>
              <div className="label">Verification Content</div>
              <div className="value">
                {
                  ALLVERIFICATIONCONTENTTYPEEMAP[presets.verificationContent]
                    .label
                }
              </div>
            </>
          ) : (
            <PSelect
              className={verificationContentCN}
              label="Verification Content"
              align="horizontal"
              placeholder="Select content"
              list={contentList}
              onChange={(p) => {
                handleChangePswForm(p, 'verificationContent');
              }}
              value={pswForm.verificationContent}
              disabled={presets?.verificationContent}
            />
          )}
        </div>
        <div className="formItem">
          {pswForm.verificationContent ? (
            activeDataSouceUserInfo ? (
              <PSelect
                className={verificationValueCN}
                label="Verification Condition"
                align="horizontal"
                placeholder="Select value"
                list={valueList}
                onChange={(p) => {
                  handleChangePswForm(p, 'verificationValue');
                }}
                value={pswForm.verificationValue}
                disabled={presets?.verificationValue}
                tooltip={
                  verificationValueTooltip
                    ? { text: verificationValueTooltip }
                    : null
                }
              />
            ) : pswForm.verificationContent === 'Token Holding' ? (
              <PInput
                className={verificationValueCN}
                label="Verification Condition"
                align="horizontal"
                placeholder="USDT"
                onChange={(p) => {
                  handleChangePswForm(p, 'verificationValue', true);
                }}
                value={pswForm.verificationValue}
                disabled={!pswForm.verificationContent}
                tooltip={
                  verificationValueTooltip
                    ? { text: verificationValueTooltip }
                    : null
                }
              />
            ) : (
              <PSelect
                className={verificationValueCN}
                label="Verification Condition"
                align="horizontal"
                placeholder="Select value"
                list={valueList}
                onChange={(p) => {
                  handleChangePswForm(p, 'verificationValue');
                }}
                value={pswForm.verificationValue}
                disabled={presets?.verificationValue}
                tooltip={
                  verificationValueTooltip
                    ? { text: verificationValueTooltip }
                    : null
                }
              />
            )
          ) : (
            <PSelect
              className={verificationValueCN}
              label="Verification Condition"
              align="horizontal"
              placeholder="Select value"
              list={valueList}
              onChange={(p) => {
                handleChangePswForm(p, 'verificationValue');
              }}
              value={pswForm.verificationValue}
              disabled={presets?.verificationValue}
              tooltip={
                verificationValueTooltip
                  ? { text: verificationValueTooltip }
                  : null
              }
            />
          )}
        </div>
        {activeAccount && (
          <div className="staticItem">
            <label className="label">
              <span>Data Account</span>
              <PTooltip
                title={`Your ${DATASOURCEMAP[presets.dataSourceId].name} ${
                  presets.dataSourceId === 'coinbase' ? 'API Key' : 'UserID'
                }`}
              >
                <PButton
                  type="icon"
                  icon={<i className="iconfont icon-iconInfo"></i>}
                  onClick={() => {}}
                  className="infoBtn"
                />
              </PTooltip>
            </label>
            <div className="value">
              <div className="account">{activeAccount}</div>
              {pswForm.verificationContent === 'Assets Proof' && (
                <div className="balance">
                  ${new BigNumber(totalBalanceForAttest).toFixed(2)}
                </div>
              )}
              {pswForm.verificationContent === 'Spot 30-Day Trade Vol' && (
                <div className="balance">
                  $
                  {new BigNumber(activeDataSouceUserInfo.spot30dVol).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}
        <PButton
          text={formatBtnTxt}
          className="fullWidth confirmBtn"
          disabled={!formLegal}
          loading={loading}
          onClick={handleClickNext}
        ></PButton>
      </div>
    );
  }
);

export default SetPwdDialog;
