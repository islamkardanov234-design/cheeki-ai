import { createAdminClient } from './supabase/admin';

/**
 * Генерация изображений для CHEEKI AI.
 *
 * Использует OpenAI Images API (gpt-image-1). Картинка приходит в base64.
 * Чтобы не раздувать чат огромными data-URI, по возможности загружаем PNG
 * в Supabase Storage и возвращаем публичный URL. Если бакет не настроен —
 * откатываемся на data-URL.
 *
 * Требуется OPENAI_API_KEY. Бакет задаётся через IMAGE_BUCKET (по умолчанию 'generated-images').
 */

const IMAGE_MODEL = process.env.IMAGE_MODEL ?? 'gpt-image-1';
const IMAGE_BUCKET = process.env.IMAGE_BUCKET ?? 'generated-images';

export interface GeneratedImage {
  url: string;
  prompt: string;
  /** true, если вернулся data-URL вместо ссылки на Storage */
  inline: boolean;
}

export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1536x1024' | '1024x1536' = '1024x1024',
): Promise<GeneratedImage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for image generation.');
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Image API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const b64: string | undefined = data?.data?.[0]?.b64_json;
  const directUrl: string | undefined = data?.data?.[0]?.url;

  // Некоторые модели/настройки возвращают прямой URL — используем его как есть.
  if (directUrl) {
    return { url: directUrl, prompt, inline: false };
  }

  if (!b64) {
    throw new Error('Image API returned no image data.');
  }

  // Пытаемся загрузить в Supabase Storage для компактной ссылки.
  try {
    const admin = createAdminClient();
    const bytes = Buffer.from(b64, 'base64');
    const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;

    const { error: uploadErr } = await admin.storage
      .from(IMAGE_BUCKET)
      .upload(fileName, bytes, { contentType: 'image/png', upsert: false });

    if (!uploadErr) {
      const { data: pub } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(fileName);
      if (pub?.publicUrl) {
        return { url: pub.publicUrl, prompt, inline: false };
      }
    }
  } catch {
    // Storage недоступен/бакет не создан — откатываемся на data-URL ниже.
  }

  // Fallback: data-URL (работает всегда, но утяжеляет сообщение).
  return { url: `data:image/png;base64,${b64}`, prompt, inline: true };
}
