import React, { memo, useRef, useState } from 'react';
import './index.scss';
import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import padoLogo from '@/assets/newImg/achievements/pado.svg';
import lineLogo from '@/assets/newImg/achievements/line.svg';
import greenCircle from '@/assets/newImg/achievements/greenCircle.svg';
import whiteCircle from '@/assets/newImg/achievements/whiteCircle.svg';
import blueRect from '@/assets/newImg/achievements/blueRect.svg';
import x from '@/assets/newImg/achievements/x.svg';
import discord from '@/assets/newImg/achievements/discord.svg';
import telegram from '@/assets/newImg/achievements/telegram.svg';
// @ts-ignore
import { toPng } from 'html-to-image';
import { shareTelegram, shareTwitter } from '@/services/api/achievements';


interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
  shareType: string;
  scoreShareProps: ScoreShareProps;
}

interface ScoreShareProps {
  score: number;
  referralCode: string;
}

const ShareComponent: React.FC<PButtonProps> = memo(
  ({ onClose, shareType, scoreShareProps }) => {

    const domEl = useRef(null);

    const [isSharing, setIsSharing] = useState(false);

    const shareTwitterImg = async () => {
      if (isSharing) {
        return;
      }
      setIsSharing(true);
      const base64Imag = await toPng(domEl.current);
      const rsp = await shareTwitter(base64Imag);
      console.log(rsp);
      if (rsp.rc === 0) {
        window.open(rsp.result.content);
      } else {
        alert('error occurred');
      }
      setIsSharing(false);
    };

    const shareDiscordImg = async () => {
      if (isSharing) {
        return;
      }
      const dataUrl = await toPng(domEl.current);
      console.log(dataUrl);
    };

    const shareTelegramImg = async () => {
      if (isSharing) {
        return;
      }
      setIsSharing(true);
      const base64Imag = await toPng(domEl.current);
      const rsp = await shareTelegram(base64Imag);
      console.log(rsp);
      if (rsp.rc === 0) {
        window.open(rsp.result.content);
      } else {
        alert('error occurred');
      }
      setIsSharing(false);
    };

    return (
      <PMask>
        <div className="pDialog2 share-div">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Share on social media</h1>
            </header>
            <div className={'shareDiv'}>
              <div className={'shareTitle'}></div>
              <div className="container" id="domEl" ref={domEl}>
                <img className={'green-circle'} src={greenCircle}></img>
                <img className={'white-circle'} src={whiteCircle}></img>
                <img className={'blue-rectangle'} src={blueRect}></img>
                <img className="logo" src={padoLogo}></img>
                {shareType === 'score' &&
                  <div className={'shareContent'}>
                    <div className="title">My achievements in PADO</div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '32px',
                      marginLeft: '24px',
                      marginTop: '20px',
                    }}>{scoreShareProps.score}<a
                      style={{ fontWeight: '400', fontSize: '12px', marginLeft: '5px', marginTop: '10px' }}>xp</a></div>
                    <div style={{
                      fontWeight: '400',
                      fontSize: '12px',
                      color: '#161616',
                      marginLeft: '24px',
                      marginTop: '10px',
                    }}>My referral
                      code: <a>{scoreShareProps.referralCode}</a></div>
                  </div>
                }

                {shareType === 'referralCode' &&
                  <div className={'shareContent'}>
                    <div className="title">Sign up to PADO and use my referral code to earn extra points!</div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '32px',
                      marginLeft: '24px',
                      marginTop: '20px',
                    }}>{scoreShareProps.referralCode}</div>
                  </div>
                }

                <div className={'downloadApp'}>
                  <a style={{ fontWeight: '400', fontSize: '12px', color: '#161616' }} href={'#'}>
                    Download PADO<img src={lineLogo} style={{ marginLeft: '5px' }} />

                  </a>
                </div>
              </div>
              <div className={'shareMedia'}>
                Share to
                <div className={'shareIcon'}>
                  <img src={x} style={{ margin: '0 10px', cursor: 'pointer' }} onClick={shareTwitterImg} />
                  <img src={discord} style={{ margin: '0 10px', cursor: 'pointer' }} onClick={shareDiscordImg} />
                  <img src={telegram} style={{ margin: '0 10px', cursor: 'pointer' }} onClick={shareTelegramImg} />
                </div>
              </div>

            </div>
          </main>
        </div>

      </PMask>
    );
  },
);

export default ShareComponent;
