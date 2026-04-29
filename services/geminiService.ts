import { AIResponse, TransactionType } from "../types";

export const parseFinancialInput = async (userInput: string, validCategories: string[]): Promise<AIResponse> => {
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || 'gemini-3.1-flash-lite-preview';

  const categoriesList = validCategories.join(", ");
  const systemInstruction = `Anda adalah asisten keuangan pintar. Tugas Anda adalah mengekstrak detail transaksi dari input pengguna dalam Bahasa Indonesia.
      
      Aturan Ekstraksi:
      1. Nilai Angka: "30rb" -> 30000, "2jt" -> 2000000.
      2. Tipe: "pemasukan" (income) atau "pengeluaran" (expense).
      3. Kategori: Pilih satu dari daftar berikut: ${categoriesList}. Jika tidak ada yang cocok, gunakan "Lainnya".
      4. Dompet: Ekstrak nama dompet jika disebutkan (contoh: "dompet jajan", "rekening", "cash"). Jika TIDAK disebutkan, gunakan "Utama".
      5. Deskripsi: Buat deskripsi singkat.
      
      Hasilkan output dalam format JSON.`;

  const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userInput }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              amount: {
                type: "NUMBER",
                description: "Nilai angka transaksi",
              },
              type: {
                type: "STRING",
                description: "'income' atau 'expense'",
              },
              category: {
                type: "STRING",
                description: "Kategori transaksi",
              },
              wallet: {
                type: "STRING",
                description: "Nama dompet yang digunakan",
              },
              description: {
                type: "STRING",
                description: "Deskripsi singkat",
              },
            },
            required: ["amount", "type", "category", "wallet", "description"],
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Vertex API Error:", errorData);
      if (response.status === 400 || response.status === 403 || errorData.toLowerCase().includes('api key')) {
        throw new Error('INVALID_API_KEY');
      }
      throw new Error(`Vertex API Error: ${response.status}`);
    }

    const result = await response.json();
    let textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Safely strip any potential markdown block wrapped answers
    textOutput = textOutput.replace(/```json\s*(.*?)\s*```/s, '$1').replace(/```\s*(.*?)\s*```/s, '$1');
    const data = JSON.parse(textOutput);

    return {
      amount: data.amount || 0,
      type: (data.type as TransactionType) || 'expense',
      category: data.category || 'Lainnya',
      wallet: data.wallet || 'Utama',
      description: data.description || userInput,
      success: !!data.amount
    };
  } catch (error: any) {
    console.error("Failed to parse AI response:", error);

    // Check for API Key specific errors
    if (error.message === 'INVALID_API_KEY') {
      throw error;
    }

    return {
      amount: 0,
      type: 'expense',
      category: 'Lainnya',
      wallet: 'Utama',
      description: 'Gagal memproses',
      success: false
    };
  }
};
