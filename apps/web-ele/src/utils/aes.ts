/**
 * AES 加密工具 - 与原血透系统保持一致的加密方式
 * 使用 AES-CBC 模式，PKCS7 填充
 */
import CryptoJS from 'crypto-js';

// 与原系统一致的密钥和IV（Base64编码）
const KEY_BASE64 = 'MTIzNDU2Nzg5MDAwMDAwMDEyMzQ1Njc4OTAwMDAwMDA=';
const IV_BASE64 = 'MTIzNDU2Nzg5MDAwMDAwMA==';

/**
 * Base64 解码为 Unicode 字符串
 */
function base64DecodeUnicode(str: string): string {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}

/**
 * AES 加密 - 与原系统 Safety.Encrypt 完全一致
 * @param word 要加密的字符串
 * @returns 加密后的十六进制字符串
 */
export function aesEncrypt(word: string): string {
  if (!word || word === 'undefined') {
    return '';
  }

  const strKey = base64DecodeUnicode(KEY_BASE64);
  const strIv = base64DecodeUnicode(IV_BASE64);

  const key = CryptoJS.enc.Utf8.parse(strKey);
  const iv = CryptoJS.enc.Utf8.parse(strIv);
  const srcs = CryptoJS.enc.Utf8.parse(word);

  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 返回十六进制字符串（与原系统一致）
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

/**
 * AES 解密 - 与原系统 Safety.Decrypt 完全一致
 * @param word 要解密的十六进制字符串
 * @returns 解密后的原始字符串
 */
export function aesDecrypt(word: string): string {
  if (!word || word === 'undefined') {
    return '';
  }

  const encryptedHexStr = CryptoJS.enc.Hex.parse(word);
  const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);

  const strKey = base64DecodeUnicode(KEY_BASE64);
  const strIv = base64DecodeUnicode(IV_BASE64);

  const key = CryptoJS.enc.Utf8.parse(strKey);
  const iv = CryptoJS.enc.Utf8.parse(strIv);

  const decrypted = CryptoJS.AES.decrypt(srcs, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}
