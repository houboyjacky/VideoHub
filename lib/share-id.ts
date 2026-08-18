import crypto from "crypto";

const URL_SAFE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

/**
 * 生成 10 碼隨機 URL-Safe 分享識別碼 (nanoid 風格)
 */
export function generateShareId(size = 10): string {
  const bytes = crypto.randomBytes(size);
  let id = "";
  for (let i = 0; i < size; i++) {
    id += URL_SAFE_ALPHABET[bytes[i] % URL_SAFE_ALPHABET.length];
  }
  return id;
}
