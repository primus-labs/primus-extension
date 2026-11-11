/**
 * HTML XPath evaluation (CommonJS for node --test + webpack import).
 */
const { select } = require('xpath');
const { DOMParser } = require('xmldom');
const cheerio = require('cheerio');

function validateXPathWithLibs(html, xpath) {
  try {
    const normalizedXpath = String(xpath || '')
      .trim()
      .replace(/\?+$/, '');
    if (!normalizedXpath) return [];

    const $ = cheerio.load(html, { decodeEntities: false });
    $('script').empty();
    $('style,noscript').remove();
    const cleanedHtml = $.html()
      .replace(/&nbsp;/gi, ' ')
      .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    const parserMessages = [];
    const doc = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: (msg) => {
          parserMessages.push(String(msg || 'fatal parse error'));
        },
      },
    }).parseFromString(cleanedHtml);
    if (parserMessages.length) {
      throw new Error(parserMessages[0]);
    }
    const nodes = select(normalizedXpath, doc);

    return nodes
      .map((node) => {
        if (node.nodeType === 2) {
          return node.value;
        }
        if (node.nodeType === 1) {
          return node.getAttribute('content') || node.textContent;
        }
        return null;
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Failed to valid XPath：', error.message);
    return [];
  }
}

module.exports = { validateXPathWithLibs };
