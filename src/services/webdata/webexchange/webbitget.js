import WebExchange from './webexchange';
import BigNumber from 'bignumber.js';

import {USDT, BTC, STABLETOKENLIST, BUSD, TUSD} from '@/config/constants';

const ONE = 1;
const ZERO = 0;

class WebBitGet extends WebExchange {
    constructor() {
        super('bitget');
    }

    async getFundingAccountTokenAmountMap() {
        const params = {};
        params.url = "https://www.bitget.com/v1/mix/assetsV2";
        params.method = "POST";
        const bodyParam = {
            languageType: 1
        }
        params.data = bodyParam
        const res = await this.request(params);
        console.log(res)
        res.data.otc.balanceList.forEach(({coinName, available}) => {
            this.fundingAccountTokenAmountMap.set(coinName, available);
        });
        // console.log(
        //   'okx fundingAccountTokenAmountMap',
        //   this.fundingAccountTokenAmountMap
        // );
        return this.fundingAccountTokenAmountMap;
    }

    async getTradingAccountTokenAmountMap() {
        const params = {};
        params.url = "https://www.bitget.com/v1/mix/assetsV2";
        params.method = "POST";
        const bodyParam = {
            languageType: 1
        }
        params.data = bodyParam
        const res = await this.request(params);
        console.log('trading:', res)
        res.data.spot.balanceList.forEach(({coinName, available}) => {
            this.tradingAccountTokenAmountMap.set(coinName, available);
            this.tradingAccountTokenAmountObj[coinName] = available;
        });
        // console.log(
        //   'okx tradingAccountTokenAmountMap',
        //   this.tradingAccountTokenAmountMap
        // );
        return this.tradingAccountTokenAmountMap;
    }

    async getTokenPriceMap() {
        await this.getTotalHoldingTokenSymbolList();
        // transfrom 'X' to 'XUSDT' when you query X's price;
        // ex: ETH => ETHUSDT,// binance=>'ETHUSDT',others:'ETH-USDT'
        // price unit: USD
        // coninbase need filter USD
        let LPSymbols = this.totalHoldingTokenSymbolList
            .filter((i) => !STABLETOKENLIST.includes(i))
            .concat(BTC)
            .map((j) => `${j}${USDT}`);
        let res;
        //let errorSymbol;
        const params = {};
        params.url =
            'https://api.bitget.com/api/v2/spot/market/tickers';
        params.method = 'GET';
        try {
            res = await this.request(params);
            res.data.forEach((lp) => {
                res[lp.symbol] = lp.lastPr;
            });
        } catch (e) {
            console.log('fetchTickers error:', this.exName, e);
            return;
        }
        //console.log('fetchTickers res:', this.exName, res);
        this.tokenPriceMap = STABLETOKENLIST.reduce((prev, curr) => {
            prev[curr] = ONE + '';
            return prev;
        }, {});
        LPSymbols.forEach((lpsymbol) => {
            const tokenSymbol = lpsymbol.replace(`${USDT}`, '');
            const last =
                res[lpsymbol]
            if (last) {
                this.tokenPriceMap[tokenSymbol] = new BigNumber(last).toFixed();
            } else {
                this.tokenPriceMap[tokenSymbol] = ZERO + '';
            }
        });
        return this.tokenPriceMap;
    }

    async getUserInfo() {
        const params = {};
        params.url =
            'https://www.bitget.com/v1/user/kyc/realNameStatus';
        params.method = 'POST';
        const res = await this.request(params);
        this.userInfo.userName = res.data.uid;
        this.userInfo.userId = res.data.uid;
        console.log(`bitget uid is: ${res.data.uid}`)
    }
}

export default WebBitGet;
