import { GoogleGenAI, Type } from '@google/genai';
import { AiInsightsResult, DataRow, DatasetStats } from '../types';
import { formatCell } from './format';

const apiKey = process.env.API_KEY;

export const isAiConfigured = Boolean(apiKey);

const insightsSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: 'A high-level overview of what the dataset contains.' },
    keyTakeaways: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3-5 critical insights discovered in the data.',
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          type: { type: Type.STRING },
          insight: { type: Type.STRING },
        },
        required: ['source', 'target', 'type', 'insight'],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2-4 recommended next steps for analysis or data cleaning.',
    },
  },
  required: ['summary', 'keyTakeaways', 'relationships', 'recommendations'],
};

export async function generateInsights(rows: DataRow[], stats: DatasetStats): Promise<AiInsightsResult> {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const ai = new GoogleGenAI({ apiKey });

  const columnSummary = stats.columns.map((c) => ({
    name: c.name,
    type: c.type,
    missingPercent: Number(c.missingPercent.toFixed(1)),
    unique: c.unique,
    ...(c.numeric && {
      mean: c.numeric.mean,
      median: c.numeric.median,
      std: c.numeric.std,
      min: c.numeric.min,
      max: c.numeric.max,
      outliers: c.numeric.outliers,
    }),
    ...(c.topValues.length && c.type !== 'numeric' && { topValues: c.topValues.slice(0, 5) }),
  }));

  const sample = rows.slice(0, 30).map((row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, formatCell(v)])),
  );

  const prompt = `
    Analyze this dataset from a spreadsheet.
    Rows: ${stats.rowCount}, Columns: ${stats.colCount}, Completeness: ${stats.completeness.toFixed(1)}%, Duplicate rows: ${stats.duplicateRows}
    Column statistics: ${JSON.stringify(columnSummary)}
    Strongest correlations: ${JSON.stringify(stats.correlations.topPairs.slice(0, 5))}
    Data sample (first 30 rows): ${JSON.stringify(sample)}

    Explain what the data represents, highlight trends and relationships, and suggest next steps.
    The response must strictly follow the JSON schema provided.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: insightsSchema,
    },
  });

  return JSON.parse(response.text ?? '{}') as AiInsightsResult;
}
