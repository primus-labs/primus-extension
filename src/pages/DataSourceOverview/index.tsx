import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Dispatch } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs';
import PControledInput from '@/components/PControledInput';
import PSelect from '@/components/PSelect';
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
import useAuthorization from '@/hooks/useAuthorization';
import useExSources from '@/hooks/useExSources';
import useSocialSources from '@/hooks/useSocialSources';
import type { UserState } from '@/store/reducers';
import {postMsg} from '@/utils/utils'


export type DataSourceStorages = {
  binance?: any;
  okx?: any;
  kucoin?: any;
  twitter?: any;
  coinbase?: any;
  [propName: string]: any;
};
type PortMsg = {
  resMethodName: string;
  res: any;
};
type ActiveRequestType = {
  type: string;
  title: string;
  desc: string;
}
const DataSourceOverview = () => {
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const authorize = useAuthorization();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  // const [loading, setLoading] = useState(false)
  const [activeSource, setActiveSource] = useState<DataFieldItem>();
  const [filterWord, setFilterWord] = useState<string>();
  const [exSources, refreshExSources] = useExSources();
  const [socialSources, refreshSocialSources] = useSocialSources();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();
  const [countdown, setCountdown] = useState<number>(20)
  const [countdownTimer, setCountdownTimer] = useState<any>()
  const exList: DataSourceItemList = useMemo(() => {
    return Object.values({ ...exSources});
  }, [exSources]);
  const socialList: DataSourceItemList = useMemo(() => {
    return Object.values({ ...socialSources});
  }, [socialSources]);
  const dataSourceList: DataSourceItemList = useMemo(() => {
    return Object.values({ ...exSources, ...socialSources });
  }, [exSources, socialSources]);
  const dataSourceTypeList = useMemo(() => {
    let deaultList = [
      {
        value: 'All',
        text: 'All',
      },
    ];
    if (typeof exSources === 'object' && Object.values(exSources).length > 0) {
      deaultList.push({
        value: 'Assets',
        text: 'Assets',
      });
    }
    if (
      typeof socialSources === 'object' &&
      Object.values(socialSources).length > 0
    ) {
      deaultList.push({
        value: 'Social',
        text: 'Social',
      });
    }
    return deaultList;
  }, [exSources, socialSources]);
  const activeDataSourceList = useMemo(() => {
    if (filterWord) {
      return dataSourceList.filter((item) => {
        const lowerCaseName = item.name.toLowerCase();
        const lowerFilterWord = filterWord?.toLowerCase();
        return lowerCaseName.startsWith(lowerFilterWord as string);
      });
    } else {
      return dataSourceList;
    }
  }, [dataSourceList, filterWord]);

  const [activeSourceType, setActiveSourceType] = useState<string>('All');

  const handleChangeInput = (val: string) => {
    setFilterWord(val);
  };
  const onUpdate = () => {
    // fetch datas from storage TODO by type
    (refreshExSources as () => void)();
    (refreshSocialSources as () => void)();
  }
  const handleChangeSelect = (val: string) => {
    setActiveSourceType(val);
  };
  const handleChangeTab = () => {};
  const handleCheckDataSourceDetail = ({ type, name }: DataSourceItemType) => {
    navigate(`/dataDetail?type=${type}&name=${name}`);
  };
  const handleAdd = () => {
    setStep(1);
  };
  const handleCloseMask = () => {
    setStep(0);
    clearCountdownTimer()
  };
  const onSubmitDataSourcesDialog = async (item: DataFieldItem) => {
    if (item.type === 'Assets') {
      setActiveSource(item);
      setStep(2);
    } else if (item.type === 'Social') {
      authorize(item.name.toUpperCase(), () => {
        setStep(0);
        (refreshSocialSources as () => void)();
      });
    }
  };
  const onCheckDataSourcesDialog = () => {
    setStep(1.5);
  };
  const onSubmitDataSourcesExplainDialog = () => {
    setStep(1);
  };
  const clearCountdownTimer = () => {
    countdownTimer && clearInterval(countdownTimer)
  }
  const onSubmitConnectDataSourceDialogDialog = useCallback(
    async (form: GetDataFormProps) => {
      const lowerCaseSourceName = form?.name?.toLowerCase();
      // setLoading(true)
      setStep(2.5);
      clearCountdownTimer()
      setCountdownTimer(() => {
        return setInterval(() => {
          setCountdown((t) => t-1)
        }, 1000)
      })
      setActiveRequest({
        type: 'loading',
        title: 'Data being requested',
        desc:'It may take a few minutes.'
      })
      const reqType = `set-${lowerCaseSourceName}`;
      const msg: any = {
        fullScreenType: 'networkreq',
        type: reqType,
        params: {
          ...form,
        },
      };
      postMsg(padoServicePort, msg)
      console.log(`page_send:${reqType} request`);
      const padoServicePortListener = async function (message: any) {
        console.log(`page_get:${reqType}:`, message.res);
        if (message.resType === `${reqType}`) {
          clearCountdownTimer();
          if (message.res) {
            setStep(3);
            (refreshExSources as () => void)();
          } else {
            if(message.msg === 'AuthenticationError'){
              setActiveRequest({
                type: 'error',
                title: 'Invalid input',
                desc:'Please check your API Key or Secret Key.'
              })
            } else if(message.msg === 'TypeError: Failed to fetch') {
              setActiveRequest({
                type: 'warn',
                title: 'Your connection are lost',
                desc:'Please check your internet connection and try again'
              })
            } else {
              setActiveRequest({
                type: 'warn',
                title: 'Oops...',
                desc:'Something went wrong. Please try again later.'
              })
            }
          }
        }
        padoServicePort.onMessage.removeListener(padoServicePortListener);
      };
      padoServicePort.onMessage.addListener(padoServicePortListener);
    },
    [padoServicePort, refreshExSources]
  );

  const onSubmitAddSourceSucDialog = () => {
    setActiveSource(undefined);
    setStep(0);
  };
  const onClearFilter = () => {
    setFilterWord('');
  };
  useEffect(() => {
    return () => {
      clearCountdownTimer()
    }
  }, [])
  useEffect(() => {
    if(countdown === 0 ){
      clearCountdownTimer()
      step === 2.5 && activeRequest?.type === 'loading' && setActiveRequest({
        type: 'warn',
        title: 'Request timed out',
        desc:'Something went wrong. Please try again later.'
      })
    }
    countdown < 0  && clearCountdownTimer()
  }, [countdown])
  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <div className="filterWrapper">
          <PSelect options={dataSourceTypeList} onChange={handleChangeSelect} />
          <div className="pSearch">
            <PControledInput
              onChange={handleChangeInput}
              type="text"
              placeholder="Search"
              value={filterWord}
            />
          </div>
        </div>
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
        />
      )}
      {step === 2.5 && (
        <AddSourceSucDialog
          onClose={handleCloseMask}
          onSubmit={() => activeRequest?.type === 'loading'?onSubmitAddSourceSucDialog():setStep(2)}
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
      {activeSourceType !== 'All' && <DataUpdateBar type={activeSourceType} onUpdate={onUpdate}/>}
      {activeSourceType === 'All' && <DataAddBar onClick={handleAdd} />}
    </div>
  );
};

export default DataSourceOverview;
