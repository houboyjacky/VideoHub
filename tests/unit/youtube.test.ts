import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  extractYouTubeId,
  parseChannelOrPlaylistInput,
} from "@/lib/youtube";

describe("YouTube 網址與識別碼解析單元測試 (Unit: YouTube Parser)", () => {
  describe("extractYouTubeId - 影片 ID 提取", () => {
    test("直接傳入 11 碼影片 ID 應正確返回", () => {
      assert.equal(extractYouTubeId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    });

    test("標準 watch 網址應正確提取 ID", () => {
      assert.equal(
        extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        "dQw4w9WgXcQ"
      );
    });

    test("youtu.be 短網址應正確提取 ID", () => {
      assert.equal(
        extractYouTubeId("https://youtu.be/dQw4w9WgXcQ"),
        "dQw4w9WgXcQ"
      );
    });

    test("YouTube Shorts 網址應正確提取 ID", () => {
      assert.equal(
        extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
        "dQw4w9WgXcQ"
      );
    });

    test("YouTube Embed 網址應正確提取 ID", () => {
      assert.equal(
        extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
        "dQw4w9WgXcQ"
      );
    });

    test("附帶時間戳與多餘參數之網址應正確提取 ID", () => {
      assert.equal(
        extractYouTubeId(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=shared"
        ),
        "dQw4w9WgXcQ"
      );
    });

    test("無效或空字串應返回 null 避免崩潰", () => {
      assert.equal(extractYouTubeId(""), null);
      assert.equal(extractYouTubeId("https://google.com"), null);
      assert.equal(extractYouTubeId("invalid_id"), null);
      assert.equal(extractYouTubeId(null as any), null);
    });
  });

  describe("parseChannelOrPlaylistInput - 頻道與播放清單輸入解析", () => {
    test("解析以 UC 開頭的 24 碼頻道 ID", () => {
      const parsed = parseChannelOrPlaylistInput("UC1234567890123456789012");
      assert.equal(parsed.type, "channelId");
      assert.equal(parsed.value, "UC1234567890123456789012");
    });

    test("解析 @自訂代稱 (@handle)", () => {
      const parsed = parseChannelOrPlaylistInput("@VideoHubChannel");
      assert.equal(parsed.type, "handle");
      assert.equal(parsed.value, "@VideoHubChannel");
    });

    test("解析包含 /@handle 的 YouTube 頻道網址", () => {
      const parsed = parseChannelOrPlaylistInput(
        "https://www.youtube.com/@VideoHubOfficial"
      );
      assert.equal(parsed.type, "handle");
      assert.equal(parsed.value, "@VideoHubOfficial");
    });

    test("解析包含 /channel/UC... 的 YouTube 頻道網址", () => {
      const parsed = parseChannelOrPlaylistInput(
        "https://www.youtube.com/channel/UC1234567890123456789012"
      );
      assert.equal(parsed.type, "channelId");
      assert.equal(parsed.value, "UC1234567890123456789012");
    });

    test("解析 YouTube 播放清單網址 (list=PL...)", () => {
      const parsed = parseChannelOrPlaylistInput(
        "https://www.youtube.com/playlist?list=PLrAXtmErZgOdP_8GztsuKi9nh450V44z1"
      );
      assert.equal(parsed.type, "playlistId");
      assert.equal(parsed.value, "PLrAXtmErZgOdP_8GztsuKi9nh450V44z1");
    });

    test("解析純播放清單 ID (PL, UU, FL 開頭)", () => {
      const parsed = parseChannelOrPlaylistInput("PLrAXtmErZgOdP_8GztsuKi9nh450V44z1");
      assert.equal(parsed.type, "playlistId");
      assert.equal(parsed.value, "PLrAXtmErZgOdP_8GztsuKi9nh450V44z1");
    });
  });
});
