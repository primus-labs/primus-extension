import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class Bybit extends Exchange {
  constructor(exchangeInfo) {
    super('bybit', exchangeInfo);
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({type: 'spot'});
    res.info.result.balances.forEach(({ coin, total }) => {
        //this.tradingAccountTokenAmountMap.set(coin, total);
        const amt = new BigNumber(total);
        gt(amt, BIGZERO) && this.tradingAccountTokenAmountMap.set(coin, amt);
    });
    // console.log(
    //    'bybit tradingAccountTokenAmountMap',
    //    this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }
}
export default Bybit;
