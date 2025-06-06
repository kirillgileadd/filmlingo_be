import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve(__dirname, '../../logs/gpt.log');

export function logGPT({
  prompt,
  response,
  error,
  meta,
}: {
  prompt?: string;
  response?: any;
  error?: unknown;
  meta?: Record<string, any>;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    prompt,
    response,
    error: error instanceof Error ? error.message : error,
    meta,
  };

  console.log('Logging GPT data...');
  const line = JSON.stringify(logEntry) + '\n';
  console.log(line, 'line');
  console.log(logFilePath, 'logFilePath');
  try {
    fs.appendFileSync(logFilePath, line, 'utf8');
  } catch (err) {
    console.error('Ошибка записи в gpt.log:', err);
  }
}
