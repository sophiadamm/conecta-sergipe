import { createClient } from 'npm:@supabase/supabase-js@2';
import { pipeline } from 'https://esm.sh/@xenova/transformers@2';

// Tipagem básica do payload de webhook do Supabase (row-level events)
interface RowWebhookPayload<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'profiles' | 'opportunities' | string;
  schema: string;
  record: T | null;
  old_record: T | null;
}

type ProfileRecord = {
  id: string;
  nome?: string | null;
  bio?: string | null;
  skills?: string | null;
};

type OpportunityRecord = {
  id: string;
  titulo?: string | null;
  descricao?: string | null;
  skills_required?: string | null;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
}

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

// Carrega o pipeline de embeddings uma única vez (singleton)
const embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

function buildProfileText(record: ProfileRecord): string {
  const parts: string[] = [];

  if (record.nome) parts.push(`Nome: ${record.nome}`);
  if (record.skills) parts.push(`Habilidades: ${record.skills}`);
  if (record.bio) parts.push(`Bio: ${record.bio}`);

  return parts.join(' | ');
}

function buildOpportunityText(record: OpportunityRecord): string {
  const parts: string[] = [];

  if (record.titulo) parts.push(`Título: ${record.titulo}`);
  if (record.skills_required) parts.push(`Habilidades necessárias: ${record.skills_required}`);
  if (record.descricao) parts.push(`Descrição: ${record.descricao}`);

  return parts.join(' | ');
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const embedder = await embedderPromise;
  const output = await embedder(trimmed, {
    pooling: 'mean',
    normalize: true,
  } as any);

  // @ts-ignore - output.data é um TypedArray compatível
  const data: Float32Array | number[] = output.data;
  const arr = Array.from(data as any);

  // Garantir dimensão esperada para all-MiniLM-L6-v2
  if (arr.length !== 384) {
    console.warn(`Unexpected embedding dimension: ${arr.length} (expected 384)`);
  }

  return arr;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: RowWebhookPayload;
  try {
    payload = await req.json();
  } catch (e) {
    console.error('Invalid JSON payload', e);
    return new Response('Invalid JSON', { status: 400 });
  }

  const { table, type, record } = payload;

  if (!record) {
    return new Response('No record in payload', { status: 400 });
  }

  if (type === 'DELETE') {
    // Nada a fazer em deleções
    return new Response('Ignored DELETE event', { status: 200 });
  }

  try {
    let text: string | null = null;

    if (table === 'profiles') {
      text = buildProfileText(record as ProfileRecord);
    } else if (table === 'opportunities') {
      text = buildOpportunityText(record as OpportunityRecord);
    } else {
      return new Response(`Unsupported table: ${table}`, { status: 400 });
    }

    const embedding = await generateEmbedding(text);

    if (!embedding) {
      console.warn('No text to embed or empty embedding, skipping update');
      return new Response(
        JSON.stringify({ message: 'No text to embed, skipped' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { error } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', (record as any).id);

    if (error) {
      console.error('Error updating embedding:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('Unexpected error in semantic-sync function:', e);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

