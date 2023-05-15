import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class Houbi extends Exchange {
  constructor(exchangeInfo) {
    super('huobi', exchangeInfo);
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({type: 'spot'});
    Object.keys(res.total).forEach((symbolItem) => {
      const total = res.total[symbolItem]
      const amt = new BigNumber(total);
      gt(amt, BIGZERO) &&
        this.tradingAccountTokenAmountMap.set(symbolItem, amt);
    });
    console.log(
      'huobi---------tradingAccountTokenAmountMap',
      this.tradingAccountTokenAmountMap
    );
  }

}
export default Houbi;
