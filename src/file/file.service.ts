import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { normalizeFilename } from 'src/uitils/normalizeFilename';
import axios from 'axios';
import { PassThrough } from 'stream';

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
    const sanitized = filename.replace(/[^a-zA-Z0-9_-]/g, '');
    const renditions = [
      { name: '1080', width: 1920, height: 1080, bitrate: '3000k' },
      { name: '720', width: 1280, height: 720, bitrate: '1500k' },
      { name: '480', width: 854, height: 480, bitrate: '800k' },
    ];

    // Upload original video
    await this.uploadBufferToS3(buffer, `videos/${sanitized}.mp4`, 'video/mp4');

    // Prepare FFmpeg filter_complex for multi-bitrate single pass
    const filterParts = [
      `[0:v]split=${renditions.length}${renditions
        .map((_, i) => `[v${i}]`)
        .join('')}`,
    ];
    renditions.forEach((r, i) =>
      filterParts.push(`[v${i}]scale=${r.width}:${r.height}[out${i}]`),
    );

    // Create input stream
    const inputStream = new PassThrough();
    inputStream.end(buffer);

    // Collect playlist paths
    const playlistPaths = renditions.map(
      (r) => `/hls/${sanitized}/${r.name}/index.m3u8`,
    );

    // Process each rendition in parallel without temp dirs (spawn separate FFmpeg per rendition)
    await Promise.all(
      renditions.map((r, i) => {
        return new Promise<void>((resolve, reject) => {
          const inputStreamCopy = new PassThrough();
          inputStreamCopy.end(buffer);
          let segIndex = 0;
          ffmpeg()
            .input(inputStreamCopy)
            .inputFormat('mp4')
            .outputOptions([
              '-map 0:v',
              `-vf scale=${r.width}:${r.height}`,
              `-c:v libx264`,
              `-b:v ${r.bitrate}`,
              '-map 0:a',
              '-c:a copy',
              '-f segment',
              '-segment_time 20',
              '-segment_list_size 0',
              '-segment_format mpegts',
              `-segment_list hls/${sanitized}/${r.name}/index.m3u8`,
              `-segment_list_entry_prefix /hls/${sanitized}/${r.name}/`,
              `-segment_list_type m3u8`,
            ])
            .on('start', (cmd) => console.log(`FFmpeg ${r.name}:`, cmd))
            .on('error', (err) => reject(new InternalServerErrorException(err)))
            .on('end', async () => {
              resolve();
            })
            .pipe(new PassThrough(), { end: true })
            .on('data', async (chunk: Buffer) => {
              const key = `/hls/${sanitized}/${
                r.name
              }/segment_${segIndex++}.ts`;
              await this.uploadBufferToS3(chunk, key, 'video/MP2T');
            })
            .on('end', async () => {
              // Upload generated playlist file from stdout? Alternatively, reconstruct URL.
              resolve();
            });
        });
      }),
    );

    return playlistPaths;
  }

  private async uploadBufferToS3(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
    } catch (error) {
      console.error(`Failed to upload ${key} to S3`, error);
      throw new InternalServerErrorException(`Upload failed: ${key}`);
    }
  }
  // async processAndSaveVideo(
  //   buffer: Buffer,
  //   filename: string,
  // ): Promise<string[]> {
  //   const sanitizedFilename = normalizeFilename(filename);
  //   const videoKey = `videos/${sanitizedFilename}.mp4`;
  //
  //   // const inputStream = new PassThrough();
  //   // inputStream.end(buffer); // Загружаем данные в поток
  //
  //   // Сохраняем оригинальный видеофайл в MinIO
  //   try {
  //     await this.s3Client.send(
  //       new PutObjectCommand({
  //         Bucket: this.bucketName,
  //         Key: videoKey,
  //         Body: buffer,
  //         ContentType: 'video/mp4',
  //       }),
  //     );
  //   } catch (error) {
  //     console.error('Error uploading video to S3:', error);
  //     throw new InternalServerErrorException('Failed to upload video');
  //   }
  //
  //   const resolutions = [
  //     { resolution: '1080', bitrate: '3000k' },
  //     { resolution: '720', bitrate: '1500k' },
  //     { resolution: '480', bitrate: '800k' },
  //   ];
  //
  //   const m3u8Paths: string[] = [];
  //   const tempDir = './temp'; // Временная папка для HLS-файлов
  //
  //   if (!fs.existsSync(tempDir)) {
  //     fs.mkdirSync(tempDir, { recursive: true });
  //   }
  //
  //   const videoPath = path.join(tempDir, `${sanitizedFilename}.mp4`);
  //   fs.writeFileSync(videoPath, buffer);
  //
  //   // Обработаем каждое разрешение параллельно
  //   const processResolution = async ({
  //     resolution,
  //     bitrate,
  //   }: {
  //     resolution: string;
  //     bitrate: string;
  //   }) => {
  //     const outputDir = path.join(
  //       tempDir,
  //       `${sanitizedFilename}-${resolution}`,
  //     );
  //
  //     if (!fs.existsSync(outputDir)) {
  //       fs.mkdirSync(outputDir, { recursive: true });
  //     }
  //
  //     return new Promise<void>((resolve, reject) => {
  //       ffmpeg(videoPath)
  //         .videoBitrate(bitrate)
  //         .outputOptions([
  //           '-f hls',
  //           '-hls_time 20', // Длительность сегмента
  //           '-hls_list_size 0',
  //         ])
  //         .output(path.join(outputDir, 'index.m3u8'))
  //         .on('end', resolve)
  //         .on('error', (err) => {
  //           console.error('Error processing video:', err);
  //           reject(new Error('ffmpeg process failed'));
  //         })
  //         .run();
  //     });
  //   };
  //
  //   try {
  //     // Обрабатываем все разрешения параллельно
  //     await Promise.all(resolutions.map(processResolution));
  //   } catch (error) {
  //     console.error('Error processing video to HLS:', error);
  //     throw new InternalServerErrorException('Failed to process video to HLS');
  //   }
  //
  //   // Загружаем HLS сегменты в MinIO
  //   const uploadHlsSegments = async (resolution: string) => {
  //     const outputDir = path.join(
  //       tempDir,
  //       `${sanitizedFilename}-${resolution}`,
  //     );
  //     const files = fs.readdirSync(outputDir);
  //
  //     for (const file of files) {
  //       const filePath = path.join(outputDir, file);
  //       const s3Key = `hls/${sanitizedFilename}/${resolution}/${file}`;
  //
  //       try {
  //         await this.s3Client.send(
  //           new PutObjectCommand({
  //             Bucket: this.bucketName,
  //             Key: s3Key,
  //             Body: fs.createReadStream(filePath),
  //             ContentType: file.endsWith('.m3u8')
  //               ? 'application/vnd.apple.mpegurl'
  //               : 'video/MP2T',
  //           }),
  //         );
  //       } catch (error) {
  //         console.error(`Error uploading HLS segment ${file} to S3:`, error);
  //         throw new InternalServerErrorException(
  //           'Failed to upload HLS segment',
  //         );
  //       }
  //     }
  //   };
  //
  //   try {
  //     // Загружаем HLS сегменты для каждого разрешения
  //     await Promise.all(
  //       resolutions.map(({ resolution }) => uploadHlsSegments(resolution)),
  //     );
  //   } catch (error) {
  //     console.error('Error uploading HLS segments:', error);
  //     throw new InternalServerErrorException('Failed to upload HLS segments');
  //   }
  //
  //   // Формируем путь к m3u8
  //   resolutions.forEach(({ resolution }) => {
  //     m3u8Paths.push(`/hls/${sanitizedFilename}/${resolution}/index.m3u8`);
  //   });
  //
  //   try {
  //     fs.rmSync(tempDir, { recursive: true, force: true });
  //     console.log('Temporary files deleted successfully');
  //   } catch (error) {
  //     console.error('Failed to delete temporary files:', error);
  //   }
  //
  //   return m3u8Paths;
  // }

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
