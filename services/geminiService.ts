import { GoogleGenAI } from "@google/genai";
import { Dataset, AIAnalysis } from '../types';

export const generateInsights = async (dataset: Dataset): Promise<AIAnalysis> => {
    // FIX: Safely access process.env to avoid "process is not defined" error in Vercel client-side
    let apiKey = '';
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            apiKey = process.env.API_KEY;
        } else if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
             // Fallback for Vite environments if configured that way
             apiKey = (import.meta as any).env.VITE_API_KEY;
        }
    } catch (e) {
        console.warn("Could not access environment variables safely.");
    }
    
    if (!apiKey) {
        console.warn("No API_KEY found. Returning mock insights.");
        return {
            trends: ["Please configure your Gemini API Key to see real trends."],
            anomalies: ["API key missing."],
            opportunities: ["Add API key to .env"],
            recommendations: ["Check metadata.json for setup instructions."]
        };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Create a summarized version of the dataset to avoid token limits
    // We send column profiles and a sample of rows
    const summary = {
        totalRows: dataset.totalRows,
        columns: dataset.columns.map(c => ({
            name: c.name,
            type: c.type,
            min: c.min,
            max: c.max,
            avg: c.avg,
            nullCount: c.nullCount
        })),
        sampleData: dataset.rows.slice(0, 10)
    };

    const prompt = `
    You are a Senior Data Analyst. Analyze the following dataset summary (JSON).
    
    Dataset Summary:
    ${JSON.stringify(summary, null, 2)}
    
    Provide a structured analysis with the following 4 sections. 
    Be specific, professional, and strategic.
    
    1. Trends Identified (3 bullet points)
    2. Anomalies / Outliers (2 bullet points)
    3. Opportunities for Improvement (2 bullet points)
    4. Strategic Recommendations (2 bullet points)

    Return the response as a valid JSON object with keys: "trends", "anomalies", "opportunities", "recommendations". Each value should be an array of strings.
    Do not use Markdown formatting in the response, just raw JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        
        const jsonResponse = JSON.parse(text);
        return {
            trends: jsonResponse.trends || [],
            anomalies: jsonResponse.anomalies || [],
            opportunities: jsonResponse.opportunities || [],
            recommendations: jsonResponse.recommendations || []
        };

    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        return {
            trends: ["Analysis failed."],
            anomalies: ["Could not process data."],
            opportunities: [],
            recommendations: ["Try again later."]
        };
    }
};