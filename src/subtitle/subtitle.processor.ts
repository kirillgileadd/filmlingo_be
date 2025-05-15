import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Phrase } from '../phrases/phrase.model';
import { SubtitlePhrases } from './subtitle-phrases.model';
import { Subtitle } from './subtitle.model';
import { Transaction } from 'sequelize';
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
  constructor(
    @InjectModel(Phrase) private phraseModel: typeof Phrase,
    @InjectModel(SubtitlePhrases)
    private subtitlePhrasesModel: typeof SubtitlePhrases,
  ) {}

  async extractPhrasesFromSubtitles(
    subtitles: Subtitle[],
    transaction?: Transaction,
  ): Promise<void> {
    const chunkSize = 120;
    const chunks = this.chunkSubtitles(subtitles, chunkSize);

    for (const chunk of chunks) {
      const gptResponse = await this.analyzeChunk(chunk);
      await this.saveResults(chunk, gptResponse, transaction);
    }
  }

  private chunkSubtitles(subtitles: Subtitle[], size: number): Subtitle[][] {
    const chunks: Subtitle[][] = [];
    for (let i = 0; i < subtitles.length; i += size) {
      chunks.push(subtitles.slice(i, i + size));
    }
    return chunks;
  }

  private async analyzeChunk(chunk: Subtitle[]): Promise<any[]> {
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

      const content = response.data.choices?.[0]?.message?.content;
      // const content = JSON.stringify([
      //   {
      //     text: 'She told me I had a purpose.',
      //     phrasal_verbs: [
      //       { phrase: 'pick up', translate: 'подобрать, забрать' },
      //     ],
      //     idioms: [{ phrase: 'hit the sack', translate: 'завалиться спать' }],
      //   },
      // ]);

      return JSON.parse(content || '[]');
    } catch (err) {
      console.error('ProxyAPI GPT request failed:', err);
      return [];
    }
  }

  private async saveResults(
    originalChunk: Subtitle[],
    gptResults: any[],
    transaction?: Transaction,
  ): Promise<void> {
    const resultMap = new Map<
      string,
      { phrasal_verbs: any[]; idioms: any[] }
    >();

    for (const entry of gptResults) {
      resultMap.set(entry.text, {
        phrasal_verbs: entry.phrasal_verbs || [],
        idioms: entry.idioms || [],
      });
    }

    for (const sub of originalChunk) {
      const result = resultMap.get(sub.text);
      if (!result) continue;

      const allPhrases = [
        ...result.phrasal_verbs.map((p) => ({
          original: p.phrase,
          translation: p.translate,
          type: 'phrasal_verb',
        })),
        ...result.idioms.map((p) => ({
          original: p.phrase,
          translation: p.translate,
          type: 'idiom',
        })),
      ];

      for (const phraseData of allPhrases) {
        let phrase = await this.phraseModel.findOne({
          where: { original: phraseData.original },
        });

        if (!phrase) {
          phrase = await this.phraseModel.create(
            phraseData as {
              original: string;
              translation: string;
              type: 'idiom' | 'phrasal_verb';
            },
          );
        }

        await this.subtitlePhrasesModel.findOrCreate({
          where: { subtitleId: Number(sub.id), phraseId: phrase.id },
          transaction,
        });
      }
    }
  }

  private buildPrompt(chunk: Subtitle[]): string {
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
