import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { normalizeFilename } from 'src/uitils/normalizeFilename';
import axios from 'axios';
import * as path from 'path';
import fs, { copyFileSync, createReadStream } from 'fs';
import { CreateFilmVideosDto } from '../films/dto/create-film.dto';
import { FileSystemStoredFile } from 'nestjs-form-data';
import * as uuid from 'uuid';

@Injectable()
export class FileService {
  private s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT, // Указываем MinIO endpoint
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Необходим для MinIO
  });

  private bucketName = process.env.S3_BUCKET_NAME;

  async savePoster(file: FileSystemStoredFile): Promise<string> {
    const supportedFormats = ['.jpg', '.jpeg', '.webp', '.png'];
    const extension = path.extname(file.originalName).toLowerCase();

    if (!supportedFormats.includes(extension)) {
      throw new Error(
        'Unsupported image format. Only jpg, webp, and png are allowed.',
      );
    }

    const normalizedFilename = normalizeFilename(file.originalName);
    const s3Key = `posters/${normalizedFilename}${extension}`;
    const stream = createReadStream(file.path);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: stream,
          ContentType: `image/${extension.replace('.', '')}`,
        }),
      );
    } catch (error) {
      console.error('Error uploading poster to S3:', error);
      throw new InternalServerErrorException('Failed to upload poster');
    }

    return `/${s3Key}`;
  }

  async processAndSegmentVideos(
    videos: CreateFilmVideosDto[],
  ): Promise<{ variant: string; path: string }[]> {
    const rootTempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(rootTempDir)) fs.mkdirSync(rootTempDir);

    const results: { variant: string; path: string }[] = [];

    for (const { file, variant } of videos) {
      const sanitizedFilename = `film__${uuid.v4()}_${variant}`;
      const videoDir = path.join(rootTempDir, sanitizedFilename);
      fs.mkdirSync(videoDir, { recursive: true });

      const inputPath = path.join(videoDir, `${sanitizedFilename}.mp4`);

      copyFileSync(file.path, inputPath);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-c copy',
            '-f hls',
            '-hls_time 10',
            '-hls_list_size 0',
            `-hls_segment_filename ${path.join(videoDir, 'segment_%03d.ts')}`,
          ])
          .output(path.join(videoDir, 'index.m3u8'))
          .on('end', resolve)
          .on('error', (err) => {
            console.error(`FFmpeg segmentation error (${variant}):`, err);
            reject(
              new InternalServerErrorException('Video segmentation failed'),
            );
          })
          .run();
      });

      const files = fs.readdirSync(videoDir);
      for (const file of files) {
        if (file.endsWith('.mp4')) continue;

        const filePath = path.join(videoDir, file);
        const key = `hls/${sanitizedFilename}/${variant}/${file}`;

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: fs.createReadStream(filePath),
            ContentType: file.endsWith('.m3u8')
              ? 'application/vnd.apple.mpegurl'
              : 'video/MP2T',
          }),
        );
      }

      results.push({
        variant,
        path: `/hls/${sanitizedFilename}/${variant}/index.m3u8`,
      });
    }

    fs.rmSync(rootTempDir, { recursive: true, force: true });

    return results;
  }

  async deleteFileFromS3(key: string): Promise<void> {
    try {
      const bucketName = process.env.S3_BUCKET_NAME!;
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key.startsWith('/') ? key.slice(1) : key,
        }),
      );
      console.log(`Deleted from S3: ${key}`);
    } catch (error) {
      console.error(`Failed to delete ${key} from S3`, error);
      throw error;
    }
  }

  async getS3KeysFromM3U8(m3u8Url: string): Promise<string[]> {
    try {
      const res = await axios.get(m3u8Url);
      const text = res.data as string;

      const basePath = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);

      const bucketName = process.env.S3_BUCKET_NAME!;
      const lines = text.split('\n');
      const keys: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const url = new URL(basePath);
          let baseS3Prefix = url.pathname; // "/hls/film__.../480p/"
          if (baseS3Prefix.startsWith(`/${bucketName}/`)) {
            baseS3Prefix = baseS3Prefix.replace(`/${bucketName}/`, '/');
          }
          const key = baseS3Prefix + trimmed;
          keys.push(key);
        }
      }

      return keys;
    } catch (error) {
      console.error('Failed to get keys from M3U8', error);
      throw error;
    }
  }
}
