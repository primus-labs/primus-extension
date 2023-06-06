import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem';
import { DATASOURCEMAP } from '@/config/constants';
import type { ExchangeMeta } from '@/config/constants';
import type { DataSourceStorages } from '@/pages/DataSourceOverview';
import { getProofTypes } from '@/services/api/config';
import type {PROOFTYPEITEM} from '@/store/reducers'
export const SETSYSCONFIG = 'SETSYSCONFIG';

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
};

export type ExDataMap = {
  [propName: string]: ExInfo & ExchangeMeta;
};

export const setProofTypesAction = (values: any) => ({
  type: 'setProofTypes',
  payload: values,
});
export const setSocialSourcesAction = (values: object) => ({
  type: 'setSocialSources',
  payload: values,
});
export const setExSourcesData = (values: object) => ({
  type: 'setExSources',
  payload: values,
});
export const setExSourcesAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Assets'
    );
    let res: DataSourceStorages = await chrome.storage.local.get(
      sourceNameList
    );
    const reduceF = (prev: ExDataMap, curr: string) => {
      const sourceData = JSON.parse(res[curr]);
      prev[curr] = {
        ...DATASOURCEMAP[curr],
        ...sourceData,
        assetsNo: Object.keys(sourceData.tokenListMap).length,
      };
      return prev;
    };
    const exDatas = Object.keys(res).reduce(reduceF, {});
    dispatch(setExSourcesData(exDatas));
  };
};
export const setSocialSourcesAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Social'
    );
    const res: DataSourceStorages = await chrome.storage.local.get(
      sourceNameList
    );
    const reduceF = (prev: any, curr: string) => {
      const sourceData = JSON.parse(res[curr]);
      prev[curr] = {
        ...DATASOURCEMAP[curr],
        ...sourceData,
      };
      return prev;
    };
    const datasMap = Object.keys(res).reduce(reduceF, {});
    dispatch(setSocialSourcesAction(datasMap));
  };
};

export const setSysConfigAction = (data: object) => ({
  type: SETSYSCONFIG,
  payload: data,
});

export const setProofTypesAsync = () => {
  return async (dispatch: any) => {
    try {
      const { rc, result } = await getProofTypes();
      if (rc === 0) {
        const filteredTypes = result.filter(
          (i: PROOFTYPEITEM) => i.display === 0
        );
        dispatch(setProofTypesAction(filteredTypes));
      } else {
        alert('getProofTypes network error');
      }
    } catch (e) {
      alert('getProofTypes network error');
    }
  };
};
