export const AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID =
  '9119207f-5884-403d-8bb3-1b6870d428fe';

export const DEFAULT_AMAZON_STOREFRONT = 'https://www.amazon.com';
export const DEFAULT_AMAZON_CNEP_URL =
  'https://www.amazon.com/ap/cnep?openid.assoc_handle=usflex';
export const DEFAULT_AMAZON_COUNTRY_CODE = 'DEFAULT';
export const AMAZON_GEO_FETCH_TIMEOUT_MS = 4000;

export const CLOUDFLARE_TRACE_URLS = [
  'https://1.1.1.1/cdn-cgi/trace',
  'https://www.cloudflare.com/cdn-cgi/trace',
];

/**
 * @typedef {object} AmazonStorefrontConfig
 * @property {string} storefrontUrl Amazon site origin used for site matching.
 * @property {string} cnepUrl Standard account management login URL for the site.
 */

/** @type {Record<string, AmazonStorefrontConfig>} */
export const AMAZON_STOREFRONT_BY_COUNTRY = {
  US: {
    storefrontUrl: 'https://www.amazon.com',
    cnepUrl: DEFAULT_AMAZON_CNEP_URL,
  },
  CA: {
    storefrontUrl: 'https://www.amazon.ca',
    cnepUrl: 'https://www.amazon.ca/ap/cnep?openid.assoc_handle=caflex',
  },
  MX: {
    storefrontUrl: 'https://www.amazon.com.mx',
    cnepUrl: 'https://www.amazon.com.mx/ap/cnep?openid.assoc_handle=mxflex',
  },
  BR: {
    storefrontUrl: 'https://www.amazon.com.br',
    cnepUrl: 'https://www.amazon.com.br/ap/cnep?openid.assoc_handle=brflex',
  },
  GB: {
    storefrontUrl: 'https://www.amazon.co.uk',
    cnepUrl: 'https://www.amazon.co.uk/ap/cnep?openid.assoc_handle=gbflex',
  },
  DE: {
    storefrontUrl: 'https://www.amazon.de',
    cnepUrl: 'https://www.amazon.de/ap/cnep?openid.assoc_handle=deflex',
  },
  FR: {
    storefrontUrl: 'https://www.amazon.fr',
    cnepUrl: 'https://www.amazon.fr/ap/cnep?openid.assoc_handle=frflex',
  },
  IT: {
    storefrontUrl: 'https://www.amazon.it',
    cnepUrl: 'https://www.amazon.it/ap/cnep?openid.assoc_handle=itflex',
  },
  ES: {
    storefrontUrl: 'https://www.amazon.es',
    cnepUrl: 'https://www.amazon.es/ap/cnep?openid.assoc_handle=esflex',
  },
  NL: {
    storefrontUrl: 'https://www.amazon.nl',
    cnepUrl: 'https://www.amazon.nl/ap/cnep?openid.assoc_handle=nlflex',
  },
  BE: {
    storefrontUrl: 'https://www.amazon.com.be',
    cnepUrl: 'https://www.amazon.com.be/ap/cnep?openid.assoc_handle=beflex',
  },
  SE: {
    storefrontUrl: 'https://www.amazon.se',
    cnepUrl: 'https://www.amazon.se/ap/cnep?openid.assoc_handle=seflex',
  },
  PL: {
    storefrontUrl: 'https://www.amazon.pl',
    cnepUrl: 'https://www.amazon.pl/ap/cnep?openid.assoc_handle=plflex',
  },
  TR: {
    storefrontUrl: 'https://www.amazon.com.tr',
    cnepUrl: 'https://www.amazon.com.tr/ap/cnep?openid.assoc_handle=trflex',
  },
  IE: {
    storefrontUrl: 'https://www.amazon.ie',
    cnepUrl: 'https://www.amazon.ie/ap/cnep?openid.assoc_handle=ieflex',
  },
  JP: {
    storefrontUrl: 'https://www.amazon.co.jp',
    cnepUrl: 'https://www.amazon.co.jp/ap/cnep?openid.assoc_handle=jpflex',
  },
  SG: {
    storefrontUrl: 'https://www.amazon.sg',
    cnepUrl: 'https://www.amazon.sg/ap/cnep?openid.assoc_handle=sgflex',
  },
  AU: {
    storefrontUrl: 'https://www.amazon.com.au',
    cnepUrl: 'https://www.amazon.com.au/ap/cnep?openid.assoc_handle=auflex',
  },
  IN: {
    storefrontUrl: 'https://www.amazon.in',
    cnepUrl: 'https://www.amazon.in/ap/cnep?openid.assoc_handle=inflex',
  },
  AE: {
    storefrontUrl: 'https://www.amazon.ae',
    cnepUrl: 'https://www.amazon.ae/ap/cnep?openid.assoc_handle=aeflex',
  },
  SA: {
    storefrontUrl: 'https://www.amazon.sa',
    cnepUrl: 'https://www.amazon.sa/ap/cnep?openid.assoc_handle=saflex',
  },
  EG: {
    storefrontUrl: 'https://www.amazon.eg',
    cnepUrl: 'https://www.amazon.eg/ap/cnep?openid.assoc_handle=egflex',
  },
  ZA: {
    storefrontUrl: 'https://www.amazon.co.za',
    cnepUrl: 'https://www.amazon.co.za/ap/cnep?openid.assoc_handle=zaflex',
  },
  DEFAULT: {
    storefrontUrl: DEFAULT_AMAZON_STOREFRONT,
    cnepUrl: DEFAULT_AMAZON_CNEP_URL,
  },
};
