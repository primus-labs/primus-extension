import BigNumber from 'bignumber.js';
import Exchange from './exchange';
import { gt } from '@/utils/utils';
const BIGZERO = new BigNumber(0);

class Bitget extends Exchange {
  constructor(exchangeInfo) {
    super('bitget', exchangeInfo);
  }

  async getTradingAccountTokenAmountMap() {
    const res = await this.exchange.fetchBalance();
    res.info.data.forEach(({ coinName, available, lock, freeze }) => {
        // Tip: spot account balance = available + lock + freeze
        const amt = add(add(available, lock), freeze).toFixed();
        gt(amt, BIGZERO) && this.tradingAccountTokenAmountMap.set(coinName, amt);
    });
    console.log(
       'bitget tradingAccountTokenAmountMap',
       this.tradingAccountTokenAmountMap
    );
    return this.tradingAccountTokenAmountMap;
  }
}
export default Bitget;
