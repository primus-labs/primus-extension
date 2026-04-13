/**
 * Ephemeral extension identity: register via EIP-712 + /public/pado/identity without persisting privateKey.
 */
import Web3EthAccounts from 'web3-eth-accounts';
import { getUserIdentity } from '@/services/api/user';
import { requestSignTypedData } from '@/services/wallets/utils';
import {
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
} from '@/utils/safeStorage';

export const MAX_IDENTITY_ATTEMPTS_PER_WALLET = 3;
export const MAX_WALLET_ROUNDS = 3;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One identity exchange attempt (sign + GET identity). Persists userInfo only on rc === 0.
 * @param {string} privateKey - hex private key (with or without 0x)
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export async function attemptRegisterWithKeyPair(privateKey, address) {
  const privateKeyStr = privateKey?.startsWith('0x')
    ? privateKey.slice(2)
    : privateKey;
  const timestamp = String(+new Date());
  try {
    const signature = await requestSignTypedData(
      privateKeyStr,
      address,
      timestamp
    );
    if (!signature) return false;
    const res = await getUserIdentity({
      signature,
      timestamp,
      address,
    });
    console.log('getUserIdentity', res);
    const { rc, result } = res || {};
    if (rc === 0 && result) {
      const { bearerToken, identifier } = result;
      await safeStorageSet({
        userInfo: JSON.stringify({
          id: identifier,
          token: bearerToken,
        }),
      });
      return true;
    }
    return false;
  } catch (e) {
    console.log('getUserIdentity error', e);
    return false;
  }
}

const LEGACY_SECRET_KEYS = ['privateKey', 'padoCreatedWalletAddress'];

/**
 * Remove persisted private key from older builds; optionally finish registration once in memory.
 */
export async function migrateLegacyStoredPrivateKey() {
  const { userInfo, privateKey, padoCreatedWalletAddress } =
    await safeStorageGet([
      'userInfo',
      'privateKey',
      'padoCreatedWalletAddress',
    ]);

  if (userInfo) {
    if (privateKey != null || padoCreatedWalletAddress != null) {
      await safeStorageRemove(LEGACY_SECRET_KEYS);
    }
    return;
  }

  if (!privateKey) return;

  const web3EthAccount = new Web3EthAccounts();
  let account;
  try {
    account = web3EthAccount.privateKeyToAccount(privateKey);
  } catch (e) {
    console.log('migrateLegacyStoredPrivateKey invalid key', e);
    await safeStorageRemove(LEGACY_SECRET_KEYS);
    return;
  }

  const pk = account.privateKey;
  const addr = account.address;

  for (let i = 0; i < MAX_IDENTITY_ATTEMPTS_PER_WALLET; i++) {
    const ok = await attemptRegisterWithKeyPair(pk, addr);
    if (ok) break;
    if (i < MAX_IDENTITY_ATTEMPTS_PER_WALLET - 1) await sleep(500);
  }

  await safeStorageRemove(LEGACY_SECRET_KEYS);
}

/**
 * Ensure chrome.storage has userInfo: migrate legacy key material, then ephemeral create + retries.
 */
export async function ensureExtensionUserIdentity() {
  await migrateLegacyStoredPrivateKey();

  const { userInfo } = await safeStorageGet(['userInfo']);
  if (userInfo) return;

  const web3EthAccount = new Web3EthAccounts();

  for (let round = 0; round < MAX_WALLET_ROUNDS; round++) {
    const { privateKey, address } = web3EthAccount.create();

    for (let attempt = 0; attempt < MAX_IDENTITY_ATTEMPTS_PER_WALLET; attempt++) {
      const ok = await attemptRegisterWithKeyPair(privateKey, address);
      if (ok) return;
      if (attempt < MAX_IDENTITY_ATTEMPTS_PER_WALLET - 1) await sleep(500);
    }
  }
}
