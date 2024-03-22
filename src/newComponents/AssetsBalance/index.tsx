import React, { memo, useCallback, useState } from 'react';
import BigNumber from 'bignumber.js';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import { gte } from '@/utils/utils';

import './index.scss';
import PButton from '@/newComponents/PButton';
import PEye from '@/newComponents/PEye';

interface PBackProps {
  balance: string;
  pnl?: string;
  pnlPercent?: string;
}
const AssetsBalance: React.FC = memo(() => {
  const {
    totalAssetsBalance,
    formatTotalAssetsBalance: balance,
    totalPnl: pnl,
    totalPnlPercent: pnlPercent,
    formatTotalPnlPercent,
  } = useAssetsStatistic();
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);
  const handleShow = useCallback(() => {
    setBalanceVisible((v) => !v);
  }, []);
  return (
    <section className={`assetsBalance overviewItem`}>
      <h4 className="title">
        <span>Assets Balance</span>
        <PEye onClick={handleShow} open={balanceVisible} />
      </h4>
      <div className="content">
        <div className="num">
          <div className="balance">{balanceVisible ? balance : '$***'}</div>
          <div className="pnl">
            <div className="label">PnL</div>
            <div className={`value ${gte(Number(pnl), 0) ? 'rise' : 'fall'}`}>
              {gte(Number(pnl), 0) ? `+$${pnl}` : `-$${pnl}`}(
              {gte(Number(pnlPercent), 0)
                ? `${pnlPercent}%`
                : `${new BigNumber(Number(pnlPercent)).abs().toFixed(2)}%`}
              )
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default AssetsBalance;
