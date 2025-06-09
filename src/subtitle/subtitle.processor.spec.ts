jest.mock('../uitils/gptLogger.ts', () => ({
  logGPT: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { SubtitleProcessor } from './subtitle.processor';
import { Phrase } from '../phrases/phrase.model';
import { getModelToken } from '@nestjs/sequelize';
import { SubtitlePhrases } from './subtitle-phrases.model';
import { Subtitle } from './subtitle.model';

const mockPhraseModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockSubtitlePhrasesModel = {
  findOrCreate: jest.fn(),
};

const mockSubtitleRepository = {
  findSomething: jest.fn(),
};

describe('SubtitleProcessor', () => {
  let processor: SubtitleProcessor;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SubtitleProcessor,
        {
          provide: getModelToken(Phrase),
          useValue: mockPhraseModel,
        },
        {
          provide: getModelToken(SubtitlePhrases),
          useValue: mockSubtitlePhrasesModel,
        },
        {
          provide: getModelToken(Subtitle),
          useValue: mockSubtitleRepository,
        },
      ],
    }).compile();

    processor = module.get<SubtitleProcessor>(SubtitleProcessor);
  });

  // it('should create prompt correctly', () => {
  //   const subtitleMocks: Subtitle[] = [
  //     { text: 'Hello world!' } as Subtitle,
  //     { text: 'Quote: "test"' } as Subtitle,
  //     { text: 'Newline\nand backslash \\' } as Subtitle,
  //     { text: 'Special chars: \u0001\u0002' } as Subtitle,
  //   ];
  //
  //   const prompt = processor.buildPrompt(subtitleMocks);
  //
  //   expect(prompt).toContain('"text": "Hello world!"');
  //   // expect(prompt).toContain('"Quote: \\"test\\""'); // кавычки внутри строки экранированы
  //   expect(prompt).toContain('\\n'); // новая строка экранирована
  //   expect(prompt).not.toContain('\u0001'); // спецсимволы должны быть удалены
  // });

  it('should validate correct SubtitleChunkDto with nested phrasal_verbs', async () => {
    const data = [
      {
        text: "Look, you'll break it, and\nit'll be fucked, won't it?",
        translate:
          'Послушай, ты его сломаешь, и оно будет испорчено, не так ли?',
        phrasal_verbs: [
          {
            phrase: 'break it',
            translate: 'сломать это',
          },
        ],
        idioms: [],
        ai_translate: 'ai_translate',
        ai_translate_comment: 'ai_translate_comment',
      },
    ];

    const validated = await processor.validateSubtitleChunks(data);

    expect(validated).toHaveLength(1);
    expect(validated[0].phrasal_verbs[0].phrase).toBe('break it');
    expect(validated[0].phrasal_verbs[0].translate).toBe('сломать это');
    expect(validated[0].ai_translate).toBe('ai_translate');
    expect(validated[0].translate).toBe(
      'Послушай, ты его сломаешь, и оно будет испорчено, не так ли?',
    );
    expect(validated[0].ai_translate_comment).toBe('ai_translate_comment');
  });

  it('should validate correct SubtitleChunkDto with nested phrasal_verbs null data', async () => {
    const data = [
      {
        text: "Look, you'll break it, and\nit'll be fucked, won't it?",
        translate: null,
        phrasal_verbs: [
          {
            phrase: 'break it',
            translate: 'сломать это',
          },
        ],
        idioms: [],
        ai_translate: null,
        ai_translate_comment: null,
      },
    ];

    const validated = await processor.validateSubtitleChunks(data);

    expect(validated).toHaveLength(1);
    expect(validated[0].phrasal_verbs[0].phrase).toBe('break it');
    expect(validated[0].phrasal_verbs[0].translate).toBe('сломать это');
    expect(validated[0].phrasal_verbs[0].translate).toBe('сломать это');
    expect(validated[0].ai_translate).toBe(null);
    expect(validated[0].translate).toBe(null);
    expect(validated[0].ai_translate_comment).toBe(null);
  });

  it('extractJsonFromResponse', async () => {
    const data =
      '```json\n[\n    {\n        "text": "Can you live with that?",\n        "translate": "Смирись с этим.",\n        "ai_translate": "Ты сможешь с этим смириться?",\n        "phrasal_verbs": [],\n        "idioms": [],\n        "ai_translate_comment": null\n    }\n]\\n```';

    const result = [
      {
        text: 'Can you live with that?',
        translate: 'Смирись с этим.',
        ai_translate: 'Ты сможешь с этим смириться?',
        phrasal_verbs: [],
        idioms: [],
        ai_translate_comment: null,
      },
    ];

    const parsedJSON = processor.extractJsonFromResponse(data);

    expect(parsedJSON).toEqual(result);
  });
});
