import { syncChannelVideos, getSyncMeta, SyncChannelResult } from "@/lib/sync-channel";

export interface SyncYouTubeChannelInput {
  customTarget?: string;
  accessToken?: string;
}

/**
 * Application Use Case: 執行 YouTube 頻道或播放清單增量同步
 */
export async function syncYouTubeChannelUseCase(
  input: SyncYouTubeChannelInput = {}
): Promise<SyncChannelResult> {
  return await syncChannelVideos(input.customTarget, input.accessToken);
}

export async function getYouTubeSyncMetaUseCase() {
  return await getSyncMeta();
}
