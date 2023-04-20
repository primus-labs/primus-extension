import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class CoinBase extends Exchange {
  constructor(exchangeInfo) {
    super('coinbase', exchangeInfo);
  }

  async getFundingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance();
    // console.log('res', res);
    res.info.data.forEach(({ currency, balance }) => {
      // Tip: funding account balance = free + locked + freeze
      const amt = new BigNumber(balance.amount);
      gt(amt, BIGZERO) &&
        this.fundingAccountTokenAmountMap.set(balance.currency, balance.amount);
    });
    // console.log(
    //   'fundingAccountTokenAmountMap',
    //   this.fundingAccountTokenAmountMap
    // );
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    return this.tradingAccountTokenAmountMap;
  }
}
export default CoinBase;
