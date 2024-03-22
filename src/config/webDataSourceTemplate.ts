export const webDataSourceTemplate = {
  bitget: {
    dataSource: 'bitget',
    jumpTo: 'https://www.bitget.com/zh-CN/asset/spot',
    datasourceTemplate: {
      requests: [
        {
          name: 'first',
          url: 'https://www.bitget.com/v1/mix/assetsV2',
          headers: ['cookie'],
          method: 'GET',
        },
        {
          name: 'kyc',
          url: 'https://www.bitget.com/v1/user/overview/userinfo',
          method: 'POST',
          headers: ['cookie'],
          cookies: ['bt_newsessionid'],
        },
        {
          name: 'asset-proof',
          url: 'https://www.bitget.com/v1/mix/assetsV2',
          method: 'POST',
          headers: ['cookie'],
          cookies: ['bt_newsessionid'],
        },
      ],
    },
  },
  gate: {
    dataSource: 'gate',
    jumpTo: 'https://www.gate.io/zh/myaccount/myfunds/spot',
    datasourceTemplate: {
      requests: [
        {
          name: 'first',
          url: 'https://www.gate.io/apiw/v2/account/spot/funds',
          headers: [],
          cookies: ['t_token', 'uid', 'pver'],
          method: 'GET',
        },
      ],
    },
  },
  huobi: {
    dataSource: 'huobi',
    jumpTo: 'https://www.htx.com/zh-cn/finance/account/spot/',
    datasourceTemplate: {
      requests: [
        {
          name: 'first',
          url: 'https://www.htx.com/-/x/pro/v1/account/spot-account/balance',
          queryParams: ['r'],
          headers: ['hb-pro-token', 'token'],
          cookies: [],
          method: 'GET',
        },
        {
          name: 'user-info',
          url: 'https://www.htx.com/-/x/otc/v1/user/info',
          queryParams: ['r', 'x-b3-traceid'],
          headers: ['token'],
          cookies: [],
          method: 'GET',
        },
      ],
    },
  },
  mexc: {
    dataSource: 'mexc',
    jumpTo: 'https://www.mexc.com/zh-CN/assets/spot',
    datasourceTemplate: {
      requests: [
        {
          name: 'first',
          url: 'https://www.mexc.com/api/platform/asset/api/asset/spot/convert/v2',
          headers: [],
          cookies: ['u_id'],
          method: 'GET',
        },
      ],
    },
  },
};
