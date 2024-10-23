import WebSocial from './websocial';

class WebTwitter extends WebSocial {
  constructor() {
    super('x');
  }

  async getInfo() {
    const params = {};
    params.url = 'https://api.x.com/1.1/account/settings.json';
    params.method = 'GET';
    const storageStr = await chrome.storage.local.get([params.url]);
    const storageObj = JSON.parse(storageStr[params.url]);
    params.url = params.url + '?' + storageObj.queryString;
    params.headers = storageObj.headers;
    //get screen name
    const res = await this.request(params);

    const variables = {
      screen_name: res.screen_name,
      withSafetyModeUserFields: true,
    };
    const features = {
      hidden_profile_likes_enabled: true,
      hidden_profile_subscriptions_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      subscriptions_verification_info_is_identity_verified_enabled: true,
      subscriptions_verification_info_verified_since_enabled: true,
      highlights_tweets_tab_ui_enabled: true,
      responsive_web_twitter_article_notes_tab_enabled: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
    };
    const fieldToggles = {
      withAuxiliaryUserLabels: false,
    };

    const profileUrlParams =
      '?variables=' +
      encodeURIComponent(JSON.stringify(variables)) +
      '&features=' +
      encodeURIComponent(JSON.stringify(features)) +
      '&fieldToggles=' +
      encodeURIComponent(JSON.stringify(fieldToggles));
    const profileUrl =
      'https://x.com/i/api/graphql/qW5u-DAuXpMEG0zA1F7UGQ/UserByScreenName' +
      profileUrlParams;
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
    const userId = res2.data.user.result.rest_id;
    let cursor;
    let needBreak = false;
    let totalPost = 0;
    while (!needBreak) {
      const bean = await this.getPostSize(userId, cursor, storageObj.headers);
      cursor = bean.cursor;
      totalPost = Number(totalPost) + Number(bean.count);
      if (bean.needBreak) {
        break;
      }
    }
    // console.log(`twitter totalPost is:${totalPost}`)
    this.posts = totalPost
  }

  async getPostSize(userId, cursor, headers) {
    const variables = {
      userId: userId,
      count: 20,
      includePromotedContent: true,
      withQuickPromoteEligibilityTweetFields: true,
      withVoice: true,
      withV2Timeline: true,
    };
    if (cursor) {
      variables.cursor = cursor;
    }

    const featuresStr =
      '{"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"articles_preview_enabled":true,"tweetypie_unmention_optimization_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"creator_subscriptions_quote_tweet_preview_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"tweet_with_visibility_results_prefer_gql_media_interstitial_enabled":true,"rweb_video_timestamps_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_enhance_cards_enabled":false}&fieldToggles={"withArticlePlainText":false}';
    const urlParam =
      '?variables=' +
      encodeURIComponent(JSON.stringify(variables)) +
      '&features=' +
      encodeURIComponent(featuresStr);
    const fullUrl =
      'https://x.com/i/api/graphql/9zyyd1hebl7oNWIPdA8HRw/UserTweets' +
      urlParam;
    const params = {};
    params.url = fullUrl;
    params.headers = headers;
    const res = await this.request(params);
    const instructions = res.data.user.result.timeline_v2.timeline.instructions;
    let timelineAddEntries;
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].type === 'TimelineAddEntries') {
        timelineAddEntries = instructions[i];
      }
    }
    if (timelineAddEntries) {
      const entries = timelineAddEntries.entries;
      if (entries.length === 2) {
        return { count: 0, cursor: null, needBreak: true };
      }
      let count = 0;
      let newCursor;
      for (let i = 0; i < entries.length; i++) {
        if (!entries[i].entryId.indexOf('cursor') === 0 && !entries[i].entryId.indexOf('who-to-follow') === 0) {
          count++;
        }
        if (entries[i].entryId.indexOf('cursor-bottom') == 0) {
          newCursor = entries[i].content.value;
        }
      }
      return { count: count, cursor: newCursor, needBreak: false };
    }
  }
}

export default WebTwitter;
