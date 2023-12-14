import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  useEffect,
  memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PButton from '@/components/PButton';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import AttestationDialog from './AttestationDialog';
import AttestationDialog2 from './AttestationDialog2';
import AttestationDialogUniSwap from './AttestationDialogUniSwap';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import CredTypesDialog from './CredTypesDialog';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import { postMsg, strToHex, base64ToHex, strToHexSha256 } from '@/utils/utils';
import useTimeout from '@/hooks/useTimeout';
import useInterval from '@/hooks/useInterval';
import useAlgorithm from '@/hooks/useAlgorithm';
import {
  ATTESTATIONPOLLINGTIMEOUT,
  ATTESTATIONPOLLINGTIME,
  BIGZERO,
  ONESECOND,
  ONEMINUTE,
  CredVersion,
  SCROLLEVENTNAME,
  schemaTypeMap,
} from '@/config/constants';
import { getPadoUrl, getProxyUrl } from '@/config/envConstants';
import { STARTOFFLINETIMEOUT } from '@/config/constants';
import { setCredentialsAsync } from '@/store/actions';
import { add, mul, gt, assembleUserInfoParams } from '@/utils/utils';
import {
  attestForAnt,
  validateAttestationForAnt,
  attestForPolygonId,
} from '@/services/api/cred';
import { initRewardsActionAsync } from '@/store/actions/index';
import { submitUniswapTxProof } from '@/services/chains/erc721';

import { DATASOURCEMAP } from '@/config/constants';
import { formatAddress } from '@/utils/utils';
import type { WALLETITEMTYPE } from '@/config/constants';
import type { ATTESTFORANTPARAMS } from '@/services/api/cred';
import type { Dispatch } from 'react';
import type { CredTypeItemType, AttestionForm } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { AssetsMap } from '@/types/dataSource';
import type { ActiveRequestType } from '@/types/config';

import {
  claimUniNFT,
  getUniNFTResult,
  getUniswapProof,
} from '@/services/api/event';
import { eventReport } from '@/services/api/usertracker';
import { switchAccount } from '@/services/wallets/metamask';

const onChainObj: any = DATASOURCEMAP.onChain;

interface CredAddWrapperType {
  visible?: boolean;
  activeCred?: CredTypeItemType;
  activeSource?: string;
  onSubmit: (addSucFlag?: any) => void;
  onClose: () => void;
  type?: string;
  eventSource?: string;
}
const CredAddWrapper: FC<CredAddWrapperType> = memo(
  ({
    visible,
    activeCred,
    activeSource,
    onClose,
    onSubmit,
    type,
    eventSource,
  }) => {
    const [activeIdentityType, setActiveIdentityType] = useState<string>('');
    const navigate = useNavigate();
    const [scrollEventHistoryObj, setScrollEventHistoryObj] = useState<any>({});
    const [credRequestId, setCredRequestId] = useState<string>();
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [uniSwapProofParams, setUniSwapProofParams] = useState<any>({});
    const [uniSwapProofRequestId, setUniSwapProofRequestId] =
      useState<string>('');
    const [step, setStep] = useState(-1);
    const [activeAttestationType, setActiveAttestationType] =
      useState<string>('');
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
    const [activeSourceName, setActiveSourceName] = useState<string>();

    const [timeoutSwitch, setTimeoutSwitch] = useState<boolean>(false);
    const [intervalSwitch, setIntervalSwitch] = useState<boolean>(false);
    const [activeAttestForm, setActiveAttestForm] = useState<any>();

    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );
    const exSources = useSelector((state: UserState) => state.exSources);
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );

    const timeoutFn = useCallback(async () => {
      console.log('120s timeout');
      if (activeRequest?.type === 'suc') {
        return;
      }
      const { activeRequestAttestation } = await chrome.storage.local.get([
        'activeRequestAttestation',
      ]);
      const parsedActiveRequestAttestation = activeRequestAttestation
        ? JSON.parse(activeRequestAttestation)
        : {};

      if (parsedActiveRequestAttestation.reqType === 'web') {
        await chrome.runtime.sendMessage({
          type: 'pageDecode',
          name: 'attestResult',
          params: {
            result: 'warn',
          },
        });
      }

      setActiveRequest({
        type: 'warn',
        title: 'Something went wrong',
        desc: 'The attestation process has been interrupted for some unknown reason.Please try again later.',
      });
      var eventInfo: any = {
        eventType: 'ATTESTATION_GENERATE',
        rawData: {
          source: parsedActiveRequestAttestation.source,
          schemaType: parsedActiveRequestAttestation.schemaType,
          sigFormat: parsedActiveRequestAttestation.sigFormat,
          // attestationId: uniqueId,
          status: 'FAILED',
          reason: 'timeout',
        },
      };
      eventReport(eventInfo);

      const msg = {
        fullScreenType: 'algorithm',
        reqMethodName: 'stop',
        params: {},
      };
      console.log('after timeout port', padoServicePort);
      postMsg(padoServicePort, msg);
    }, [padoServicePort, activeRequest?.type]);
    const intervalFn = useCallback(() => {
      const msg = {
        fullScreenType: 'algorithm',
        reqMethodName: 'getAttestationResult',
        params: {},
      };
      postMsg(padoServicePort, msg);
      console.log('page_send:getAttestationResult request');
    }, [padoServicePort]);
    useTimeout(timeoutFn, ATTESTATIONPOLLINGTIMEOUT, timeoutSwitch, false);
    useInterval(intervalFn, ATTESTATIONPOLLINGTIME, intervalSwitch, false);

    const dispatch: Dispatch<any> = useDispatch();

    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);
    const handleChangeProofType = useCallback((title: string) => {
      setActiveAttestationType(title);
      setStep(1);
    }, []);
    const handleCloseMask = useCallback(() => {
      if (
        activeRequest?.desc?.startsWith &&
        activeRequest?.desc?.startsWith(
          'Check MetaMask to confirm the connection with'
        )
      ) {
        setActiveRequest(undefined);
      }
      setStep(-1);
      onClose();
    }, [onClose, activeRequest?.desc]);
    const validateBaseInfo = useCallback(
      (form: AttestionForm) => {
        const { source, baseValue } = form;
        const priceObj = exSources[source]?.tokenPriceMap;
        let totalAccBal;
        if (!priceObj) {
          return true;
        }
        if (source === 'okx') {
          const targetObj = exSources[source].tradingAccountTokenAmountObj;
          totalAccBal = Object.keys(targetObj).reduce((prev, curr) => {
            const num = targetObj[curr as keyof typeof targetObj];
            const price = priceObj[curr as keyof typeof priceObj];
            const curValue = mul(num, price).toFixed();
            prev = add(Number(prev), Number(curValue));
            return prev;
          }, BIGZERO);
        } else {
          const targetMap: AssetsMap = exSources[source].spotAccountTokenMap;

          totalAccBal = Object.keys(targetMap).reduce((prev, curr) => {
            const obj = targetMap[curr as keyof typeof targetMap];
            const curValue = obj.value;
            prev = add(Number(prev), Number(curValue));
            return prev;
          }, BIGZERO);
        }
        const totalBalance = totalAccBal.toFixed();
        if (gt(Number(baseValue), Number(totalBalance))) {
          setStep(2);
          setActiveRequest({
            type: 'warn',
            title: 'Not met the requirements',
            desc: (
              <>
                <p>
                  Insufficient assets in your{' '}
                  {source === 'okx' ? 'Trading' : 'Spot'} Account.
                </p>
                <p>Please confirm and try again later.</p>
              </>
            ),
          });
          return false;
        }
        return true;
      },
      [exSources]
    );
    const userInfo = useSelector((state: UserState) => state.userInfo);
    const requestConfigParams = useMemo(() => {
      const { id } = userInfo;
      const rCParams = {
        extraHeader: {
          'user-id': id,
        },
      };
      return rCParams;
    }, [userInfo]);
    const fetchAttestForPolygonID = useCallback(async () => {
      const { id } = userInfo;
      const {
        type,
        signature,
        source,
        getDataTime,
        address,
        baseValue,
        balanceGreaterThanBaseValue,
        exUserId,
        holdingToken,
        requestid, // last sessionId
        did,
        schemaType,
        sigFormat,
        sourceUseridHash,
      } = activeCred as CredTypeItemType;
      try {
        const params: any = {
          sessionId: requestid,
          credType: schemaTypeMap[type as keyof typeof schemaTypeMap],
          signature,
          credentialSubject: {
            id: did,
            source,
            sourceUserId: sourceUseridHash || '',
            authUserId: id,
            getDataTime,
            recipient: address,
            baseValue,
            balanceGreaterThanBaseValue,
          },
          update: 'true',
        };
        if (type === 'TOKEN_HOLDINGS') {
          params.credentialSubject.asset = holdingToken;
        }
        const res = await attestForPolygonId(params, requestConfigParams);
        if (res?.getDataTime) {
          const newRequestId = requestid;
          const fullAttestation = {
            ...activeCred,
            did,
            ...res,
            requestid: newRequestId,
            issuer: res.claimQrCode.from,
            schemaName: 'PolygonID',
            provided: [],
            signature: res.claimSignatureInfo.signature,
            encodedData: res.claimSignatureInfo.encodedData,
            version: CredVersion,
            credVersion: CredVersion,
          };

          const { credentials: credentialsStr } =
            await chrome.storage.local.get(['credentials']);
          const credentialsObj = credentialsStr
            ? JSON.parse(credentialsStr)
            : {};
          credentialsObj[newRequestId] = fullAttestation;
          await chrome.storage.local.set({
            credentials: JSON.stringify(credentialsObj),
          });

          await initCredList();
          setActiveRequest({
            type: 'suc',
            title: 'Congratulations',
            desc: 'A new attestation with Polygon DID is successfully granted!',
          });
          const uniqueId = strToHexSha256(fullAttestation.signature);
          var eventInfo: any = {
            eventType: 'ATTESTATION_GENERATE',
            rawData: {
              source,
              schemaType,
              sigFormat,
              attestationId: uniqueId,
              status: 'SUCCESS',
              reason: '',
            },
          };
          eventReport(eventInfo);
        } else {
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: 'Failed to grant new authentication to Polygon DID!',
          });
          const eventInfo: any = {
            eventType: 'ATTESTATION_GENERATE',
            rawData: {
              source,
              schemaType,
              sigFormat,
              // attestationId: '',
              status: 'FAILED',
              reason: 'attestForPolygonId error',
            },
          };
          eventReport(eventInfo);
          alert('attestForPolygonId network error');
        }
      } catch {
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: 'Failed to grant new authentication to Polygon DID!',
        });
        const eventInfo: any = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
            source,
            schemaType,
            sigFormat,
            // attestationId: '',
            status: 'FAILED',
            reason: 'fetchAttestForPolygonID error',
          },
        };
        eventReport(eventInfo);

        alert('attestForPolygonId network error');
      }
    }, [activeCred, userInfo, initCredList, requestConfigParams]);
    const fetchAttestForAnt = useCallback(
      async (form: AttestionForm) => {
        const {
          credential,
          userIdentity,
          verifyIdentity,
          proofType,
          source,
          type,
          exUserId,
          label,
        } = form;
        const params = {
          credential,
          userIdentity,
          verifyIdentity,
          proofType,
        };
        const schemaType = schemaTypeMap[type as keyof typeof schemaTypeMap];
        const eventInfo: any = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
            source,
            schemaType,
            sigFormat: 'EAS-Ethereum',
            // attestationId: '',
            // status: 'FAILED',
            // reason: 'attestForPolygonId error',
          },
        };
        try {
          const { rc, result, msg } = await attestForAnt(
            params as ATTESTFORANTPARAMS,
            {
              ...requestConfigParams,
              timeout: 30 * ONESECOND,
            }
          );
          if (rc === 0) {
            // setActiveKYCApplication(result)
            const { salt, rootHash, proof } = result;
            const params2 = {
              proof,
              salt,
              rootHash,
              userIdentity,
              source,
              metamaskAddress: connectedWallet?.address,
              // sigFormat: 'EAS-BNB'
              // TODO!!!
            };
            const {
              rc: rc2,
              result: result2,
              msg: msg2,
            } = await validateAttestationForAnt(params2, {
              ...requestConfigParams,
              timeout: ONEMINUTE,
            });
            if (rc2 === 0) {
              const credentialsObj = { ...credentialsFromStore };
              const activeRequestId = activeCred?.requestid ?? +new Date();
              // // credentialsObj[activeRequestId] = fullAttestation;

              const user = await assembleUserInfoParams();

              credentialsObj[activeRequestId] = {
                type,
                requestid: activeRequestId + '',
                source,
                sourceUseridHash: '',
                address: connectedWallet?.address,
                label,
                credential,
                ...result2,

                sigFormat: 'EAS-Ethereum',
                schemaType: type,
                user,
                version: CredVersion,
                credVersion: CredVersion,
              };

              await chrome.storage.local.set({
                credentials: JSON.stringify(credentialsObj),
              });
              await initCredList();
              setActiveRequest({
                type: 'suc',
                title: 'Congratulations',
                desc: 'Your proof is created!',
              });
              const uniqueId = strToHexSha256(
                credentialsObj[activeRequestId].signature
              );
              eventInfo.rawData = Object.assign(eventInfo.rawData, {
                attestationId: uniqueId,
                status: 'SUCCESS',
                reason: '',
              });
              eventReport(eventInfo);
            } else {
              setActiveRequest(undefined);
              alert(msg2);
              eventInfo.rawData = Object.assign(eventInfo.rawData, {
                // attestationId: uniqueId,
                status: 'FAILED',
                reason: msg2,
              });
              eventReport(eventInfo);
            }
          } else {
            setActiveRequest(undefined);
            setStep(-1);
            alert(msg);
            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              // attestationId: uniqueId,
              status: 'FAILED',
              reason: msg,
            });
            eventReport(eventInfo);
          }
        } catch {
          setStep(-1);
          setActiveRequest(undefined);
          alert('attestForAnt network error');
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            // attestationId: uniqueId,
            status: 'FAILED',
            reason: 'attestForAnt network error',
          });
          eventReport(eventInfo);
        }
      },
      [
        credentialsFromStore,
        requestConfigParams,
        initCredList,
        activeCred?.requestid,
        connectedWallet?.address,
      ]
    );
    const errorDescEl = useMemo(
      () => (
        <>
          <p>Your wallet did not connect or refused to authorize.</p>
          <p>Please try again later.</p>
        </>
      ),
      []
    );
    const [pollingUniProofIntervalSwitch, setPollingUniProofIntervalSwitch] =
      useState<boolean>(false);

    const pollingUniProofResult = useCallback(async () => {
      try {
        const { rc, result } = await getUniNFTResult({
          requestId: uniSwapProofRequestId,
        });
        if (rc === 0) {
          const {
            status,
            reason,
            nft,
            transactionHash,
            swapSizeDollars,
            signatureInfo,
            signatureRawInfo,
          } = result;
          var eventInfo: any = {
            eventType: 'ATTESTATION_GENERATE',
            rawData: {
              source: 'brevis',
              schemaType: 'UNISWAP_PROOF',
              sigFormat: 'EAS-Ethereum',
              attestationId: uniSwapProofRequestId,
              // status: 'SUCCESS',
              // reason: '',
            },
          };
          if (status === 'COMPLETE' || status === 'ERROR') {
            setPollingUniProofIntervalSwitch(false);
          }
          // store nft & proof
          if (status === 'COMPLETE') {
            // store nft & credit
            const { rewards } = await chrome.storage.local.get(['rewards']);
            const newRewardsObj = rewards ? JSON.parse(rewards) : {};
            newRewardsObj['brevis' + uniSwapProofRequestId] = {
              title: nft.nftTitle,
              name: nft.nftName,
              image: nft.image,
              nftAddress: nft.nftAddress,
              accountAddress: activeAttestForm?.sourceUseridHash,
              type: 'NFT',
              event: 'brevis',
            };
            await chrome.storage.local.set({
              rewards: JSON.stringify(newRewardsObj),
            });
            await dispatch(initRewardsActionAsync());
            const fullAttestation = {
              ...signatureInfo,
              ...signatureRawInfo,
              nft,
              address: connectedWallet?.address,
              ...activeAttestForm,
              version: CredVersion,
              requestid: uniSwapProofRequestId,
            };
            const credentialsObj = { ...credentialsFromStore };
            credentialsObj[uniSwapProofRequestId] = fullAttestation;
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsObj),
            });
            await initCredList();
            eventInfo.rawData.status = 'SUCCESS';
            eventInfo.rawData.reason = '';
            eventReport(eventInfo);
            // setActiveRequest({
            //   type: 'suc',
            //   title: 'Congratulations',
            //   desc: 'Successfully get your rewards.',
            // });
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Your proof is created!',
            });
            // const {
            //   transactionInput,
            //   proofWithPublicInputs,
            //   auxiBlkVerifyInfo,
            // } = proof;
            // // const { transactionHash } = uniSwapProofParams;
            // const upperChainTxHash = await submitUniswapTxProof({
            //   txHash: transactionHash,
            //   proof: base64ToHex(proofWithPublicInputs),
            //   auxiBlkVerifyInfo: base64ToHex(auxiBlkVerifyInfo),
            //   metamaskprovider: uniSwapProofParams.provider,
            // });
            // const { rc, result } = await getUniswapProof({
            //   ...uniSwapProofParams,
            //   timestamp: +new Date() + '',
            //   transactionHash: upperChainTxHash,
            //   addressId: connectedWallet?.address,
            // });
            // if (rc === 0) {
            //   // store result.result
            // }
          }
          if (status === 'ERROR') {
            //         const resonMap = {
            //           SIGNATURE_WRONG: 签名错误
            // NO_ELIGIBILITY：没有资格
            // INTERNAL_ERROR：调用celer接口出错
            // TRANSACTION_ERROR: 获取交易信息失败
            // UNKNOWN：后端服务抛出异常
            // SUCCESS：成功
            //         }

            if (reason === 'NO_ELIGIBILITY') {
              setActiveRequest({
                type: 'warn',
                title: 'Not meet the requirements',
                desc: 'Do not have an eligible transaction. ',
                btnTxt: '',
              });
            } else if (reason === 'UNKNOWN') {
              setActiveRequest({
                type: 'warn',
                title: 'Unable to proceed',
                desc: 'Some transaction error occurs. Please try again later.',
                btnTxt: '',
              });
            } else {
              setActiveRequest({
                type: 'warn',
                title: 'Something went wrong',
                desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
              });
            }
            eventInfo.rawData.status = 'FAILED';
            eventInfo.rawData.reason = reason;
            eventReport(eventInfo);
          }
        }
      } catch {
        setActiveRequest({
          type: 'warn',
          title: 'Something went wrong',
          desc: 'The attestation process has been interrupted for some unknown reason. Please try again later.',
        });
      } finally {
      }
    }, [
      uniSwapProofRequestId,
      connectedWallet?.address,
      activeAttestForm,
      credentialsFromStore,
      initCredList,
      dispatch,
    ]);
    useInterval(
      pollingUniProofResult,
      3000,
      pollingUniProofIntervalSwitch,
      false
    );
    const fetchAttestForUni = useCallback(
      async (form: AttestionForm) => {
        try {
          const curRequestId = uuidv4();
          setUniSwapProofRequestId(curRequestId);
          const curConnectedAddr = connectedWallet?.address;
          // const curConnectedAddr = '0xd4b69e8d62c880e9dd55d419d5e07435c3538342'; // stone TODO DEL!!!222123
          const timestamp: string = +new Date() + '';
          // if did‘t connected with the selected account
          if (
            curConnectedAddr.toLowerCase() !==
            form?.sourceUseridHash?.toLowerCase()
          ) {
            switchAccountFn(form);
            return;
          }
          const signature = await requestSign(
            form?.sourceUseridHash,
            timestamp
          ); // TODO DEL !!!
          if (!signature) {
            setActiveRequest({
              type: 'warn',
              title: 'Unable to proceed',
              desc: errorDescEl,
            });
            return;
          }
          const proofParams = {
            signature,
            address: curConnectedAddr,
            provider: connectedWallet?.provider,
          };
          setUniSwapProofParams(proofParams);
          const { rc, result, msg } = await claimUniNFT({
            requestId: curRequestId,
            signature,
            address: curConnectedAddr,
            timestamp,
          });

          if (rc === 0 && result) {
            setPollingUniProofIntervalSwitch(true);
          } else {
            setActiveRequest({
              type: 'error',
              title: 'Failed',
              desc: msg,
            });
          }
        } catch (e) {
          setActiveRequest({
            type: 'warn',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        }
      },
      [connectedWallet?.address, connectedWallet?.provider, errorDescEl]
    );
    const onSubmitAttestationDialog = useCallback(
      async (form: AttestionForm) => {
        setActiveAttestForm(form);
        if (form?.proofClientType === 'Webpage Data') {
          const currRequestObj = webProofTypes.find(
            (r) => r.name === form.proofContent && r.dataSource === form.source
          );
          currRequestObj.requestid = form.requestid;
          currRequestObj.event = form.event;
          const currentWindowTabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });

          await chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'inject',
            params: {
              ...currRequestObj,
            },
            extensionTabId: currentWindowTabs[0].id,
          });
          return;
        }
        setStep(2);
        //   loadingObj = {
        //     type: 'loading',
        //     title: 'Processing',
        //     desc: 'Please complete the transaction in your wallet.',
        //   };
        let loadingObj = {
          type: 'loading',
          title: 'Attestation is processing',
          desc: 'It may take a few seconds.',
        };
        setActiveRequest(loadingObj);
        if (activeCred?.did) {
          fetchAttestForPolygonID();
        } else {
          if (form.type === 'UNISWAP_PROOF') {
            fetchAttestForUni(form);
          } else if (form.type === 'IDENTIFICATION_PROOF') {
            fetchAttestForAnt(form);
          } else {
            if (form.type === 'ASSETS_PROOF') {
              // fetch balance first
              if (!validateBaseInfo(form)) {
                return;
              }
            }
            // if curCred is update,not add
            const msg = {
              fullScreenType: 'algorithm',
              reqMethodName: 'getAttestation',
              params: {
                ...form,
              },
            };
            postMsg(padoServicePort, msg);
            console.log(`page_send:getAttestation:`, form);
          }
        }
      },
      [
        padoServicePort,
        validateBaseInfo,
        fetchAttestForAnt,
        activeCred?.did,
        fetchAttestForPolygonID,
        webProofTypes,
        fetchAttestForUni,
      ]
    );
    const onBackAttestationDialog = useCallback(() => {
      setStep(0);
    }, []);
    const onSubmitActiveRequestDialog = useCallback(() => {
      if (
        activeRequest?.type === 'suc' ||
        activeRequest?.type === 'error' ||
        activeRequest?.type === 'warn'
      ) {
        setStep(-1);
        initCredList();
        if (activeRequest?.type === 'suc') {
          onSubmit(credRequestId);
        } else {
          onSubmit(false);
        }
        return;
      }
    }, [activeRequest?.type, initCredList, onSubmit, credRequestId]);

    const clearFetchAttestationTimer = useCallback(() => {
      setIntervalSwitch(false);
    }, []);
    useEffect(() => {
      !intervalSwitch && setTimeoutSwitch(false);
    }, [intervalSwitch]);
    const handleAdd = useCallback(() => {
      if (activeRequest?.type === 'loading') {
        alert(
          'There is already a proof being processed. Please try again later.'
        );
        onClose();
        return;
      }
      // setActiveCred(undefined);
      setStep(0);
    }, [activeRequest?.type]);

    const getAttestationCallback = useCallback(async (res: any) => {
      const { retcode, retdesc } = JSON.parse(res);
      if (retcode === '0') {
        setTimeoutSwitch(true);
        setIntervalSwitch(true);
      } else if (retcode === '2') {
        // algorithm is not initialized
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: (
            <>
              <p>The algorithm has not been initialized.</p>
              <p>Please try again later.</p>
            </>
          ),
        });
        const { activeRequestAttestation } = await chrome.storage.local.get([
          'activeRequestAttestation',
        ]);
        const parsedActiveRequestAttestation = activeRequestAttestation
          ? JSON.parse(activeRequestAttestation)
          : {};
        var eventInfo: any = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
            source: parsedActiveRequestAttestation.source,
            schemaType: parsedActiveRequestAttestation.schemaType,
            sigFormat: parsedActiveRequestAttestation.sigFormat,
            // attestationId: uniqueId,
            status: 'FAILED',
            reason: 'algorithm is not initialized',
          },
        };
        eventReport(eventInfo);
      }
    }, []);
    const getAttestationResultCallback = useCallback(
      async (res: any) => {
        const { retcode, content, retdesc } = JSON.parse(res);
        const { activeRequestAttestation } = await chrome.storage.local.get([
          'activeRequestAttestation',
        ]);

        const parsedActiveRequestAttestation = activeRequestAttestation
          ? JSON.parse(activeRequestAttestation)
          : {};
        var eventInfo: any = {
          eventType: 'ATTESTATION_GENERATE',
          rawData: {
            source: parsedActiveRequestAttestation.source,
            schemaType: parsedActiveRequestAttestation.schemaType,
            sigFormat: parsedActiveRequestAttestation.sigFormat,
          },
        };

        if (retcode === '0') {
          clearFetchAttestationTimer();
          if (
            content.balanceGreaterThanBaseValue === 'true' &&
            content.signature
          ) {
            const activeRequestId = parsedActiveRequestAttestation.requestid;
            if (activeRequestId !== content?.requestid) {
              return;
            }
            const fullAttestation = {
              ...content,
              ...parsedActiveRequestAttestation,
            };

            const credentialsObj = { ...credentialsFromStore };
            credentialsObj[activeRequestId] = fullAttestation;
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsObj),
            });
            await chrome.storage.local.remove(['activeRequestAttestation']);
            await initCredList();
            if (fullAttestation.reqType === 'web') {
              await chrome.runtime.sendMessage({
                type: 'pageDecode',
                name: 'attestResult',
                params: {
                  result: 'success',
                },
              });
            }
            setCredRequestId(activeRequestId);
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Your proof is created!',
            });

            const uniqueId = strToHexSha256(fullAttestation.signature);
            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              attestationId: uniqueId,
              status: 'SUCCESS',
              reason: '',
            });
            eventReport(eventInfo);
          } else if (
            !content.signature ||
            content.balanceGreaterThanBaseValue === 'false'
          ) {
            var titleItem1 = 'Not met the requirements';
            let descItem1 =
              'Your request did not meet the necessary requirements.';
            if (activeAttestForm?.type === 'ASSETS_PROOF') {
              descItem1 = `Insufficient assets in your ${
                activeAttestForm.source === 'okx' ? 'Trading' : 'Spot'
              } Account.`;
            }
            let descEl = (
              <>
                <p>{descItem1}</p>
                <p>Please confirm and try again later.</p>
              </>
            );
            let btnTxt =
              titleItem1 === 'Not met the requirements' ? '' : undefined;

            if (parsedActiveRequestAttestation.reqType === 'web') {
              let failReason = '';
              if (!content.signature && content.encodedData) {
                titleItem1 = 'Unable to proceed';
                descEl = <p>Not meeting the uniqueness requirement.</p>;
                failReason = 'Not meeting the uniqueness requirement.';
                btnTxt = '';
                await chrome.runtime.sendMessage({
                  type: 'pageDecode',
                  name: 'attestResult',
                  params: {
                    result: 'warn',
                    failReason,
                  },
                });
              } else {
                await chrome.runtime.sendMessage({
                  type: 'pageDecode',
                  name: 'attestResult',
                  params: {
                    result: 'fail',
                  },
                });
              }
            }
            setActiveRequest({
              type: 'warn',
              title: titleItem1,
              desc: descEl,
              btnTxt,
            });

            eventInfo.rawData = Object.assign(eventInfo.rawData, {
              status: 'FAILED',
              reason: 'Not met the requirements',
            });
            eventReport(eventInfo);
          }
        } else if (retcode === '2') {
          const msg = {
            fullScreenType: 'algorithm',
            reqMethodName: 'stop',
            params: {},
          };
          postMsg(padoServicePort, msg);
          var eventInfoMsg = 'Something went wrong';
          let requestResObj = {
            type: 'warn',
            title: 'Something went wrong',
            desc: 'The attestation process has been interrupted for some unknown reason.Please try again later.',
          };
          if (
            retdesc.indexOf('connect to proxy error') > -1 ||
            retdesc.indexOf('WebSocket On Error') > -1 ||
            retdesc.indexOf('connection error') > -1
          ) {
            requestResObj = {
              type: 'warn',
              title: 'Ooops',
              desc: 'Unstable internet connection. Please try again later.',
            };
            eventInfoMsg = 'Unstable internet connection';
          }
          setActiveRequest(requestResObj);
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            status: 'FAILED',
            reason: eventInfoMsg,
          });
          eventReport(eventInfo);
          if (parsedActiveRequestAttestation.reqType === 'web') {
            let failReason = '';
            if (
              retdesc.indexOf('connect to proxy error') > -1 ||
              retdesc.indexOf('WebSocket On Error') > -1 ||
              retdesc.indexOf('connection error') > -1
            ) {
              failReason = 'network';
            }
            await chrome.runtime.sendMessage({
              type: 'pageDecode',
              name: 'attestResult',
              params: {
                result: 'warn',
                failReason,
              },
            });
          }
        }
      },
      [
        clearFetchAttestationTimer,
        padoServicePort,
        initCredList,
        credentialsFromStore,
        activeAttestForm,
      ]
    );

    useAlgorithm(
      getAttestationCallback,
      getAttestationResultCallback,
      fromEvents === 'LINEA_DEFI_VOYAGE'
    );

    useEffect(() => {
      if (
        activeRequest?.type === 'suc' ||
        activeRequest?.type === 'error' ||
        activeRequest?.type === 'warn'
      ) {
        clearFetchAttestationTimer();
      }
    }, [clearFetchAttestationTimer, activeRequest?.type]);

    useEffect(() => {
      if (visible && !fromEvents) {
        setStep(-1);
        setActiveAttestationType('');
        setActiveSourceName(undefined);
        if (activeCred) {
          setStep(1);
          setActiveAttestationType(activeCred?.type);
          setActiveSourceName(activeCred?.source);
        } else {
          setActiveSourceName(undefined);
          if (activeSource) {
            setActiveSourceName(activeSource);
          }
          handleAdd();
        }
      }
      if (visible && !!fromEvents) {
        if (fromEvents === 'Badges' || fromEvents === 'LINEA_DEFI_VOYAGE') {
          setStep(1);
          setActiveAttestationType('IDENTIFICATION_PROOF');
        } else if (fromEvents === 'NFTs') {
          setStep(-1);
          setActiveAttestationType('');
          setActiveSourceName(undefined);
          handleAdd();
        } else if (fromEvents === 'Scroll' && eventSource) {
          const from = {
            proofClientType: 'Webpage Data',
            proofContent: 'Account Ownership',
            source: eventSource as string,
            type: 'IDENTIFICATION_PROOF',
            event: SCROLLEVENTNAME,
          };
          onSubmitAttestationDialog(from);
        }
      }
    }, [visible, activeSource, activeCred, fromEvents, eventSource]);

    // useEffect(() => {
    //   if (!activeRequest?.type) {
    //     onClose();
    //   }
    // }, [activeRequest?.type, onClose]);
    const startOfflineFn = useCallback(async () => {
      const padoUrl = await getPadoUrl();
      const proxyUrl = await getProxyUrl();
      postMsg(padoServicePort, {
        fullScreenType: 'algorithm',
        reqMethodName: 'startOffline',
        params: {
          offlineTimeout: STARTOFFLINETIMEOUT,
          padoUrl,
          proxyUrl,
        },
      });
    }, [padoServicePort]);
    const footerTip = useMemo(() => {
      if (
        activeRequest?.type === 'loading' &&
        !(
          activeRequest?.desc?.startsWith &&
          activeRequest?.desc?.startsWith(
            'Check MetaMask to confirm the connection with'
          )
        )
      ) {
        return (
          <div className="footerTip safeTip">
            <p>PADO will not access your private data.</p>
            <p>We use IZK to ensure your privacy.</p>
          </div>
        );
      } else {
        return null;
      }
    }, [activeRequest?.type]);
    const LINEA_DEFI_VOYAGETryAgainFn = useCallback(() => {
      const msg = {
        fullScreenType: 'algorithm',
        reqMethodName: 'stop',
        params: {
          noRestart: true,
        },
      };
      postMsg(padoServicePort, msg);
      navigate('/cred?fromEvents=LINEA_DEFI_VOYAGE');
      window.location.reload();
    }, [navigate, padoServicePort]);
    const tryAgainFn = useCallback(() => {
      if (
        activeAttestForm.type === 'IDENTIFICATION_PROOF' &&
        activeAttestForm.proofClientType === 'Webpage Data'
      ) {
        setActiveSourceName(activeAttestForm?.source);
        setActiveIdentityType(activeAttestForm?.proofContent);
        setStep(1);
      } else {
        onSubmitAttestationDialog(activeAttestForm);
      }
    }, [onSubmitAttestationDialog, activeAttestForm]);
    const switchAccountFn = useCallback(
      async (form: AttestionForm) => {
        const formatAddr = formatAddress(
          form?.sourceUseridHash || '',
          6,
          6,
          '......'
        );
        setActiveRequest({
          type: 'loading',
          title: 'Requesting Connection',
          desc: `Check MetaMask to confirm the connection with ${formatAddr}`,
        });
        await switchAccount(connectedWallet?.provider);
        setActiveRequest(undefined);
        setActiveSourceName(form?.sourceUseridHash);
        setStep(1);
      },
      [connectedWallet?.provider]
    );
    const footerButton = useMemo(() => {
      if (activeRequest?.type === 'suc') {
        if (fromEvents) {
          return (
            <PButton
              text={fromEvents === 'Scroll' ? 'OK' : 'Submit'}
              onClick={onSubmitActiveRequestDialog}
            />
          );
        } else {
          return null;
        }
      } else {
        if (
          fromEvents === 'LINEA_DEFI_VOYAGE' &&
          activeRequest?.btnTxt === ''
        ) {
          return null;
        } else if (
          activeAttestForm?.type === 'UNISWAP_PROOF' &&
          activeRequest?.btnTxt === ''
        ) {
          return null;
        } else {
          return (
            <PButton
              text="Try again"
              className="gray"
              onClick={
                fromEvents === 'LINEA_DEFI_VOYAGE'
                  ? LINEA_DEFI_VOYAGETryAgainFn
                  : tryAgainFn
              }
            />
          );
        }
      }
    }, [
      fromEvents,
      onSubmitActiveRequestDialog,
      activeRequest?.type,
      LINEA_DEFI_VOYAGETryAgainFn,
      tryAgainFn,
      activeRequest?.btnTxt,
      activeAttestForm,
    ]);
    useEffect(() => {
      visible && !fromEvents && startOfflineFn();
    }, [visible, startOfflineFn, fromEvents]);
    const setScrollEventHistoryFn = useCallback(async () => {
      const { scrollEvent } = await chrome.storage.local.get(['scrollEvent']);
      const scrollEventObj = scrollEvent ? JSON.parse(scrollEvent) : {};

      setScrollEventHistoryObj(scrollEventObj);
    }, []);
    useEffect(() => {
      fromEvents === 'Scroll' && setScrollEventHistoryFn();
    }, [fromEvents, setScrollEventHistoryFn]);
    const resultDialogHeaderEl = useMemo(() => {
      let formatAddress = connectedWallet?.address;
      // debugger
      if (scrollEventHistoryObj?.address) {
        formatAddress = scrollEventHistoryObj?.address;
      }
      return activeRequest?.desc?.startsWith &&
        activeRequest?.desc?.startsWith(
          'Check MetaMask to confirm the connection with'
        ) ? (
        <Bridge endIcon={onChainObj.icon} />
      ) : (
        <AddressInfoHeader address={formatAddress as string} />
      );
    }, [
      connectedWallet?.address,
      scrollEventHistoryObj?.address,
      activeRequest?.desc,
    ]);
    useEffect(() => {
      const listerFn = (message: any) => {
        if (message.type === 'pageDecode') {
          if (message.name === 'cancelAttest') {
            setStep(2);
            setActiveRequest({
              type: 'warn',
              title: 'Unable to proceed',
              desc: 'Please try again later.',
            });
          } else if (message.name === 'sendRequest') {
            setStep(2);
            setActiveRequest({
              type: 'loading',
              title: 'Attestation is processing',
              desc: 'It may take a few seconds.',
            });
          } else if (message.name === 'abortAttest') {
            if (activeRequest?.type === 'loading' || !activeRequest?.type) {
              setStep(2);
              setActiveRequest({
                type: 'warn',
                title: 'Unable to proceed',
                desc: 'Please try again later.',
              });
            }
            if (activeRequest?.type === 'loading') {
              setIntervalSwitch(false);
            }
          }
          // else if (
          //   message.name === 'closeDataSourcePage' &&
          //   message.tryFlag
          // ) {
          //   LINEA_DEFI_VOYAGETryAgainFn();
          // }
        }
      };
      chrome.runtime.onMessage.addListener(listerFn);
      return () => {
        chrome.runtime.onMessage.removeListener(listerFn);
      };
    }, [activeRequest?.type, LINEA_DEFI_VOYAGETryAgainFn]);

    return (
      <div className={'credAddWrapper'}>
        {visible && step === 0 && (
          <CredTypesDialog
            onClose={handleCloseMask}
            onSubmit={handleChangeProofType}
            type={type}
          />
        )}
        {visible &&
          step === 1 &&
          (activeAttestationType === 'IDENTIFICATION_PROOF' ? (
            <AttestationDialog2
              type={activeAttestationType}
              activeSourceName={activeSourceName}
              activeType={activeIdentityType}
              activeCred={activeCred}
              onBack={
                fromEvents === 'Badges' || fromEvents === 'LINEA_DEFI_VOYAGE'
                  ? undefined
                  : onBackAttestationDialog
              }
              onClose={handleCloseMask}
              onSubmit={onSubmitAttestationDialog}
            />
          ) : activeAttestationType === 'UNISWAP_PROOF' ? (
            <AttestationDialogUniSwap
              type={activeAttestationType}
              activeSourceName={activeSourceName}
              activeType={activeIdentityType}
              activeCred={activeCred}
              onBack={onBackAttestationDialog}
              onClose={handleCloseMask}
              onSubmit={onSubmitAttestationDialog}
            />
          ) : (
            <AttestationDialog
              type={activeAttestationType}
              activeSourceName={activeSourceName}
              activeCred={activeCred}
              onBack={onBackAttestationDialog}
              onClose={handleCloseMask}
              onSubmit={onSubmitAttestationDialog}
            />
          ))}
        {visible && step === 2 && (
          <AddSourceSucDialog
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerEl={resultDialogHeaderEl}
            footerButton={footerButton}
            tip={footerTip}
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveRequestDialog}
            closeable={
              !fromEvents ||
              fromEvents === 'Scroll' ||
              (fromEvents === 'LINEA_DEFI_VOYAGE' &&
                activeRequest?.type !== 'suc')
            }
          />
        )}
      </div>
    );
  }
);

export default CredAddWrapper;
