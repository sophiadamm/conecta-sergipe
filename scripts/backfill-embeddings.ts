/**
 * Script de Backfill de Embeddings
 * 
 * Este script gera embeddings para todos os perfis e oportunidades existentes
 * que ainda não possuem embedding.
 * 
 * Como usar:
 * 1. Configure as variáveis de ambiente (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)
 * 2. Execute: npx tsx scripts/backfill-embeddings.ts
 * 
 * OU use a Edge Function diretamente via HTTP:
 * curl -X POST https://<project-ref>.functions.supabase.co/semantic-sync \
 *   -H "Content-Type: application/json" \
 *   -d '{"type":"UPDATE","table":"profiles","record":{"id":"<profile-id>",...}}'
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function backfillProfiles() {
  console.log('🔄 Buscando perfis sem embedding...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, nome, bio, skills')
    .is('embedding', null)
    .not('bio', 'is', null)
    .or('skills.not.is.null');

  if (error) {
    console.error('❌ Erro ao buscar perfis:', error);
    return;
  }

  console.log(`📊 Encontrados ${profiles?.length || 0} perfis para processar`);

  if (!profiles || profiles.length === 0) {
    console.log('✅ Nenhum perfil precisa de backfill');
    return;
  }

  // Chama a Edge Function para cada perfil
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/semantic-sync`;
  
  for (const profile of profiles) {
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({
          type: 'UPDATE',
          table: 'profiles',
          record: profile,
        }),
      });

      if (response.ok) {
        console.log(`✅ Embedding gerado para perfil: ${profile.nome} (${profile.id})`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Erro ao processar ${profile.id}:`, errorText);
      }
    } catch (err) {
      console.error(`❌ Erro ao chamar Edge Function para ${profile.id}:`, err);
    }
  }
}

async function backfillOpportunities() {
  console.log('🔄 Buscando oportunidades sem embedding...');
  
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('id, titulo, descricao, skills_required')
    .eq('ativa', true)
    .is('embedding', null)
    .not('descricao', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar oportunidades:', error);
    return;
  }

  console.log(`📊 Encontradas ${opportunities?.length || 0} oportunidades para processar`);

  if (!opportunities || opportunities.length === 0) {
    console.log('✅ Nenhuma oportunidade precisa de backfill');
    return;
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/semantic-sync`;
  
  for (const opp of opportunities) {
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({
          type: 'UPDATE',
          table: 'opportunities',
          record: opp,
        }),
      });

      if (response.ok) {
        console.log(`✅ Embedding gerado para oportunidade: ${opp.titulo} (${opp.id})`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Erro ao processar ${opp.id}:`, errorText);
      }
    } catch (err) {
      console.error(`❌ Erro ao chamar Edge Function para ${opp.id}:`, err);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando backfill de embeddings...\n');
  
  await backfillProfiles();
  console.log('');
  await backfillOpportunities();
  
  console.log('\n✨ Backfill concluído!');
}

main().catch(console.error);
