import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class Houbi extends Exchange {
  constructor(exchangeInfo) {
    super('huobi', exchangeInfo);
  }

  async getFundingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance();
    Object.keys(res.total).forEach((symbolItem) => {
      const total = res[symbolItem]
      const amt = new BigNumber(total);
      gt(amt, BIGZERO) &&
        this.fundingAccountTokenAmountMap.set(symbolItem, amt);
    });
    // console.log(
    //   'huobi---------fundingAccountTokenAmountMap',
    //   this.fundingAccountTokenAmountMap
    // );
    return this.fundingAccountTokenAmountMap;
  }

}
export default Houbi;
