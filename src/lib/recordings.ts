import "server-only";
import { put } from "@vercel/blob";
import { downloadRecording } from "./aircall";

/**
 * Fetch a recording from Aircall and store it permanently in Vercel Blob.
 * Aircall recording URLs expire ~10 minutes after `call.ended`, so the
 * webhook handler MUST kick this off synchronously (or queue it for an
 * immediate background job).
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
      access: "public", // signed URL via Vercel Blob; we re-gate access in the app
      contentType: "audio/mpeg",
      addRandomSuffix: false, // stable, deduped per Aircall call id
      allowOverwrite: true,
    },
  );
  return blob.url;
}

export function recordingStorageAvailable(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
