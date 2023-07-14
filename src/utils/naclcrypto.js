import { getEncryptionPublicKey, encrypt, decrypt} from "@metamask/eth-sig-util"

export function getNaclEncryptionPublicKey(privateKey) {
    return getEncryptionPublicKey(privateKey);
}

export function naclEncrypt(publicKey, data) {
    return encrypt({publicKey, data, version:'x25519-xsalsa20-poly1305'});
}

export function naclDecrypt(encryptedData, privateKey) {
    return decrypt({encryptedData, privateKey});
}
