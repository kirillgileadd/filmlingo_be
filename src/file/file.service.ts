import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { normalizeFilename } from 'src/uitils/normalizeFilename';
import axios from 'axios';

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

  async savePoster(
    buffer: Buffer,
    filename: string,
    extension: string,
    type: 'poster' | 'bigPoster' | 'titleImage',
  ): Promise<string> {
    const supportedFormats = ['.jpg', '.jpeg', '.webp', '.png'];
    if (!supportedFormats.includes(extension)) {
      throw new Error(
        'Unsupported image format. Only jpg, webp, and png are allowed.',
      );
    }

    const normalizedFilename = normalizeFilename(filename);
    const s3Key = `posters/${normalizedFilename}-${type}${extension}`;

    // Загружаем файл в MinIO
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: `image/${extension.replace('.', '')}`,
        }),
      );
    } catch (error) {
      console.error('Error uploading poster to S3:', error);
      throw new InternalServerErrorException('Failed to upload poster');
    }

    return `/${s3Key}`;
  }

  async processAndSaveVideo(
    buffer: Buffer,
    filename: string,
  ): Promise<string[]> {
    const sanitizedFilename = normalizeFilename(filename);
    const videoKey = `videos/${sanitizedFilename}.mp4`;

    // const inputStream = new PassThrough();
    // inputStream.end(buffer); // Загружаем данные в поток

    // Сохраняем оригинальный видеофайл в MinIO
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: videoKey,
          Body: buffer,
          ContentType: 'video/mp4',
        }),
      );
    } catch (error) {
      console.error('Error uploading video to S3:', error);
      throw new InternalServerErrorException('Failed to upload video');
    }

    const resolutions = [
      { resolution: '1080', bitrate: '3000k' },
      { resolution: '720', bitrate: '1500k' },
      { resolution: '480', bitrate: '800k' },
    ];

    const m3u8Paths: string[] = [];
    const tempDir = './temp'; // Временная папка для HLS-файлов

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const videoPath = path.join(tempDir, `${sanitizedFilename}.mp4`);
    fs.writeFileSync(videoPath, buffer);

    // Обработаем каждое разрешение параллельно
    const processResolution = async ({
      resolution,
      bitrate,
    }: {
      resolution: string;
      bitrate: string;
    }) => {
      const outputDir = path.join(
        tempDir,
        `${sanitizedFilename}-${resolution}`,
      );

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      return new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .videoBitrate(bitrate)
          .outputOptions([
            '-f hls',
            '-hls_time 20', // Длительность сегмента
            '-hls_list_size 0',
          ])
          .output(path.join(outputDir, 'index.m3u8'))
          .on('end', resolve)
          .on('error', (err) => {
            console.error('Error processing video:', err);
            reject(new Error('ffmpeg process failed'));
          })
          .run();
      });
    };

    try {
      // Обрабатываем все разрешения параллельно
      await Promise.all(resolutions.map(processResolution));
    } catch (error) {
      console.error('Error processing video to HLS:', error);
      throw new InternalServerErrorException('Failed to process video to HLS');
    }

    // Загружаем HLS сегменты в MinIO
    const uploadHlsSegments = async (resolution: string) => {
      const outputDir = path.join(
        tempDir,
        `${sanitizedFilename}-${resolution}`,
      );
      const files = fs.readdirSync(outputDir);

      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const s3Key = `hls/${sanitizedFilename}/${resolution}/${file}`;

        try {
          await this.s3Client.send(
            new PutObjectCommand({
              Bucket: this.bucketName,
              Key: s3Key,
              Body: fs.createReadStream(filePath),
              ContentType: file.endsWith('.m3u8')
                ? 'application/vnd.apple.mpegurl'
                : 'video/MP2T',
            }),
          );
        } catch (error) {
          console.error(`Error uploading HLS segment ${file} to S3:`, error);
          throw new InternalServerErrorException(
            'Failed to upload HLS segment',
          );
        }
      }
    };

    try {
      // Загружаем HLS сегменты для каждого разрешения
      await Promise.all(
        resolutions.map(({ resolution }) => uploadHlsSegments(resolution)),
      );
    } catch (error) {
      console.error('Error uploading HLS segments:', error);
      throw new InternalServerErrorException('Failed to upload HLS segments');
    }

    // Формируем путь к m3u8
    resolutions.forEach(({ resolution }) => {
      m3u8Paths.push(`/hls/${sanitizedFilename}/${resolution}/index.m3u8`);
    });

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('Temporary files deleted successfully');
    } catch (error) {
      console.error('Failed to delete temporary files:', error);
    }

    return m3u8Paths;
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
