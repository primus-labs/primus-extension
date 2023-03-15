var cryp = require('crypto');
var scrypt = require('scrypt-js');
var BN = require('bn.js');
var ethereumjsUtil = require('ethereumjs-util');

export const encrypt = function(message, password, options) {
    /* jshint maxcomplexity: 20 */

    options = options || {};
    var salt = options.salt || cryp.randomBytes(32);
    var iv = options.iv || cryp.randomBytes(16);

    var derivedKey;
    var kdf = options.kdf || 'scrypt';
    var kdfparams = {
        dklen: options.dklen || 32,
        salt: salt.toString('hex')
    };

    if (kdf === 'pbkdf2') {
        kdfparams.c = options.c || 262144;
        kdfparams.prf = 'hmac-sha256';
        derivedKey = cryp.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256');
    } else if (kdf === 'scrypt') {
        // FIXME: support progress reporting callback
        kdfparams.n = options.n || 8192; // 2048 4096 8192 16384
        kdfparams.r = options.r || 8;
        kdfparams.p = options.p || 1;
        derivedKey = scrypt.syncScrypt(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else {
        throw new Error('Unsupported kdf');
    }

    var cipher = cryp.createCipheriv(options.cipher || 'aes-128-ctr', derivedKey.slice(0, 16), iv);
    if (!cipher) {
        throw new Error('Unsupported cipher');
    }

    var ciphertext = Buffer.from([
        ...cipher.update(Buffer.from(message)),
        ...cipher.final()]
    );

    var mac = sha3(Buffer.from([...derivedKey.slice(16, 32), ...ciphertext])).replace('0x', '');

    return {
        ciphertext: ciphertext.toString('hex'),
        cipherparams: {
                iv: iv.toString('hex')
        },
        cipher: options.cipher || 'aes-128-ctr',
        kdf: kdf,
        kdfparams: kdfparams,
        mac: mac.toString('hex')
    };
};

export const decrypt = function(ciphermsg, password, nonStrict) {
    /* jshint maxcomplexity: 10 */

    if (!(typeof password === 'string')) {
        throw new Error('No password given.');
    }

    var json = (!!ciphermsg && typeof ciphermsg === 'object') ? ciphermsg : JSON.parse(nonStrict ? ciphermsg.toLowerCase() : ciphermsg);

    var derivedKey;
    var kdfparams;
    if (json.kdf === 'scrypt') {
        kdfparams = json.kdfparams;

        // FIXME: support progress reporting callback
        derivedKey = scrypt.syncScrypt(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else if (json.kdf === 'pbkdf2') {
        kdfparams = json.kdfparams;

        if (kdfparams.prf !== 'hmac-sha256') {
            throw new Error('Unsupported parameters to PBKDF2');
        }

        derivedKey = cryp.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256');
    } else {
        throw new Error('Unsupported key derivation scheme');
    }

    var ciphertext = Buffer.from(json.ciphertext, 'hex');

    var mac = sha3(Buffer.from([...derivedKey.slice(16, 32), ...ciphertext])).replace('0x', '');
    if (mac !== json.mac) {
        throw new Error('Key derivation failed - possibly wrong password');
    }

    var decipher = cryp.createDecipheriv(json.cipher, derivedKey.slice(0, 16), Buffer.from(json.cipherparams.iv, 'hex'));
    var deciphertext = Buffer.from([...decipher.update(ciphertext), ...decipher.final()]).toString();

    return deciphertext;
};

/**
 * Hashes values to a sha3 hash using keccak 256
 *
 * To hash a HEX string the hex must have 0x in front.
 *
 * @method sha3
 * @return {String} the sha3 string
 */
var SHA3_NULL_S = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';

var sha3 = function (value) {
    if (isBN(value)) {
        value = value.toString();
    }

    if (isHexStrict(value) && /^0x/i.test((value).toString())) {
        value = ethereumjsUtil.toBuffer(value);
    } else if (typeof value === 'string') {
        // Assume value is an arbitrary string
        value = Buffer.from(value, 'utf-8');
    }

    var returnValue = ethereumjsUtil.bufferToHex(ethereumjsUtil.keccak256(value));

    if(returnValue === SHA3_NULL_S) {
        return null;
    } else {
        return returnValue;
    }
};

var isBN = function (object) {
    return BN.isBN(object);
};

/**
 * Check if string is HEX, requires a 0x in front
 *
 * @method isHexStrict
 * @param {String} hex to be checked
 * @returns {Boolean}
 */
var isHexStrict = function (hex) {
    return ((typeof hex === 'string' || typeof hex === 'number') && /^(-)?0x[0-9a-f]*$/i.test(hex));
};




