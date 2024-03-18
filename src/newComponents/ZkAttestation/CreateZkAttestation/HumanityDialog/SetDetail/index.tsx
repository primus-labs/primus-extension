import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HUMANITYVERIFICATIONCONTENTTYPELIST,
  HUMANITYVERIFICATIONCONTENTTYPEMAP,
  HUMANITYVERIFICATIONVALUETYPELIST,
  ALLVERIFICATIONCONTENTTYPEEMAP,
} from '@/config/attestation';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import {
  gt,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
} from '@/utils/utils';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';
import PTooltip from '@/newComponents/PTooltip';
import PInput from '@/newComponents/PInput';

import './index.scss';
type PswFormType = {
  verificationContent: '';
  verificationValue: '';
  account?: string;
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  // dataSourceId: string;
  presets: any;
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, presets }) => {
    const { dataSourceId } = presets;
    // const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    // console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo); //delete
    const dispatch: Dispatch<any> = useDispatch();
    const [activeDataSouceUserInfo, setActiveDataSouceUserInfo] =
      useState<any>();
    const [pswForm, setPswForm] = useState<PswFormType>({
      verificationContent: '',
      verificationValue: '',
      account: '',
    });
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const contentList = useMemo(() => {
      let supportedContentIdArr: any = [];

      if (dataSourceId === 'google') {
        supportedContentIdArr = ['Owns an account'];
      } else {
        supportedContentIdArr = Object.keys(
          HUMANITYVERIFICATIONCONTENTTYPEMAP
        ).filter((i) => {
          const contentObj = HUMANITYVERIFICATIONCONTENTTYPEMAP[i];
          const activeWebProofTemplate = webProofTypes.find(
            (i) =>
              i.dataSource === dataSourceId &&
              (i.name === contentObj.label ||
                i.name === contentObj.templateName)
          );
          return !!activeWebProofTemplate;
        });
      }
      let list = supportedContentIdArr.map(
        (i) => HUMANITYVERIFICATIONCONTENTTYPEMAP[i]
      );

      return list;
    }, [webProofTypes, dataSourceId]);
    const valueList = useMemo(() => {
      let list = [];
      if (pswForm.verificationContent === 'KYC Status') {
        list = [...HUMANITYVERIFICATIONVALUETYPELIST];
      } else if (pswForm.verificationContent === 'Owns an account') {
        list = [
          {
            label: 'N/A',
            value: 'N/A',
            // selected: true,
          },
        ];
      }
      return list;
    }, [pswForm.verificationContent]);
    const formLegal = useMemo(() => {
      return !!(pswForm.verificationContent && pswForm.verificationValue);
    }, [pswForm]);
    const loading = useMemo(() => {
      return formLegal && attestLoading === 1;
    }, [formLegal, attestLoading]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      if (loading) {
        return;
      }
      //different
      onSubmit(pswForm);
      return;
    }, [formLegal, pswForm, loading]);

    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);
    useEffect(() => {
      handleChangePswForm(
        activeDataSouceUserInfo?.userInfo?.userName,
        'account'
      );
    }, [activeDataSouceUserInfo]);

    useEffect(() => {
      if (!presets.verificationContent) {
        if (pswForm.verificationContent) {
          let newValue = '';

          if (pswForm.verificationContent === 'KYC Status') {
            newValue = 'Basic Verification';
          } else if (pswForm.verificationContent === 'Owns an account') {
            newValue = 'N/A';
          }
          handleChangePswForm(newValue, 'verificationValue');
        }
      }
    }, [pswForm.verificationContent, handleChangePswForm, presets]);
    useEffect(() => {
      setPswForm(presets);
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
    return (
      <div className="pFormWrapper detailForm3">
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
              className="verificationContent"
              label="Verification Content"
              align="horizontal"
              placeholder="Choose Data Source"
              list={contentList}
              onChange={(p) => {
                handleChangePswForm(p, 'verificationContent');
              }}
              value={pswForm.verificationContent}
              disabled={presets?.verificationContent}
              showSelf={false}
            />
          )}
        </div>
        <div
          className={`formItem ${presets.verificationValue ? 'preset' : ''} ${
            !presets.verificationContent && pswForm.verificationContent
              ? 'hasDefaultValue'
              : ''
          }`}
        >
          {pswForm.verificationContent ? (
            <>
              <div className="label">Verification Value</div>
              <div className="value">
                {presets.verificationValue || pswForm.verificationValue}
              </div>
            </>
          ) : (
            <PInput
              className="verificationValue"
              label="Verification Value"
              align="horizontal"
              placeholder="Input Value"
              onChange={(p) => {
                handleChangePswForm(p, 'verificationValue');
              }}
              value={pswForm.verificationValue}
              disabled={!pswForm.verificationContent}
            />
          )}
        </div>
        {activeDataSouceUserInfo?.userInfo && (
          <div className="staticItem">
            <label className="label">
              <span>Data Account</span>
              <PTooltip
                title={`Your ${
                  DATASOURCEMAP[presets.dataSourceId].name
                } UserID`}
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
              <div className="account">
                {activeDataSouceUserInfo?.userInfo?.userName}
              </div>
            </div>
          </div>
        )}

        <PButton
          text={attestLoading === 3 ? 'Try Again' : 'Next'}
          className="fullWidth confirmBtn"
          disabled={!formLegal}
          loading={formLegal && attestLoading === 1}
          onClick={handleClickNext}
        ></PButton>
      </div>
    );
  }
);

export default SetPwdDialog;
