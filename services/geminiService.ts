
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DataRow } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A high-level overview of what the dataset contains." },
    keyTakeaways: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of 3-5 critical insights discovered in the data." 
    },
    charts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "bar, line, scatter, area, or pie" },
          title: { type: Type.STRING },
          xAxis: { type: Type.STRING, description: "Key from the data to use as X axis" },
          yAxis: { type: Type.STRING, description: "Key from the data to use as Y axis" },
          description: { type: Type.STRING }
        },
        required: ["type", "title", "xAxis", "yAxis", "description"]
      }
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          type: { type: Type.STRING },
          strength: { type: Type.NUMBER, description: "Correlation strength 0 to 1" },
          insight: { type: Type.STRING }
        },
        required: ["source", "target", "type", "strength", "insight"]
      }
    },
    statistics: {
      type: Type.OBJECT,
      properties: {
        rowCount: { type: Type.NUMBER },
        colCount: { type: Type.NUMBER },
        columnDetails: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              missingValues: { type: Type.NUMBER }
            }
          }
        }
      }
    }
  },
  required: ["summary", "keyTakeaways", "charts", "relationships", "statistics"]
};

export const analyzeData = async (data: DataRow[]): Promise<AnalysisResult> => {
  // We send a sample of the data to keep the prompt size manageable
  const sampleSize = 50;
  const sampleData = data.slice(0, sampleSize);
  const headers = Object.keys(data[0] || {});

  const prompt = `
    Analyze this dataset from an Excel file.
    Headers: ${headers.join(", ")}
    Total Row Count: ${data.length}
    Data Sample (First ${sampleSize} rows): ${JSON.stringify(sampleData)}

    Provide a deep analysis of relationships between variables, identify trends, and suggest the best visualizations to represent this data.
    The response must strictly follow the JSON schema provided.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    }
  });

  return JSON.parse(response.text);
};
