import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class KuCoin extends Exchange {
  constructor(exchangeInfo) {
    super('kucoin', exchangeInfo);
  }

  async getFundingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'main' });
    // console.log('res', res);
    res.info.data.forEach(({ currency, balance }) => {
      // Tip: funding account balance = free + locked + freeze
      const amt = new BigNumber(balance);
      gt(amt, BIGZERO) && this.fundingAccountTokenAmountMap.set(currency, amt);
    });
    // console.log(
    //   'fundingAccountTokenAmountMap',
    //   this.fundingAccountTokenAmountMap
    // );
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'trade' });
    res.info.data.forEach(({ currency, balance }) => {
      // Tip: trading account balance = free + locked
      const amt = new BigNumber(balance);
      gt(amt, BIGZERO) && this.tradingAccountTokenAmountMap.set(currency, amt);
    });
    // console.log(
    //   'tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }
}
export default KuCoin;
