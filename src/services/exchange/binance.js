import BigNumber from 'bignumber.js';
import { add, gt } from '@/utils/utils';
import Exchange from './exchange';
const BIGZERO = new BigNumber(0);

class Binance extends Exchange {
  constructor(exchangeInfo) {
    super('binance', exchangeInfo);
  }

  async getFundingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'funding' });

    res.info.forEach(({ asset, free, locked, freeze }) => {
      // Tip: funding account balance = free + locked + freeze
      const amt = add(add(free, locked), freeze).toFixed();
      gt(amt, BIGZERO) && this.fundingAccountTokenAmountMap.set(asset, amt);
    });
    // console.log(
    //   'fundingAccountTokenAmountMap',
    //   this.fundingAccountTokenAmountMap
    // );
    return this.fundingAccountTokenAmountMap;
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance({ type: 'trading' });
    res.info.balances.forEach(({ asset, free, locked }) => {
      // Tip: trading account balance = free + locked
      const amt = add(free, locked).toFixed();
      gt(amt, BIGZERO) && this.tradingAccountTokenAmountMap.set(asset, amt);
    });
    // console.log(
    //   'tradingAccountTokenAmountMap',
    //   this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }
}
export default Binance;
