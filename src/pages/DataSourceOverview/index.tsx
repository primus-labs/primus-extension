import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs';
import DataSourceList from '@/components/DataSourceOverview/DataSourceList';
import DataSourcesDialog from '@/components/DataSourceOverview/DataSourcesDialog';
import DataSourcesExplainDialog from '@/components/DataSourceOverview/DataSourcesExplainDialog';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import ConnectDataSourceDialog from '@/components/DataSourceOverview/ConnectDataSourceDialog';
import type { GetDataFormProps } from '@/components/DataSourceOverview/ConnectDataSourceDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import AssetsOverview from '@/components/AssetsOverview/AssetsOverview';
import SocialOverview from '@/components/AssetsOverview/SocialOverview';
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList';
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem';
import './index.sass';
import DataUpdateBar from '@/components/DataSourceOverview/DataUpdateBar';
import DataAddBar from '@/components/DataSourceOverview/DataAddBar';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import useAuthorization from '@/hooks/useAuthorization';
import type { UserState } from '@/store/reducers';
import { postMsg, sub } from '@/utils/utils';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react'
import { setExSourcesAsync, setSocialSourcesAsync } from '@/store/actions'
import { ONCHAINLIST } from '@/utils/constants';

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
const DataSourceOverview = () => {
  const dispatch: Dispatch<any> = useDispatch()
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const authorize = useAuthorization();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [activeSource, setActiveSource] = useState<DataFieldItem>();
  const exSources = useSelector(
    (state: UserState) => state.exSources
  );
  const socialSources = useSelector(
    (state: UserState) => state.socialSources
  );
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector(
    (state: UserState) => state.filterWord
  );
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const exList: DataSourceItemList = useMemo(() => {
    return Object.values({ ...exSources });
  }, [exSources]);
  const socialList: DataSourceItemList = useMemo(() => {
    return Object.values({ ...socialSources });
  }, [socialSources]);
  const dataSourceList: DataSourceItemList = useMemo(() => {
    const exList = Object.values(exSources)
    const socialList = Object.values(socialSources)
    const orderedExList = exList.sort((a, b) =>
      sub(Number(b.totalBalance), Number(a.totalBalance)).toNumber()
    )
    const orderedSocialList = socialList.sort((a, b) =>
      sub(Number(b.followers), Number(a.followers)).toNumber()
    )
    return [...orderedExList,...orderedSocialList];
  }, [exSources, socialSources]);
  const activeDataSourceList = useMemo(() => {
    const orderedDataSourceList = dataSourceList
    if (filterWord) {
      return orderedDataSourceList.filter((item) => {
        const lowerCaseName = item.name.toLowerCase();
        const lowerFilterWord = filterWord?.toLowerCase();
        return lowerCaseName.startsWith(lowerFilterWord as string);
      });
    } else {
      return orderedDataSourceList;
    }
  }, [dataSourceList, filterWord]);
  const onUpdate = () => {
    // fetch datas from storage TODO by type
    dispatch(setExSourcesAsync());
    dispatch(setSocialSourcesAsync());
  };
  const handleChangeTab = (val: string) => {
    if (val === 'Data') {
      dispatch({
        type: 'setActiveSourceType',
        payload: 'All'
      })
    }
  };
  const handleCheckDataSourceDetail = ({ type, name }: DataSourceItemType) => {
    navigate(`/dataDetail?type=${type}&name=${name}`);
  };
  const handleAdd = () => {
    setStep(1);
  };
  const handleCloseMask = () => {
    setStep(0);
  };
  const onSubmitDataSourcesDialog = async (item: DataFieldItem) => {
    if (item.type === 'Assets') {
      setActiveSource(item);
      setStep(2);
    } else if (item.type === 'Social') {
      authorize(item.name.toUpperCase(), () => {
        setStep(0);
        dispatch(setSocialSourcesAsync());
      });
    }
  };
  const onCheckDataSourcesDialog = () => {
    setStep(1.5);
  };
  const onSubmitDataSourcesExplainDialog = () => {
    setStep(1);
  };
  const onSubmitConnectDataSourceDialogDialog = useCallback(
    async (form: GetDataFormProps) => {
      const lowerCaseSourceName = form?.name?.toLowerCase();
      setStep(2.5);
      setActiveRequest({
        type: 'loading',
        title: 'Data being requested',
        desc: 'It may take a few minutes.',
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

  const onSubmitAddSourceSucDialog = () => {
    setActiveSource(undefined);
    setStep(0);
  };
  const onSubmitActiveRequestDialog = () => {
    if (activeRequest?.type === 'loading') {
      onSubmitAddSourceSucDialog();
      return;
    } else if (activeRequest?.type === 'error') {
      setStep(2);
    } else {
      setStep(0);
    }
  };
  const onClearFilter = () => {
    dispatch({
      type: 'setFilterWord',
      payload: ''
    })
  };

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <DataSourceSearch />
        {activeSourceType === 'All' && (
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

      {step === 2 && (
        <ConnectDataSourceDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitConnectDataSourceDialogDialog}
          activeSource={activeSource}
          onCancel={() => {
            setStep(1);
          }}
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
      {activeSourceType === 'All' && <DataAddBar onClick={handleAdd} />}
    </div>
  );
};

export default DataSourceOverview;
