import { supabase } from './supabase'

const XP_REGRAS = {
  treino_finalizado:  50,
  habito_concluido:   10,
  meta_agua:          20,
  meta_passos:        20,
  peso_registrado:     5,
  macros_registrado:  15,
  streak_diario:      10,
}

export async function ganharXP(userId, motivo) {
  const xp = XP_REGRAS[motivo]
  if (!xp) return

  const motivoTexto = {
    treino_finalizado:  '🏋️ Treino finalizado',
    habito_concluido:   '✅ Hábito concluído',
    meta_agua:          '💧 Meta de água batida',
    meta_passos:        '👟 Meta de passos batida',
    peso_registrado:    '⚖️ Peso registrado',
    macros_registrado:  '🍽️ Macros registrados',
    streak_diario:      '🔥 Streak diário',
  }[motivo]

  await supabase.from('rpg_xp_log').insert([{ user_id: userId, xp, motivo: motivoTexto }])

  const { data } = await supabase.from('rpg_perfil').select('xp').eq('user_id', userId).single()
  const novoXP = (data?.xp || 0) + xp

  const nivel = novoXP >= 2000 ? 5 : novoXP >= 1000 ? 4 : novoXP >= 500 ? 3 : novoXP >= 200 ? 2 : 1

  await supabase.from('rpg_perfil').upsert({
    user_id: userId, xp: novoXP, nivel,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
}