import WebSocial from './websocial';

class WebTwitter extends WebSocial {
  constructor() {
    super('x');
  }

  async getInfo() {
    const params = {};
    params.url = "https://api.twitter.com/1.1/account/settings.json";
    params.method = 'GET';
    const storageStr = await chrome.storage.local.get([params.url]);
    const storageObj = JSON.parse(storageStr[params.url]);
    params.url = params.url + "?" + storageObj.queryString;
    params.headers = storageObj.headers;
    //get screen name
    const res = await this.request(params);


    const variables = {
      "screen_name":res.screen_name,
      "withSafetyModeUserFields":true
    }
    const features = {
      "hidden_profile_likes_enabled":true,
      "hidden_profile_subscriptions_enabled":true,
      "rweb_tipjar_consumption_enabled":true,
      "responsive_web_graphql_exclude_directive_enabled":true,
      "verified_phone_label_enabled":false,
      "subscriptions_verification_info_is_identity_verified_enabled":true,
      "subscriptions_verification_info_verified_since_enabled":true,
      "highlights_tweets_tab_ui_enabled":true,
      "responsive_web_twitter_article_notes_tab_enabled":true,
      "creator_subscriptions_tweet_preview_api_enabled":true,
      "responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,
      "responsive_web_graphql_timeline_navigation_enabled":true
    }
    const fieldToggles = {
      "withAuxiliaryUserLabels":false
    }

    const profileUrlParams = "?variables="+encodeURIComponent(JSON.stringify(variables))+"&features="+encodeURIComponent(JSON.stringify(features))+"&fieldToggles="+encodeURIComponent(JSON.stringify(fieldToggles));
    const profileUrl = "https://twitter.com/i/api/graphql/qW5u-DAuXpMEG0zA1F7UGQ/UserByScreenName"+profileUrlParams;
    params.url = profileUrl;
    const res2 = await this.request(params);
    const legacy = res2.data.user.result.legacy;
    this.userName = legacy.screen_name;
    this.screenName = legacy.screen_name;
    this.userName = legacy.screen_name;
    this.followers = legacy.followers_count;
    this.followings = legacy.friends_count;
    this.verified = res2.data.user.result.is_blue_verified;
    this.createdTime = new Date(legacy.created_at).getTime();
    this.userInfo.userName = legacy.screen_name;
    this.userInfo.screenName = legacy.screen_name;
  }



}



export default WebTwitter;
