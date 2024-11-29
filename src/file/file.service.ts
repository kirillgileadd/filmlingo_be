import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';
import { extname } from 'path';
import { normalizeFilename } from 'src/uitils/normalizeFilename';
import { v4 as uuidv4 } from 'uuid';

// const execAsync = promisify(exec);

@Injectable()
export class FileService {
  private validImageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
  private validVideoExtensions = ['.mp4', '.mkv', '.avi'];

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

  storage = (destination: string) =>
    diskStorage({
      destination: `./uploads/${destination}`,
      filename: (req, file, callback) => {
        const uniqueSuffix = uuidv4();
        const ext = extname(file.originalname).toLowerCase();
        callback(null, `${uniqueSuffix}${ext}`);
      },
    });

  validateImageFile(file: Express.Multer.File): void {
    const ext = extname(file.originalname).toLowerCase();
    if (!this.validImageExtensions.includes(ext)) {
      throw new BadRequestException('Invalid image file format');
    }
  }

  validateVideoFile(file: Express.Multer.File): void {
    const ext = extname(file.originalname).toLowerCase();
    if (!this.validVideoExtensions.includes(ext)) {
      throw new BadRequestException('Invalid video file format');
    }
  }

  getFileUrl(filename: string, type: 'video' | 'image'): string {
    return `/uploads/${type}/${filename}`;
  }

  async savePoster(
    buffer: Buffer,
    filename: string,
    extension: string,
    type: 'poster' | 'bigPoster' | 'titleImage',
  ): Promise<string> {
    console.log(extension, 'extension');
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

  async saveSubtitle(buffer: Buffer, name: string): Promise<string> {
    const normalizedFilename = normalizeFilename(name);
    const s3Key = `subtitles/${normalizedFilename}.srt`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: 'text/plain',
        }),
      );
    } catch (error) {
      console.error('Error uploading subtitle to S3:', error);
      throw new InternalServerErrorException('Failed to upload subtitle');
    }

    return `/${s3Key}`;
  }

  // async processAndSaveVideo(
  //   buffer: Buffer,
  //   filename: string,
  // ): Promise<string[]> {
  //   // Заменяем пробелы на символы подчеркивания в имени файла
  //   const sanitizedFilename = normalizeFilename(filename);

  //   const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads'); // Путь к директории uploads
  //   const videoPath = path.join(uploadsDir, `${sanitizedFilename}.mp4`);
  //   const hlsDir = path.join(uploadsDir, 'hls', sanitizedFilename);

  //   // Убедитесь, что директория для HLS существует
  //   if (!fs.existsSync(hlsDir)) {
  //     fs.mkdirSync(hlsDir, { recursive: true });
  //   }

  //   // Сохраняем видеофайл
  //   fs.writeFileSync(videoPath, buffer);

  //   const resolutions = [
  //     { resolution: '1080', bitrate: '3000k' },
  //     { resolution: '720', bitrate: '1500k' },
  //     { resolution: '480', bitrate: '800k' },
  //   ];

  //   const m3u8Paths: string[] = [];

  //   for (const { resolution, bitrate } of resolutions) {
  //     const m3u8Path = path.join(hlsDir, `${resolution}p`, 'index.m3u8');
  //     const outputDir = path.join(hlsDir, `${resolution}p`);

  //     // Убедитесь, что директория для конкретного качества существует
  //     if (!fs.existsSync(outputDir)) {
  //       fs.mkdirSync(outputDir, { recursive: true });
  //     }

  //     // Команда ffmpeg с кавычками для путей
  //     const command = `ffmpeg -i "${videoPath}" -b:v ${bitrate} -hls_time 20 -hls_list_size 0 -f hls "${m3u8Path}"`;

  //     try {
  //       await execAsync(command);
  //       m3u8Paths.push(
  //         `/uploads/hls/${sanitizedFilename}/${resolution}p/index.m3u8`,
  //       );
  //     } catch (error) {
  //       console.error('Error processing video:', error);
  //       throw new InternalServerErrorException('Failed to process video');
  //     }
  //   }

  //   return m3u8Paths; // Возвращаем массив путей к m3u8
  // }

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
}
