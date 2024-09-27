import React, { useState, useMemo, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import useAllSources from '@/hooks/useAllSources';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';
import '../../AssetDialog/SetDataSource/index.scss';
interface SetPwdDialogProps {
  onSubmit: (dataSourceId: string) => void;
}

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(({ onSubmit }) => {
  const [dataSourceName, setDataSourceName] = useState<string>('');
  const { sourceMap } = useAllSources();
  const formLegal = useMemo(() => {
    return !!dataSourceName;
  }, [dataSourceName]);
  const handleClickNext = useCallback(async () => {
    if (!formLegal) {
      return;
    }
    onSubmit(dataSourceName);
  }, [formLegal, dataSourceName]);
  // different
  const tList = useMemo(() => {
    const sourceNameArr = ['web3 wallet'];
    const web3walletInStoreKey = 'onChainAssetsSourcest';
    const newArr = sourceNameArr.map((i) => {
      const metaInfo = DATASOURCEMAP[i];
      let isDisabled = false;
      const web3Accounts = sourceMap[web3walletInStoreKey];
      if (web3Accounts) {
        isDisabled = Object.values(web3Accounts).length <= 0;
      }
      return {
        label: metaInfo.name,
        value: metaInfo.id,
        icon: metaInfo.icon,
        disabled: isDisabled,
        tooltip: 'Add Data Source first',
      };
    });
    // const sourceName = 'web3 wallet';
    // const sourceinStoreKey = 'onChainAssetsSourcest';
    // const metaInfo = DATASOURCEMAP[sourceName];
    // const walletAccounts = Object.values(sourceMap[sourceinStoreKey]);
    // const newArr = walletAccounts.map((i) => {
    //   const isDisabled = !sourceMap['onChainAssetsSources'];
    //   return {
    //     account: i.address,
    //     origin: 'Metamsk',
    //     initTime: i.timestamp,

    //     label: i.address,
    //     value: metaInfo.id,
    //     icon: metaInfo.icon,
    //     disabled: isDisabled,
    //     tooltip: 'Add Data Source first',
    //   };
    // });
    return newArr;
  }, [sourceMap]);

  return (
    <div className="pFormWrapper attestationForm dataSourceNameForm">
      <div className="formItem">
        <PSelect
          className="dataSourceName"
          label="Data source category"
          align="horizontal"
          placeholder="Choose data source"
          list={tList}
          value={dataSourceName}
          onChange={(v) => {
            setDataSourceName(v);
          }}
         
        />
      </div>
      <PButton
        text="Next"
        className="fullWidth confirmBtn"
        disabled={!formLegal}
        onClick={handleClickNext}
      ></PButton>
    </div>
  );
});

export default SetPwdDialog;
