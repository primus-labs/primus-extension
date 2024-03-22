import WebExchange from './webexchange';
import BigNumber from 'bignumber.js';

import {USDT, BTC, STABLETOKENLIST, BUSD, TUSD} from '@/config/constants';

const ONE = 1;
const ZERO = 0;

class WebGate extends WebExchange {
    constructor() {
        super('gate');
    }

    async getFundingAccountTokenAmountMap() {
        return this.fundingAccountTokenAmountMap;
    }

    async getTradingAccountTokenAmountMap() {
        const params = {};
        params.url = "https://www.gate.io/apiw/v2/account/spot/funds";
        params.method = "GET";
        const res = await this.request(params);
        console.log(res)
        res.data.assets.forEach(({asset, amount}) => {
            this.tradingAccountTokenAmountMap.set(asset, amount);
            this.tradingAccountTokenAmountObj[asset] = amount;
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
            .map((j) => `${j}_${USDT}`);
        let res;
        //let errorSymbol;
        const params = {};
        params.url =
            'https://api.gateio.ws/api/v4/spot/tickers';
        params.method = 'GET';
        try {
            res = await this.request(params);
            res.forEach((lp) => {
                res[lp.currency_pair] = lp.last;
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
            const tokenSymbol = lpsymbol.replace(`_${USDT}`, '');
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
            'https://www.gate.io/common/get_usertier';
        params.method = 'GET';
        const res = await this.request(params);
        this.userInfo.userName = res.uid;
        this.userInfo.userId = res.uid;
        console.log(res.uid)
    }
}

export default WebGate;
