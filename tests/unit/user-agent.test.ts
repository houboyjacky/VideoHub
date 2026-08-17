import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseUserAgent } from "@/lib/user-agent";

describe("作業系統與瀏覽器 User-Agent 解析單元測試 (Unit: User Agent Parser)", () => {
  test("Windows 10 / 11 Chrome 解析", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
    const res = parseUserAgent(ua);
    assert.equal(res.os, "Windows 10/11");
    assert.equal(res.browser, "Chrome 128");
    assert.equal(res.device, "Desktop");
  });

  test("macOS Safari 解析", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
    const res = parseUserAgent(ua);
    assert.equal(res.os, "macOS 14.5");
    assert.equal(res.browser, "Safari 17");
    assert.equal(res.device, "Desktop");
  });

  test("iPhone iOS Safari 解析", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    const res = parseUserAgent(ua);
    assert.equal(res.os, "iOS 17.5.1");
    assert.equal(res.browser, "Safari 17");
    assert.equal(res.device, "Mobile");
  });

  test("Android Chrome 解析", () => {
    const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36";
    const res = parseUserAgent(ua);
    assert.equal(res.os, "Android 14");
    assert.equal(res.browser, "Chrome 128");
    assert.equal(res.device, "Mobile");
  });

  test("Linux Firefox 解析", () => {
    const ua = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0";
    const res = parseUserAgent(ua);
    assert.equal(res.os, "Linux");
    assert.equal(res.browser, "Firefox 129");
    assert.equal(res.device, "Desktop");
  });

  test("空字串或 null 安全處理", () => {
    const res = parseUserAgent(null);
    assert.equal(res.os, "未知系統");
    assert.equal(res.browser, "未知瀏覽器");
  });
});
