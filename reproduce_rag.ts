
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBeKtevkFP4M1tnJG2qur1iqFFUPczlYVQ';
const ai = new GoogleGenAI({ apiKey });
const storeId = 'fileSearchStores/ciellkhoon-vs6goad9n6yq';
const modelName = 'gemini-3-flash-preview'; // User's actual model

async function testRag() {
    console.log(`Testing RAG with model: ${modelName} and store: ${storeId}`);

    try {
        console.log('Sending request...');
        // Exactly matching documentation example format:
        // contents is a simple string, not array
        // tools in config
        const response = await ai.models.generateContent({
            model: modelName,
            contents: "이 앱의 관리자 페이지 비밀번호는 뭐야? 문서에서 찾아줘.",
            config: {
                tools: [
                    {
                        fileSearch: {
                            fileSearchStoreNames: [storeId]
                        }
                    }
                ]
            }
        });

        console.log('Response text:', response.text);
        console.log('Candidates:', JSON.stringify(response.candidates, null, 2));
        console.log('Grounding Metadata:', JSON.stringify(response.candidates?.[0]?.groundingMetadata, null, 2));

    } catch (error: any) {
        console.error('Error Message:', error.message);
        console.error('Error Status:', error.status);
        console.error('Full Error:', error);
    }
}

testRag();
