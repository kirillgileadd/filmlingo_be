import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Phrase } from '../phrases/phrase.model';
import { SubtitlePhrases } from './subtitle-phrases.model';
import { Subtitle } from './subtitle.model';
import { Transaction } from 'sequelize';
import axios from 'axios';
import { logGPT } from '../uitils/gptLogger';
import { SubtitleChunkDto } from './dto/subtitle-chunk.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

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
    @InjectModel(Subtitle) private subtitleModel: typeof Subtitle,
    @InjectModel(SubtitlePhrases)
    private subtitlePhrasesModel: typeof SubtitlePhrases,
  ) {}

  async extractPhrasesFromSubtitles(
    subtitles: Subtitle[],
    transaction?: Transaction,
  ): Promise<void> {
    const chunkSize = 60;
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

    const fallBack: SubtitleChunkDto[] = chunk.map((s) => ({
      text: s.text,
      translate: null,
      phrasal_verbs: [],
      idioms: [],
      ai_translate_comment: null,
      ai_translate: null,
    }));

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      try {
        const response = await axios.post(
          'https://api.proxyapi.ru/openai/v1/chat/completions',
          {
            model: 'gpt-4o-mini-2024-07-18',
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
        if (process.env.NODE_ENV === 'development') {
          logGPT({ prompt, response: response.data });
        }
        const content = response.data.choices?.[0]?.message?.content;

        const rawData = this.extractJsonFromResponse(content || '[]');
        if (rawData) {
          const validated = await this.validateSubtitleChunks(rawData);
          return validated;
        }
        return rawData;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logGPT({ prompt, error });
        }
        console.error('ProxyAPI GPT request failed:', error);
      }
    }
    return fallBack;
  }

  private async saveResults(
    originalChunk: Subtitle[],
    gptResults: SubtitleChunkDto[],
    transaction?: Transaction,
  ): Promise<void> {
    const resultMap = new Map<string, SubtitleChunkDto>();

    for (const entry of gptResults) {
      resultMap.set(entry.text.trim(), {
        phrasal_verbs: entry.phrasal_verbs || [],
        idioms: entry.idioms || [],
        translate: entry.translate ?? null,
        text: entry.text,
        ai_translate_comment: entry.ai_translate_comment ?? null,
        ai_translate: entry.ai_translate ?? null,
      });
    }

    for (const sub of originalChunk) {
      const result = resultMap.get(sub.text.trim());
      if (!result) continue;

      await this.subtitleModel.update(
        {
          ai_translate: result.ai_translate,
          ai_translate_comment: result.ai_translate_comment,
        },
        { where: { id: Number(sub.id) }, transaction },
      );

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
        const phrase = await this.phraseModel.create(
          phraseData as {
            original: string;
            translation: string;
            type: 'idiom' | 'phrasal_verb';
          },
        );

        await this.subtitlePhrasesModel.findOrCreate({
          where: { subtitleId: Number(sub.id), phraseId: phrase.id },
          transaction,
        });
      }
    }
  }

  buildPrompt(chunk: Subtitle[]): string {
    const chunkDate = Date.now();

    const subtitleTexts = chunk.map((s) => ({
      text: s.text,
      translate: s.translate,
    }));

    return `Дата загрузки чанка ${chunkDate} Ты — опытный лингвист и переводчик с английского на русский. Твоя задача — анализировать массив субтитров фильма и возвращать **СТРОГО ВАЛИДНЫЙ JSON** с переводом, выражениями и пояснениями.
  В ответе возвращай просто JSON без комментариев и других вольностей чтобы я могу выполнить JSON.parse(Твой ответ) без ошибок 
  
  Для каждого субтитра:

  - Переведи субтитр художественно с учётом контекста (включая предыдущие строки).
- Ты также получаешь человеческий художественный перевод в поле translate — **если он есть**, можешь на него ориентироваться, адаптировать или улучшать, но обязательно сделай собственную версию в поле ai_translate.
- Найди фразовые глаголы и идиомы (в том числе разговорные, видоизменённые или разорванные).
- Сохрани точную форму выражения, как в оригинале — **НЕ** переводя в инфинитив.
- Если перевод субтитра содержит культурный контекст, сленг, который поймет только носитель английского языка, объясни его и положи объяснение в поле ai_translate_comment (1–2 предложения).
- Если пояснение не требуется, установи ai_translate_comment в null.

🔴 Важно:
  - **СТРОГО соблюдай структуру JSON.**
- В массивах phrasal_verbs и idioms каждый элемент должен быть объектом с двумя ключами: "phrase" и "translate".
  ❌ Нельзя возвращать массив строк типа ["see value"] — это **невалидный формат**.

✅ Выходной JSON должен быть массивом объектов следующего вида:

  [
    {
      "text": "оригинальный субтитр",
      "translate": "перевод из субтитров или null, если нет",
      "ai_translate": "твой художественный перевод",
      "phrasal_verbs": [
        { "phrase": "фразовый глагол", "translate": "перевод" }
      ],
      "idioms": [
        { "phrase": "идиома", "translate": "перевод" }
      ],
      "ai_translate_comment": "объяснение сложного места или null"
    }
  ]

📘 Примеры выражений, которые нужно искать:

  **Фразовые глаголы:**
- "pick up" → "подобрать, забрать"
- "run into" → "неожиданно встретить"
- "get over it" → "пережить, справиться с чем-то"
- "give up" → "сдаваться"
- "break down" → "сломаться (техника или человек)"
- "hold on" → "подожди"
- "carry on" → "продолжать"
- "look it up" → "поискать (в словаре, интернете)"

**Идиомы и устойчивые выражения:**
- "a piece of cake" → "очень легко"
- "hit the sack" → "лечь спать"
- "break a leg" → "ни пуха ни пера"
- "under the weather" → "чувствовать себя плохо"
- "spill the beans" → "выдать секрет"


📙 Пример сложного субтитра и пояснения:

  **Оригинал:**
And certainly not when you got Liberia's deficit in your sky rocket.

**Разбор:**

"ai_translate_comment": "Фраза построена на кокни-слэнге: 'sky rocket' означает 'карман'. 'Liberia's deficit' — гиперболическое выражение."

Вот субтитры:
${JSON.stringify(subtitleTexts)}
`;
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

  async validateSubtitleChunks(data: any[]) {
    const validatedChunks: SubtitleChunkDto[] = [];

    for (const rawItem of data) {
      const instance = plainToInstance(SubtitleChunkDto, rawItem, {
        exposeDefaultValues: true,
        enableImplicitConversion: true,
      });
      const errors = await validate(instance);
      if (errors.length === 0) {
        validatedChunks.push(instance);
      } else {
        console.log(
          'Validation failed, using fallback:',
          JSON.stringify(errors),
        );
        const stub = this.fallbackStub(rawItem?.text || 'UNKNOWN');
        validatedChunks.push(plainToInstance(SubtitleChunkDto, stub));
      }
    }

    return validatedChunks;
  }

  extractJsonFromResponse(text: string) {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const json = text.slice(start, end + 1);
      try {
        return JSON.parse(json);
      } catch (err) {
        console.error('JSON parse error:', err);
      }
    }
    throw new Error('Response did not contain valid JSON array');
  }

  fallbackStub = (text: string) => ({
    text,
    translate: null,
    phrasal_verbs: [],
    idioms: [],
    ai_translate_comment: null,
    ai_translate: null,
  });
}
