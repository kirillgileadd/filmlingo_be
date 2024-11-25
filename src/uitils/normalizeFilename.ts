import * as path from 'path';
import * as uuid from 'uuid';
export function normalizeFilename(filename: string): string {
  console.log(filename);
  // Удаляем расширение .mp4, если оно присутствует
  const extension = path.extname(filename);
  const baseName = path.basename(filename, extension);

  // Заменяем неподходящие символы на нижнее подчеркивание
  const normalizedBaseName =
    baseName.replace(/[^a-zA-Z0-9_\-]/g, '_') + uuid.v4();

  // Возвращаем нормализованное имя с расширением
  return normalizedBaseName;
}
