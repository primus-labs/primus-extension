import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HUMANITYVERIFICATIONCONTENTTYPELIST,
  HUMANITYVERIFICATIONCONTENTTYPEMAP,
  HUMANITYVERIFICATIONVALUETYPELIST,
  ALLVERIFICATIONCONTENTTYPEEMAP,
} from '@/config/attestation';
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
    const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo); //delete
    const dispatch: Dispatch<any> = useDispatch();
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

    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      //different
      onSubmit(pswForm);
      return;
    }, [formLegal, pswForm]);

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
      if (!presets) {
        if (pswForm.verificationContent) {
          let newValue = '';
          if (pswForm.verificationContent === 'Owns an account') {
            newValue = 'N/A';
          }
          handleChangePswForm(newValue, 'verificationValue');
        }
      }
    }, [pswForm.verificationContent, handleChangePswForm, presets]);
    useEffect(() => {
      setPswForm(presets);
    }, [presets]);
    return (
      <div className="pFormWrapper detailForm3">
        <div className="formItem">
          <PSelect
            className="verificationContent"
            label="Verification Content"
            align="horizontal"
            placeholder="Select Content"
            list={contentList}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationContent');
            }}
            value={pswForm.verificationContent}
            disabled={presets?.verificationContent}
            showSelf={false}
          />
        </div>
        <div className="formItem">
          <PSelect
            className="verificationValue"
            label="Verification Value"
            align="horizontal"
            placeholder="Select Value"
            list={valueList}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationValue');
            }}
            value={pswForm.verificationValue}
            disabled={presets?.verificationValue}
            showSelf={false}
          />
        </div>
        {activeDataSouceUserInfo?.userInfo && (
          <div className="staticItem">
            <label>Account</label>
            
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
