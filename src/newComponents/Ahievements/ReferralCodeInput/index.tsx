import React, { memo } from 'react';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import './index.scss';
import { Input, Form } from 'antd';
import PButton from '@/newComponents/PButton';
import { finishTask } from '@/services/api/achievements';
import useMsgs from '@/hooks/useMsgs';

// import { Button, Input } from 'antd';

interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
  setReferralTaskFinished: any;

}


const ReferralCodeInput: React.FC<PButtonProps> = memo(
  ({ onClose, setReferralTaskFinished }) => {
    const [referralCode, setReferralCode] = React.useState('');
    const [form] = Form.useForm();
    const { msgs, addMsg } = useMsgs();
    const PasteButton = () => {
      return (
        <div> Paste </div>
      );
    };

    const handlePaste = () => {
      navigator.clipboard.readText()
        .then(text => {
          setReferralCode(text);
        })
        .catch(err => {
          console.error('Failed to read clipboard contents: ', err);
        });
    };

    const handleSubmit = async () => {
      if (!referralCode || referralCode.trim() === '') {
        addMsg({
          type: 'info',
          title: `Invalid referral code.`,
          link: '',
        });
        debugger
        form.submit;
        return;
      }
      const finishBody = {
        taskIdentifier: 'SIGN_IN_USING_AN_REFERRAL_CODE',
        ext: {
          referralCode: referralCode,
        },
      };
      const res = await finishTask(finishBody);
      if (res.rc === 0) {
        //save referral code
        await chrome.storage.local.set({
          referralCode: referralCode ,
        });
        onClose();
        setReferralTaskFinished();
        addMsg({
          type: 'suc',
          title: `10 points earned!`,
          link: '',
        });
        //set sign-in task item finished
      } else {
        alert(res.msg);
      }
    };


    return (
      <PMask>
        <div className="pDialog2 referral-code">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Referral Code</h1>
            </header>
            <div className={'inputDesc'}>
              Please input the code you received here.
            </div>

            <div className={'inputTitle'}>
              Referral Code
            </div>
              <div className={'inputComponent'}>
                  <Input className={'inputComponent'} defaultValue={referralCode} value={referralCode}
                         onChange={(e) => setReferralCode(e.target.value)} />
                {/*</Form.Item>*/}
                <button onClick={handlePaste} >Paste</button>
              </div>
              <PButton text={'Confirm'} disabled={referralCode===""||referralCode=== undefined} className={'confirm-button'} onClick={handleSubmit} />
          </main>

        </div>
      </PMask>
    );
  },
);

export default ReferralCodeInput;
