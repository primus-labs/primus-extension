import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt, add } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class Bitget extends Exchange {
  constructor(exchangeInfo) {
    super('bitget', exchangeInfo);
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance();
    res.info.forEach(({ coinName, available, lock, frozen }) => {
        // Tip: spot account balance = available + lock + freeze
        const amt = add(add(available, lock), frozen).toFixed();
        gt(amt, BIGZERO) && this.tradingAccountTokenAmountMap.set(coinName, amt);
    });
    // console.log(
    //    'bitget tradingAccountTokenAmountMap',
    //    this.tradingAccountTokenAmountMap
    // );
    return this.tradingAccountTokenAmountMap;
  }
}
export default Bitget;
