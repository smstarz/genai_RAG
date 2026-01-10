require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

async function test() {
    const storeId = 'fileSearchStores/e3qqllg8tyz0-jju5zbo2m4pg';
    const question = 'What vehicles are used for Dongjak-gu DRT?';
    const contents = [{ role: 'user', parts: [{ text: question }] }];
    const tools = [{ fileSearch: { fileSearchStoreNames: [storeId] } }];
    const prompt = 'Answer based on documents.';

    console.log('Testing gemini-2.5-flash-lite (standalone script)...');
    let liteSuccess = 0;
    for (let i = 1; i <= 3; i++) {
        const r = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents,
            config: { systemInstruction: prompt, tools }
        });
        const has = !!r.candidates?.[0]?.groundingMetadata;
        console.log(`  lite run ${i}: ${has ? 'GROUNDING' : 'NO'}`);
        if (has) liteSuccess++;
    }

    console.log('Testing gemini-2.5-flash (standalone script)...');
    let flashSuccess = 0;
    for (let i = 1; i <= 3; i++) {
        const r = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: { systemInstruction: prompt, tools }
        });
        const has = !!r.candidates?.[0]?.groundingMetadata;
        console.log(`  flash run ${i}: ${has ? 'GROUNDING' : 'NO'}`);
        if (has) flashSuccess++;
    }

    console.log(`\nSummary: lite=${liteSuccess}/3, flash=${flashSuccess}/3`);
}
test();
