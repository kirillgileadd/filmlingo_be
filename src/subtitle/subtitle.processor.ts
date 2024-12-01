import { Injectable } from '@nestjs/common';

export interface SubtitleEntry {
  id: string;
  startTime: string;
  startSeconds: number;
  endTime: string;
  endSeconds: number;
  text: string;
}

@Injectable()
export class SubtitleProcessor {
  async onModuleInit() {
    const p = await this.extractPhrases('looking for');
    console.log(p, 'phrases');
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
   * Выделяет фразы из текста с помощью compromise.
   * @param text - Текст субтитра
   * @returns Массив фраз, найденных в тексте
   */
  private async extractPhrases(text: string): Promise<string[]> {
    const { default: nlp } = await import('compromise');
    const doc = nlp(text); // Обрабатываем текст с помощью compromise
    const phrases = doc.match('#Verb+ #Preposition+').out('array');

    return phrases;
  }

  /**
   * Выделяет фразы из текста субтитров.
   * @param subtitles - Массив субтитров
   * @returns Массив субтитров с выделенными фразами
   */
  highlightPhrases(
    subtitles: SubtitleEntry[],
    phrases: string[],
  ): SubtitleEntry[] {
    return subtitles.map((sub) => ({
      ...sub,
      text: this.applyHighlighting(sub.text, phrases),
    }));
  }

  /**
   * Помечает фразы в тексте.
   * @param text - Текст субтитра
   * @param phrases - Массив фраз для выделения
   * @returns Текст с выделенными фразами
   */
  private applyHighlighting(text: string, phrases: string[]): string {
    let highlightedText = text;
    for (const phrase of phrases) {
      const regex = new RegExp(`(${this.escapeRegex(phrase)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<b>$1</b>'); // Используем <b> для выделения
    }
    return highlightedText;
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
