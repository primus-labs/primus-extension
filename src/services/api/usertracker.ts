import request from '@/utils/request';

type EventInfo = {
    eventType: string;
    rawData: any;
};
export const eventReport = async (data: EventInfo) => {
    let storedata: any = {};
    storedata.eventType = data.eventType;
    const { keyStore } = await chrome.storage.local.get(['keyStore']);
    if (keyStore) {
        const { address } = JSON.parse(keyStore);
        storedata.walletAddressOnChainId = "0x" + address;
    }
    if (data.rawData) {
        storedata.rawData = JSON.stringify(data.rawData);
    }

    return request({
      method: 'post',
      url: `/public/event/report`,
      data: storedata,
    });
};