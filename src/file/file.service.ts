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
import fs from 'fs';
import { CreateFilmVideosDto } from '../films/dto/create-film.dto';
import { MemoryStoredFile } from 'nestjs-form-data';

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

  async savePoster(file: MemoryStoredFile): Promise<string> {
    const supportedFormats = ['.jpg', '.jpeg', '.webp', '.png'];
    const extension = path.extname(file.originalName).toLowerCase();

    if (!supportedFormats.includes(extension)) {
      throw new Error(
        'Unsupported image format. Only jpg, webp, and png are allowed.',
      );
    }

    const normalizedFilename = normalizeFilename(file.originalName);
    const s3Key = `posters/${normalizedFilename}${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: file.buffer,
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
      const sanitizedFilename = normalizeFilename(file.originalName);
      const videoDir = path.join(
        rootTempDir,
        `${sanitizedFilename}_${variant}`,
      );
      fs.mkdirSync(videoDir, { recursive: true });

      const inputPath = path.join(videoDir, `${sanitizedFilename}.mp4`);
      fs.writeFileSync(inputPath, file.buffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-c copy',
            '-f hls',
            '-hls_time 6',
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

      fs.rmSync(rootTempDir, { recursive: true, force: true });
    }

    return results;
  }

  async deleteFileFromS3(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      console.log(`File ${key} successfully deleted from S3.`);
    } catch (error) {
      console.error(`Failed to delete file ${key} from S3:`, error);
      throw new Error('Failed to delete file from S3.');
    }
  }

  async getS3KeysFromM3U8(url: string): Promise<string[]> {
    try {
      // Скачиваем m3u8 файл
      const response = await axios.get(url);
      const m3u8Content = response.data;

      // Базовый путь для вычисления S3 ключей
      const basePath = url.substring(0, url.lastIndexOf('/') + 1);

      // Разбиваем содержимое на строки и фильтруем сегменты
      const s3Keys = m3u8Content
        .split('\n')
        .filter((line) => line && !line.startsWith('#')) // Игнорируем комментарии (#EXTINF, #EXT-X, и т.д.)
        .map((segmentPath) => {
          // Формируем полный путь сегмента
          const fullPath = new URL(segmentPath, basePath).toString();

          // Извлекаем ключ S3 из полного пути
          const s3Key = fullPath.replace(`${basePath}`, '');
          return s3Key;
        });

      return s3Keys;
    } catch (error) {
      console.error('Failed to get S3 keys from m3u8:', error);
      throw new Error('Failed to parse m3u8 file.');
    }
  }
}
