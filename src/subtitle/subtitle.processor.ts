import { Injectable } from '@nestjs/common';
import { phraseDictionary } from './phraseDictionary';

export interface SubtitleEntry {
  id: string;
  startTime: string;
  startSeconds: number;
  endTime: string;
  endSeconds: number;
  text: string;
  phrases: { original: string; translate: string }[] | null;
}

@Injectable()
export class SubtitleProcessor {
  private phraseDictionary: Record<string, string> = phraseDictionary;

  public extractPhrases(
    text: string,
  ): { original: string; translate: string }[] {
    const foundPhrases: { original: string; translate: string }[] = [];

    for (const phrase in this.phraseDictionary) {
      if (text.includes(phrase)) {
        foundPhrases.push({
          original: phrase,
          translate: this.phraseDictionary[phrase],
        });
      }
    }

    return foundPhrases;
  }

  /**
   * Парсит буфер субтитров в массив объектов.
   * @param buffer - Буфер файла субтитров
   * @returns Массив объектов субтитров
   */
  async parse(buffer: Buffer): Promise<SubtitleEntry[]> {
    const { default: SrtParser2 } = await import('srt-parser-2');
    const parser = new SrtParser2();
    const content = buffer.toString('utf-8');
    const subtitles = parser.fromSrt(content) as SubtitleEntry[];

    return subtitles.map((sub) => ({
      ...sub,
      phrases: this.extractPhrases(sub.text), // Выделяем фразы
    }));
  }

  /**
   * Экранирует специальные символы для RegExp.
   * @param phrase - Фраза для экранирования
   * @returns Экранированная строка
   */
  private escapeRegex(phrase: string): string {
    return phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Фильтрует субтитры по ключевым словам.
   * @param subtitles - Массив субтитров
   * @param keyword - Ключевое слово для фильтрации
   * @returns Массив субтитров, содержащих ключевое слово
   */
  filterByKeyword(
    subtitles: SubtitleEntry[],
    keyword: string,
  ): SubtitleEntry[] {
    return subtitles.filter((sub) =>
      sub.text.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  /**
   * Преобразует массив субтитров обратно в текстовый формат .srt.
   * @param subtitles - Массив объектов субтитров
   * @returns Текст в формате .srt
   */
  toSrtFormat(subtitles: SubtitleEntry[]): string {
    return subtitles
      .map(
        (sub, index) =>
          `${index + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}\n`,
      )
      .join('\n');
  }
}
