import { Injectable } from '@nestjs/common';
import { phraseDictionary } from './phraseDictionary';

import axios from 'axios';

export interface SubtitleEntry {
  id: string;
  startTime: string;
  startSeconds: number;
  endTime: string;
  endSeconds: number;
  text: string;
  phrases: { original: string; translate: string; type: string }[] | null;
}

@Injectable()
export class SubtitleProcessor {
  private phraseDictionary: Record<string, string> = phraseDictionary;

  async extractPhrasesFromSubtitles(
    subtitles: SubtitleEntry[],
  ): Promise<SubtitleEntry[]> {
    const chunkSize = 120;
    const chunks = this.chunkSubtitles(subtitles, chunkSize);
    const results: SubtitleEntry[] = [];

    for (const chunk of chunks) {
      const gptResponse = await this.analyzeChunk(chunk);
      const updated = this.applyResults(chunk, gptResponse);
      results.push(...updated);
    }

    return results;
  }

  private chunkSubtitles(
    subtitles: SubtitleEntry[],
    size: number,
  ): SubtitleEntry[][] {
    const chunks: SubtitleEntry[][] = [];
    for (let i = 0; i < subtitles.length; i += size) {
      chunks.push(subtitles.slice(i, i + size));
    }
    return chunks;
  }

  private async analyzeChunk(chunk: SubtitleEntry[]): Promise<any[]> {
    const prompt = this.buildPrompt(chunk);

    try {
      const response = await axios.post(
        'https://api.proxyapi.ru/openai/v1/chat/completions',
        {
          model: 'gpt-4.1-nano-2025-04-14',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PROXY_API_KEY}`,
          },
        },
      );

      console.log(response, 'res_analyze_chunk');

      const content = response.data.choices?.[0]?.message?.content;
      return JSON.parse(content || '[]');
    } catch (err) {
      console.error('ProxyAPI GPT request failed:', err);
      return [];
    }
  }

  private applyResults(
    originalChunk: SubtitleEntry[],
    gptResults: any[],
  ): SubtitleEntry[] {
    const resultMap = new Map<
      string,
      {
        phrasal_verbs: { phrase: string; translate: string }[];
        idioms: { phrase: string; translate: string }[];
      }
    >();
    for (const entry of gptResults) {
      resultMap.set(entry.text, {
        phrasal_verbs: entry.phrasal_verbs || [],
        idioms: entry.idioms || [],
      });
    }

    return originalChunk.map((sub) => {
      const result = resultMap.get(sub.text);
      if (!result) return { ...sub, phrases: [] };

      const phrases = [
        ...result.phrasal_verbs.map((pv) => ({
          original: pv.phrase,
          type: 'phrasal_verb',
          translate: pv.translate,
        })),
        ...result.idioms.map((id) => ({
          original: id.phrase,
          type: 'idiom',
          translate: id.translate,
        })),
      ];

      return { ...sub, phrases };
    });
  }

  private buildPrompt(chunk: SubtitleEntry[]): string {
    const subtitleTexts = chunk
      .map((s) => `  { "text": "${s.text.replace(/"/g, '\\"')}" }`)
      .join(',\n');

    return `Ты — эксперт по английскому языку и русскому переводу. Вот массив субтитров фильма. Для каждого текста:
1. Найди фразовые глаголы (например: "pick up", "let down", "run into").
2. Найди идиомы или устойчивые выражения (например: "a piece of cake", "hit the sack").
3. Для каждого найденного выражения укажи перевод на русский.
4. Верни строго валидный JSON-массив вида:
[
  {
    "text": "...",
    "phrasal_verbs": [
      { "phrase": "pick up", "translate": "подобрать, забрать" }
    ],
    "idioms": [
      { "phrase": "hit the sack", "translate": "завалиться спать" }
    ]
  }
]
Если в субтитре ничего не найдено — возвращай пустые массивы.

Вот субтитры:
[
${subtitleTexts}
]`;
  }

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
    return parser.fromSrt(content) as SubtitleEntry[];
  }
}
