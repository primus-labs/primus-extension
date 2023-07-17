import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

import PTabs from '@/components/PTabs';
import DataSourceList from '@/components/DataSourceOverview/DataSourceList';
import DataSourcesDialog from '@/components/DataSourceOverview/DataSourcesDialog';
import DataSourcesExplainDialog from '@/components/DataSourceOverview/DataSourcesExplainDialog';
import ConnectDataSourceDialog from '@/components/DataSourceOverview/ConnectDataSourceDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import AssetsOverview from '@/components/AssetsOverview/AssetsOverview';
import SocialOverview from '@/components/AssetsOverview/SocialOverview';
import DataUpdateBar from '@/components/DataSourceOverview/DataUpdateBar';
import DataAddBar from '@/components/DataSourceOverview/DataAddBar';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import KYCVerify from '@/components/DataSourceOverview/KYCVerify';
import useAuthorization from '@/hooks/useAuthorization';
import { postMsg, sub } from '@/utils/utils';
import { setExSourcesAsync, setSocialSourcesAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { GetDataFormProps } from '@/components/DataSourceOverview/ConnectDataSourceDialog';
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList';
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';
import type {
  SocialDataList,
  ExDataList,
  KYCDataList,
  SourceDataList,
  SourceData,
  ExchangeMeta,
} from '@/types/dataSource';
import './index.sass';

export type DataSourceStorages = {
  binance?: any;
  okx?: any;
  kucoin?: any;
  twitter?: any;
  coinbase?: any;
  [propName: string]: any;
};
export type ActiveRequestType = {
  type: string;
  title: string;
  desc: string;
};
const DataSourceOverview = memo(() => {
  const [step, setStep] = useState(0);
  const [activeSource, setActiveSource] = useState<ExchangeMeta>();
  const [activeSourceKeys, setActiveSourceKeys] = useState<GetDataFormProps>();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [KYCDialogVisible, setKYCDialogVisible] = useState<boolean>(false);
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  const kycSources = useSelector((state: UserState) => state.kycSources);

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector((state: UserState) => state.filterWord);

  const dispatch: Dispatch<any> = useDispatch();
  const authorize = useAuthorization();
  const navigate = useNavigate();

  const exList: ExDataList = useMemo(() => {
    return Object.values({ ...exSources });
  }, [exSources]);
  const socialList: SocialDataList = useMemo(() => {
    return Object.values({ ...socialSources });
  }, [socialSources]);
  const kycList: KYCDataList = useMemo(() => {
    return Object.values({ ...kycSources });
  }, [kycSources]);

  const dataSourceList: SourceDataList = useMemo(() => {
    const exList = Object.values(exSources);
    const socialList = Object.values(socialSources);
    const orderedExList = exList.sort((a, b) =>
      sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
    );
    const orderedSocialList = socialList.sort((a, b) =>
      sub(Number(b.followers), Number(a.followers)).toNumber()
    );
    return [...orderedExList, ...orderedSocialList, ...kycList];
  }, [exSources, socialSources, kycList]);
  const activeDataSourceList = useMemo(() => {
    let orderedDataSourceList = [...dataSourceList];
    if (activeSourceType !== 'All') {
      orderedDataSourceList = orderedDataSourceList.filter(
        (i) => i.type === activeSourceType
      );
    }
    if (filterWord) {
      return orderedDataSourceList.filter((item) => {
        const lowerCaseName = item.name.toLowerCase();
        const lowerFilterWord = filterWord?.toLowerCase();
        return lowerCaseName.startsWith(lowerFilterWord as string);
      });
    } else {
      return orderedDataSourceList;
    }
  }, [dataSourceList, filterWord, activeSourceType]);

  const onSubmitConnectDataSourceDialogDialog = useCallback(
    async (form: GetDataFormProps) => {
      console.log('submit--form', form);
      setActiveSourceKeys(form);
      const lowerCaseSourceName = form?.name?.toLowerCase();
      setStep(2.5);
      setActiveRequest({
        type: 'loading',
        title: 'Data being requested',
        desc: 'It may take a few seconds.',
      });
      const reqType = `set-${lowerCaseSourceName}`;
      const msg: any = {
        fullScreenType: 'networkreq',
        type: reqType,
        params: {
          ...form,
        },
      };
      postMsg(padoServicePort, msg);
      console.log(`page_send:${reqType} request`);
      const padoServicePortListener = async function (message: any) {
        console.log(`page_get:${reqType}:`, message.res);
        if (message.resType === `${reqType}`) {
          if (message.res) {
            setStep(3);
            dispatch(setExSourcesAsync());
          } else {
            if (message.msg === 'AuthenticationError') {
              setActiveRequest({
                type: 'error',
                title: 'Invalid input',
                desc: 'Please check your API Key or Secret Key.',
              });
            } else if (message.msg === 'ExchangeNotAvailable') {
              setActiveRequest({
                type: 'warn',
                title: 'Service unavailable',
                desc: 'The network is unstable or the access may be restricted. Please adjust and try again later.',
              });
            } else if (message.msg === 'InvalidNonce') {
              setActiveRequest({
                type: 'warn',
                title: 'Something went wrong',
                desc: 'Looks like your time or internet settings may be incorrect. Please check and try again later.',
              });
            } else if (message.msg === 'TypeError: Failed to fetch') {
              setActiveRequest({
                type: 'warn',
                title: 'Your connection are lost',
                desc: 'Please check your internet connection and try again later.',
              });
            } else if (message.msg === 'RequestTimeout') {
              setActiveRequest({
                type: 'warn',
                title: 'Request timed out',
                desc: 'This request takes too long to process, it is timed out by the data source server.',
              });
            } else {
              setActiveRequest({
                type: 'warn',
                title: 'Oops...',
                desc: 'Something went wrong. Please try again later.',
              });
            }
          }
        }
        padoServicePort.onMessage.removeListener(padoServicePortListener);
      };
      padoServicePort.onMessage.addListener(padoServicePortListener);
    },
    [padoServicePort, dispatch]
  );
  const handleChangeTab = useCallback(
    (val: string) => {
      if (val === 'Data') {
        dispatch({
          type: 'setActiveSourceType',
          payload: 'All',
        });
      }
    },
    [dispatch]
  );
  const handleAdd = useCallback(() => {
    setStep(1);
  }, []);
  const handleCheckDataSourceDetail = useCallback(
    ({ type, name }: SourceData) => {
      navigate(`/dataDetail?type=${type}&name=${name}`);
    },
    [navigate]
  );
  const onClearFilter = useCallback(() => {
    dispatch({
      type: 'setFilterWord',
      payload: '',
    });
  }, [dispatch]);
  const handleCloseMask = useCallback(() => {
    setStep(0);
  }, []);
  const onSubmitDataSourcesDialog = useCallback(
    async (item: ExchangeMeta) => {
      if (item.type === 'Assets') {
        setActiveSource(item);
        setStep(2);
      } else if (item.type === 'Social') {
        authorize(item.name.toUpperCase(), () => {
          setStep(0);
          dispatch(setSocialSourcesAsync());
        });
      } else if (item.type === 'Identity') {
        // TODO
        setActiveSource(item);
        setStep(0);
        setKYCDialogVisible(true);
      }
    },
    [authorize, dispatch]
  );
  const onCheckDataSourcesDialog = useCallback(() => {
    setStep(1.5);
  }, []);
  const onSubmitDataSourcesExplainDialog = useCallback(() => {
    setStep(1);
  }, []);
  const onUpdate = useCallback(() => {
    // fetch datas from storage TODO by type
    dispatch(setExSourcesAsync());
    dispatch(setSocialSourcesAsync());
  }, [dispatch]);
  const onSubmitAddSourceSucDialog = useCallback(() => {
    setActiveSource(undefined);
    setStep(0);
  }, []);
  const onSubmitActiveRequestDialog = useCallback(() => {
    if (activeRequest?.type === 'loading') {
      onSubmitAddSourceSucDialog();
      return;
    } else {
      setStep(2);
    }
  }, [activeRequest?.type, onSubmitAddSourceSucDialog]);

  useEffect(() => {
    step === 1 && setActiveSourceKeys(undefined);
  }, [step]);

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <DataSourceSearch />
        {(activeSourceType === 'All' || activeSourceType === 'Identity') && (
          <DataSourceList
            onAdd={handleAdd}
            list={activeDataSourceList}
            onCheck={handleCheckDataSourceDetail}
          />
        )}
        {activeSourceType === 'Assets' && (
          <AssetsOverview
            filterSource={filterWord}
            onClearFilter={onClearFilter}
            list={exList}
          />
        )}
        {activeSourceType === 'Social' && (
          <SocialOverview
            filterSource={filterWord}
            onClearFilter={onClearFilter}
            list={socialList}
          />
        )}
      </main>
      {step === 1 && (
        <DataSourcesDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitDataSourcesDialog}
          onCheck={onCheckDataSourcesDialog}
        />
      )}
      {step === 1.5 && (
        <DataSourcesExplainDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitDataSourcesExplainDialog}
        />
      )}

      <KYCVerify
        visible={KYCDialogVisible}
        onClose={() => {
          setKYCDialogVisible(false);
          handleCloseMask();
        }}
        onCancel={() => {
          setKYCDialogVisible(false);
          setStep(1);
        }}
        activeSource={activeSource}
        onSubmit={() => {
          setKYCDialogVisible(false);
          handleCloseMask();
        }}
        onWakeUp={() => {
          setKYCDialogVisible(true);
        }}
      />
      {step === 2 && (
        <ConnectDataSourceDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitConnectDataSourceDialogDialog}
          activeSource={activeSource}
          onCancel={() => {
            setStep(1);
          }}
          activeSourceKeys={activeSourceKeys}
        />
      )}
      {step === 2.5 && (
        <AddSourceSucDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitActiveRequestDialog}
          activeSource={activeSource}
          type={activeRequest?.type}
          title={activeRequest?.title}
          desc={activeRequest?.desc}
        />
      )}
      {step === 3 && (
        <AddSourceSucDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitAddSourceSucDialog}
          activeSource={activeSource}
          desc="Data Connected!"
        />
      )}
      {activeSourceType !== 'All' && (
        <DataUpdateBar type={activeSourceType} onUpdate={onUpdate} />
      )}
      {activeSourceType === 'All' && dataSourceList.length > 0 && (
        <DataAddBar onClick={handleAdd} />
      )}
    </div>
  );
});

export default DataSourceOverview;
