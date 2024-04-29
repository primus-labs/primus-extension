import React, { memo, useRef, useState, useCallback } from 'react';
import './index.scss';
import TokenPie from '@/newComponents/Home/DataSourcesModule/TokenPie';
import PButton from '@/newComponents/PButton';
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
import bgShare from '@/assets/newImg/dataDashboard/bgShare.svg';
// @ts-ignore
import { toPng } from 'html-to-image';
import {
  shareDiscord,
  shareTelegram,
  shareTwitter,
} from '@/services/api/achievements';
import copy from 'copy-to-clipboard';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
  shareType: string;
  scoreShareProps: ScoreShareProps;
}

interface ScoreShareProps {
  score: number;
  referralCode: string;
  attestationType?: string;
  totalBalance?: string;
}

const ShareComponent: React.FC<PButtonProps> = memo(
  ({ onClose, shareType, scoreShareProps }) => {
    const domEl = useRef(null);

    const [isSharing, setIsSharing] = useState(false);
    const [isShowDiscordCopyBtn, setIsShowDiscordCopyBtn] = useState(false);

    const shareTwitterImg = async () => {
      if (isSharing) {
        return;
      }
      setIsSharing(true);
      // @ts-ignore
      const base64Imag = await toPng(domEl.current);
      try {
        const rsp = await shareTwitter({
          base64Image: base64Imag,
          referralCode: scoreShareProps.referralCode,
          points: scoreShareProps.score,
          shareType,
        });
        console.log(rsp);
        if (rsp.rc === 0) {
          window.open(rsp.result.content);
        } else {
          alert('error occurred');
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsSharing(false);
      }
    };

    const toDiscordSharePage = async () => {
      setIsShowDiscordCopyBtn(true);
    };
    const shareDiscordImg = async () => {
      if (isSharing) {
        return;
      }
      setIsSharing(true);
      // @ts-ignore
      const base64Imag = await toPng(domEl.current);
      try {
        const rsp = await shareDiscord({
          base64Image: base64Imag,
          referralCode: scoreShareProps.referralCode,
          points: scoreShareProps.score,
          shareType,
        });
        console.log(rsp);
        if (rsp.rc === 0) {
          copy(rsp.result.content);
          window.open('https://discord.com/channels/@me');
        } else {
          alert('error occurred');
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsSharing(false);
        setIsShowDiscordCopyBtn(false);
      }
    };

    const shareTelegramImg = async () => {
      if (isSharing) {
        return;
      }
      setIsSharing(true);
      // @ts-ignore
      const base64Imag = await toPng(domEl.current);
      try {
        const rsp = await shareTelegram({
          base64Image: base64Imag,
          referralCode: scoreShareProps.referralCode,
          points: scoreShareProps.score,
          shareType,
        });
        console.log(rsp);
        if (rsp.rc === 0) {
          window.open(rsp.result.content);
        } else {
          alert('error occurred');
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsSharing(false);
      }
    };
    const handleDownload = useCallback(() => {
      window.open(
        'https://chromewebstore.google.com/detail/pado/oeiomhmbaapihbilkfkhmlajkeegnjhe'
      );
    }, []);

    return (
      <PMask>
        <div className={`pDialog2 share-div ${shareType}`}>
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Share on social media</h1>
            </header>
            <div className={'shareDiv'}>
              <div className={'shareTitle'}></div>
              <div className={`container `} id="domEl" ref={domEl}>
                {['score', 'referralCode', 'certificate'].includes(
                  shareType
                ) && (
                  <>
                    <img className={'green-circle'} src={greenCircle}></img>
                    <img className={'white-circle'} src={whiteCircle}></img>
                    <img className={'blue-rectangle'} src={blueRect}></img>
                    <img className="logo" src={padoLogo}></img>
                    {shareType === 'score' && (
                      <div className={'shareContent'}>
                        <div className="title">My achievements in PADO</div>
                        <div
                          style={{
                            fontWeight: '600',
                            fontSize: '32px',
                            marginLeft: '24px',
                            marginTop: '20px',
                          }}
                        >
                          {scoreShareProps.score}
                          <a
                            style={{
                              fontWeight: '400',
                              fontSize: '12px',
                              marginLeft: '5px',
                              marginTop: '10px',
                            }}
                          >
                            xp
                          </a>
                        </div>
                        <div
                          style={{
                            fontWeight: '400',
                            fontSize: '12px',
                            color: '#161616',
                            marginLeft: '24px',
                            marginTop: '10px',
                          }}
                        >
                          My referral code:{' '}
                          <a>{scoreShareProps.referralCode}</a>
                        </div>
                      </div>
                    )}
                    {shareType === 'referralCode' && (
                      <div className={'shareContent'}>
                        <div className="title">
                          Sign up to PADO and use my referral code to earn extra
                          points!
                        </div>
                        <div
                          style={{
                            fontWeight: '600',
                            fontSize: '32px',
                            marginLeft: '24px',
                            marginTop: '20px',
                          }}
                        >
                          {scoreShareProps.referralCode}
                        </div>
                      </div>
                    )}
                    {shareType === 'certificate' && (
                      <div className="shareContent attestation">
                        <div className="title">
                          I created 1 {scoreShareProps.attestationType} on PADO.
                        </div>
                        <div className="desc">
                          Sign up to PADO today and use my referral code{' '}
                          <span className="inviteCode">
                            {scoreShareProps.referralCode}
                          </span>{' '}
                          for extra points!
                        </div>
                      </div>
                    )}
                    <div className={'downloadApp'}>
                      <a
                        style={{
                          fontWeight: '400',
                          fontSize: '12px',
                          color: '#161616',
                        }}
                        target={'_blank'}
                        href={
                          'https://chromewebstore.google.com/detail/pado/oeiomhmbaapihbilkfkhmlajkeegnjhe'
                        }
                      >
                        Download PADO
                        <img src={lineLogo} style={{ marginLeft: '5px' }} />
                      </a>
                    </div>
                  </>
                )}
                {shareType === 'data_dashboard' && (
                  <div className={'shareContent data_dashboard'}>
                    <div className="topCon">
                      <img className="left" src={padoLogo}></img>
                      <div className="right">
                        <div className="title">Checkout My Balance on PADO</div>
                        <div className="desc">
                          My referral code:{' '}
                          <div className="inviteCode">
                            {scoreShareProps.referralCode}
                            {/* {scoreShareProps.totalBalance} */}
                          </div>
                        </div>

                        <PButton
                          type="text"
                          text="Download PADO"
                          className="downloadBtn"
                          onClick={handleDownload}
                        />
                      </div>
                    </div>
                    <div className="centerCon">
                      <div className="title">
                        <div className="label">Total Balance</div>
                        <div className="value">
                          {scoreShareProps.totalBalance}
                        </div>
                      </div>
                      <TokenPie />
                    </div>
                  </div>
                )}
              </div>
              {!isShowDiscordCopyBtn && (
                <div className={'shareMedia'}>
                  Share to
                  <div className={'shareIcon'}>
                    <img
                      src={x}
                      style={{ margin: '0 10px', cursor: 'pointer' }}
                      onClick={shareTwitterImg}
                    />
                    <img
                      src={discord}
                      style={{ margin: '0 10px', cursor: 'pointer' }}
                      onClick={toDiscordSharePage}
                    />
                    <img
                      src={telegram}
                      style={{ margin: '0 10px', cursor: 'pointer' }}
                      onClick={shareTelegramImg}
                    />
                  </div>
                </div>
              )}
              {isShowDiscordCopyBtn && (
                <div className={'shareDiscordCopy'}>
                  Copy and paste the snapshot to your Discord channel.
                  <PButton
                    className={'shareDiscordCopyBtn'}
                    onClick={shareDiscordImg}
                    text={'Copy to share'}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
        <Spin
          spinning={isSharing}
          fullscreen
          indicator={
            <LoadingOutlined
              style={{
                fontSize: 24,
                color: '#6F6F6F',
              }}
              spin
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            />
          }
        />
      </PMask>
    );
  }
);

export default ShareComponent;
