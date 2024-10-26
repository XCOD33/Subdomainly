const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const fonnteHelper = require('./fonnteHelper');
const blockedNameModel = require('../models/blockedname');
const jwt = require('jsonwebtoken');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: 'Kamu adalah system security yang baik.',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

exports.isSafeSubdomain = async (subdomain) => {
  const isBlocked = await blockedNameModel.isBlocked(subdomain);
  if (isBlocked) {
    return isBlocked;
  }

  const chatSession = model.startChat({
    generationConfig,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
    history: [
      {
        role: 'user',
        parts: [
          {
            text: 'Kamu akan membantuku untuk menyeleksi apakah sebuah subdomain ini berbahaya atau tidak. Karena aku mengembangkan sistem untuk memberikan subdomain gratis, aku mau kamu mengecek subdomain ini ada unsur berbahaya atau tidak untuk dipakai orang lain. Misalnya :\nWWW, mail, smtp, pop, imap, slot, judi : itu berbahaya karena bisa dipakai oleh sembarang orang dan mengandung unsur kejahatan atau sejenisnya\n\nBerikan output persis seperti ini :\njika, berbahaya\n"BLOCKED: {subdomain} - {alasan}"\njika, tidak\n"safe"\n\nsubdomain : www',
          },
        ],
      },
      {
        role: 'model',
        parts: [{ text: '"safe" \n' }],
      },
      {
        role: 'user',
        parts: [
          {
            text: 'WWW seharusnya blocked. ingat hanya jawab dengan format output yang sudah aku katakan',
          },
        ],
      },
      {
        role: 'model',
        parts: [
          {
            text: '"BLOCKED: WWW - bisa dipakai oleh sembarang orang dan mengandung unsur kejahatan" \n',
          },
        ],
      },
      {
        role: 'user',
        parts: [
          { text: 'alasan berikan yang memang masuk akal, jangan diulangi terus-terusan' },
          { text: 'help' },
        ],
      },
      {
        role: 'model',
        parts: [{ text: '"safe" \n' }],
      },
      {
        role: 'user',
        parts: [{ text: 'help seharusnya block' }],
      },
      {
        role: 'model',
        parts: [
          {
            text: '"BLOCKED: help -  bisa digunakan untuk mengelabui pengguna dan mengarahkan mereka ke situs berbahaya" \n',
          },
        ],
      },
      {
        role: 'user',
        parts: [{ text: 'toto' }],
      },
      {
        role: 'model',
        parts: [
          {
            text: '"BLOCKED: toto -  berhubungan dengan perjudian dan dapat menarik aktivitas ilegal" \n',
          },
        ],
      },
      {
        role: 'user',
        parts: [{ text: 'sex' }],
      },
      {
        role: 'model',
        parts: [
          {
            text: '"BLOCKED: sex -  berhubungan dengan konten dewasa dan dapat menarik aktivitas ilegal" \n',
          },
        ],
      },
      {
        role: 'user',
        parts: [
          {
            text: 'mulai sekarang dan seterusnya format output JSON seperti ini :\n{\n  "status": {is_safe_or_not},\n  "reason: {reason_null_is_safe}\n}',
          },
        ],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'Oke, saya akan menggunakan format JSON untuk outputnya mulai sekarang. \n\nBeri tahu saya subdomain yang ingin Anda periksa! \n',
          },
        ],
      },
      {
        role: 'user',
        parts: [{ text: 'peli' }],
      },
      {
        role: 'model',
        parts: [
          {
            text: '```json\n{\n  "status": "BLOCKED",\n  "reason": "berhubungan dengan konten dewasa dan dapat menarik aktivitas ilegal"\n}\n``` \n',
          },
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage(subdomain);

  if (!isJSON(result.response.text())) {
    throw new Error('Invalid response from the model.');
  }

  if (result.response.text().includes('BLOCKED')) {
    const responseJson = JSON.parse(result.response.text());
    await blockedNameModel.store(
      subdomain,
      responseJson.reason,
      responseJson.status === 'safe' ? 'safe' : 'harmful'
    );
  }

  return JSON.parse(result.response.text());
};
