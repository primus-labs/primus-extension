export const webDataSourceTemplate = {
  bitget:{
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
  huobi:{
    dataSource: 'huobi',
    jumpTo: 'https://www.htx.com/zh-cn/finance/account/spot',
    datasourceTemplate: {
      requests: [
        {
          name: 'first',
          url: 'https://www.htx.com/-/x/uc/uc/open/login/check',
          headers: ['User-Agent','hb-uc-token'],
          method: 'GET',
        }
      ],
    },
  }
};
