import WebExchange from './webexchange';
import BigNumber from 'bignumber.js';

import {USDT, BTC, STABLETOKENLIST, BUSD, TUSD} from '@/config/constants';

const ONE = 1;
const ZERO = 0;

class WebHuoBi extends WebExchange {
    constructor() {
        super('huobi');
    }

    async getFundingAccountTokenAmountMap() {
        return this.fundingAccountTokenAmountMap;
    }

    async getTradingAccountTokenAmountMap() {
        const params = {};
        params.url = "https://www.htx.com/-/x/pro/v1/account/spot-account/balance?r=1825j";
        params.method = "GET";
        const res = await this.request(params);
        console.log(res)
        res.data.list.forEach(({currency, balance}) => {
            this.tradingAccountTokenAmountMap.set(currency.toUpperCase(), balance);
            this.tradingAccountTokenAmountObj[currency.toUpperCase()] = balance;
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
            .map((j) => `${j}${USDT}`.toUpperCase());
        let res;
        //let errorSymbol;
        const params = {};
        params.url =
            'https://api.huobi.pro/market/tickers';
        params.method = 'GET';
        try {
            res = await this.request(params);
            res.data.forEach((lp) => {
                res[lp.symbol.toUpperCase()] = lp.close	;
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
            'https://www.htx.com/-/x/hbg/v1/open/profit/web/balance-assets?r=ddr88';
        params.method = 'GET';
        const res = await this.request(params);
        this.userInfo.userName = res.data.userId;
        this.userInfo.userId = res.data.userId;
        console.log(res.data.userId)
    }
}

export default WebHuoBi;
