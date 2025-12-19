
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, TransactionType } from "../types";

export const parseFinancialInput = async (userInput: string, validCategories: string[]): Promise<AIResponse> => {
  const apiKey = localStorage.getItem('duitai_api_key') || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const categoriesList = validCategories.join(", ");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userInput,
    config: {
      systemInstruction: `Anda adalah asisten keuangan pintar. Tugas Anda adalah mengekstrak detail transaksi dari input pengguna dalam Bahasa Indonesia.
      
      Aturan Ekstraksi:
      1. Nilai Angka: "30rb" -> 30000, "2jt" -> 2000000.
      2. Tipe: "pemasukan" (income) atau "pengeluaran" (expense).
      3. Kategori: Pilih satu dari daftar berikut: ${categoriesList}. Jika tidak ada yang cocok, gunakan "Lainnya".
      4. Dompet: Ekstrak nama dompet jika disebutkan (contoh: "dompet jajan", "rekening", "cash"). Jika TIDAK disebutkan, gunakan "Utama".
      5. Deskripsi: Buat deskripsi singkat.
      
      Hasilkan output dalam format JSON.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: {
            type: Type.NUMBER,
            description: "Nilai angka transaksi",
          },
          type: {
            type: Type.STRING,
            description: "'income' atau 'expense'",
          },
          category: {
            type: Type.STRING,
            description: "Kategori transaksi",
          },
          wallet: {
            type: Type.STRING,
            description: "Nama dompet yang digunakan",
          },
          description: {
            type: Type.STRING,
            description: "Deskripsi singkat",
          },
        },
        required: ["amount", "type", "category", "wallet", "description"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text || '{}');
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
    // Google GenAI usually throws 400 or 403 for invalid keys
    if (error.toString().includes('400') ||
      error.toString().includes('403') ||
      error.toString().toLowerCase().includes('api key')) {
      throw new Error('INVALID_API_KEY');
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
