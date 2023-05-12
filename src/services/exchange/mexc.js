import BigNumber from 'bignumber.js';
import Exchange from './exchange';

class MEXC extends Exchange {
    constructor(exchangeInfo) {
        /**
         * just need api-key and secret
         */
        super('mexc3', exchangeInfo);
    }

    async getFundingAccountTokenAmountMap() {
        const res = await this.exchange.fetchBalance();
        // console.log('res', res);
        res.info.balances.forEach(({ asset, free, locked }) => {
            const freeBigNumber = new BigNumber(free);
            const lockedBigBumber = new BigNumber(locked);
            this.fundingAccountTokenAmountMap.set(asset, freeBigNumber.plus(lockedBigBumber));
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
export default MEXC;
