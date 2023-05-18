import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class CoinBase extends Exchange {
  constructor(exchangeInfo) {
    super('coinbase', exchangeInfo);
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance();
    // console.log('res', res);
    res.info.data.forEach(({ currency, balance }) => {
      // Tip: funding account balance = free + locked + freeze
      const amt = new BigNumber(balance.amount);
      gt(amt, BIGZERO) &&
        this.tradingAccountTokenAmountMap.set(balance.currency, balance.amount);
    });
    // console.log(
    //   'tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }

}
export default CoinBase;
