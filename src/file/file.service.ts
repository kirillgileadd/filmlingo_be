import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { normalizeFilename } from 'src/uitils/normalizeFilename';

const execAsync = promisify(exec);

@Injectable()
export class FileService {
  private validImageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
  private validVideoExtensions = ['.mp4', '.mkv', '.avi'];

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
    type: 'poster' | 'bigPoster' | 'titleImage',
  ): Promise<string> {
    console.log(filename, 'filename');
    // Получаем расширение файла из имени
    const extension = path.extname(filename).toLowerCase();
    console.log(extension);
    // Проверяем поддерживаемые форматы
    const supportedFormats = ['.jpg', '.jpeg', '.webp', '.webm', '.png'];
    if (!supportedFormats.includes(extension)) {
      throw new Error(
        'Unsupported image format. Only jpg, webp, and png are allowed.',
      );
    }

    // Нормализуем имя файла
    const normalizedFilename = normalizeFilename(filename);

    // Путь к директории для постеров
    const postersDir = path.join(__dirname, '..', '..', 'uploads', 'posters');

    // Убедимся, что директория для постеров существует
    if (!fs.existsSync(postersDir)) {
      fs.mkdirSync(postersDir, { recursive: true });
    }

    // Путь к сохраняемому постеру
    const posterPath = path.join(
      postersDir,
      `${normalizedFilename}-${type}${extension}`, // Используем расширение из имени файла
    );

    // Сохраняем постер
    fs.writeFileSync(posterPath, buffer);

    // Возвращаем путь для доступа к постеру через HTTP
    return `/uploads/posters/${normalizedFilename}-${type}${extension}`;
  }

  saveSubtitle(buffer: Buffer, name: string): string {
    const normalizedFilename = normalizeFilename(name);

    const subtitlesDir = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'subtitles',
    );

    // Убедимся, что директория для субтитров существует
    if (!fs.existsSync(subtitlesDir)) {
      fs.mkdirSync(subtitlesDir, { recursive: true });
    }

    const subtitlePath = path.join(subtitlesDir, normalizedFilename, '.srt'); // Имя файла оригинальное

    // Сохраняем файл субтитров
    fs.writeFileSync(subtitlePath, buffer); // Предполагаем, что file.buffer содержит содержимое файла

    return `/uploads/subtitles/${normalizedFilename}.srt`; // Возвращаем путь к субтитрам
  }

  async processAndSaveVideo(
    buffer: Buffer,
    filename: string,
  ): Promise<string[]> {
    // Заменяем пробелы на символы подчеркивания в имени файла
    const sanitizedFilename = normalizeFilename(filename);

    const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads'); // Путь к директории uploads
    const videoPath = path.join(uploadsDir, `${sanitizedFilename}.mp4`);
    const hlsDir = path.join(uploadsDir, 'hls', sanitizedFilename);

    // Убедитесь, что директория для HLS существует
    if (!fs.existsSync(hlsDir)) {
      fs.mkdirSync(hlsDir, { recursive: true });
    }

    // Сохраняем видеофайл
    fs.writeFileSync(videoPath, buffer);

    const resolutions = [
      { resolution: '1080', bitrate: '3000k' },
      { resolution: '720', bitrate: '1500k' },
      { resolution: '480', bitrate: '800k' },
    ];

    const m3u8Paths: string[] = [];

    for (const { resolution, bitrate } of resolutions) {
      const m3u8Path = path.join(hlsDir, `${resolution}p`, 'index.m3u8');
      const outputDir = path.join(hlsDir, `${resolution}p`);

      // Убедитесь, что директория для конкретного качества существует
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Команда ffmpeg с кавычками для путей
      const command = `ffmpeg -i "${videoPath}" -b:v ${bitrate} -hls_time 10 -hls_list_size 0 -f hls "${m3u8Path}"`;

      try {
        await execAsync(command);
        m3u8Paths.push(
          `/uploads/hls/${sanitizedFilename}/${resolution}p/index.m3u8`,
        );
      } catch (error) {
        console.error('Error processing video:', error);
        throw new InternalServerErrorException('Failed to process video');
      }
    }

    return m3u8Paths; // Возвращаем массив путей к m3u8
  }
}
