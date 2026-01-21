import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Readable, PassThrough } from 'stream';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * Converts MP3 audio buffer to OGG Opus format for WhatsApp mobile compatibility.
 * WhatsApp Web accepts MP3 with ptt:true, but mobile (Android/iOS) requires OGG Opus.
 */
export async function convertMp3ToOpus(mp3Buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inputStream = new Readable();
    inputStream.push(mp3Buffer);
    inputStream.push(null);

    const chunks: Buffer[] = [];
    const outputStream = new PassThrough();

    outputStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    outputStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    outputStream.on('error', reject);

    ffmpeg(inputStream)
      .inputFormat('mp3')
      .audioCodec('libopus')
      .audioFrequency(48000)
      .audioChannels(1)
      .audioBitrate('64k')
      .format('ogg')
      .on('error', (err: Error) => {
        console.error('FFmpeg conversion error:', err);
        reject(err);
      })
      .pipe(outputStream, { end: true });
  });
}
