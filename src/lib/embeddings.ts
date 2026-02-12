import { pipeline } from '@huggingface/transformers';

let embedderPromise: Promise<any> | null = null;

function getEmbedder(): Promise<any> {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'fp32',
    } as any);
  }
  return embedderPromise;
}

export function buildProfileText(profile: { nome?: string | null; bio?: string | null; skills?: string | null }): string {
  const parts: string[] = [];
  if (profile.nome) parts.push(`Nome: ${profile.nome}`);
  if (profile.skills) parts.push(`Habilidades: ${profile.skills}`);
  if (profile.bio) parts.push(`Bio: ${profile.bio}`);
  return parts.join(' | ');
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const embedder = await getEmbedder();
    const output = await embedder(trimmed, { pooling: 'mean', normalize: true });
    // output is a Tensor; convert to plain array
    const data = output.tolist()[0] as number[];
    return data;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}
