import "server-only";
import { put } from "@vercel/blob";
import { downloadRecording } from "./aircall";

/**
 * Fetch a recording from Aircall and store it permanently in Vercel Blob.
 * Aircall recording URLs expire ~10 minutes after `call.ended`, so the
 * webhook handler MUST kick this off synchronously (or queue it for an
 * immediate background job).
 *
 * Stores into the workspace's private Blob store; we return the stable
 * pathname (e.g. `aircall/recordings/3852505944.mp3`) rather than the
 * signed URL the SDK gives us, because a private-store URL is short-
 * lived. The player endpoint will mint a fresh signed URL on demand
 * via `head(pathname)` with the user's auth applied.
 */
export async function storeRecordingForCall(
  aircallCallId: number,
  recordingUrl: string,
): Promise<string> {
  const bytes = await downloadRecording(recordingUrl);
  const blob = await put(
    `aircall/recordings/${aircallCallId}.mp3`,
    Buffer.from(bytes),
    {
      access: "private",
      contentType: "audio/mpeg",
      addRandomSuffix: false, // stable, deduped per Aircall call id
      allowOverwrite: true,
    },
  );
  return blob.pathname;
}

export function recordingStorageAvailable(): boolean {
  // Vercel Blob exposes either BLOB_READ_WRITE_TOKEN (legacy direct token)
  // or BLOB_STORE_ID (newer OIDC integration). Either is enough — the SDK
  // figures out how to authenticate at request time.
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
