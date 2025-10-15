import React, { useState, useMemo, memo, useCallback } from 'react';
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
  const { sourceMap2 } = useAllSources();
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
    const sourceNameArr = [
      'binance',
      'okx',
      'tiktok',
      'x',
      // 'google',
      // 'discord',
    ];
    // 'zan' 'chatgpt'
    const newArr = sourceNameArr.map((i) => {
      const metaInfo = DATASOURCEMAP[i];
      // const isDisabled = !sourceMap2[i];
      return {
        label: metaInfo.name,
        value: metaInfo.id,
        icon: metaInfo.icon,
        // disabled: isDisabled,
        tooltip: 'Add Data Source first',
      };
    });
    return newArr;
  }, [sourceMap2]);

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
