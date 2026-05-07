import React, { useState, useCallback } from "react";
import { supabase } from "./lib/supabase";

function formatarData(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
}

function calcularHoras(dormiu, acordou) {
  if (!dormiu || !acordou) return null;
  const [hD, mD] = dormiu.split(":").map(Number);
  const [hA, mA] = acordou.split(":").map(Number);
  let min = hA * 60 + mA - (hD * 60 + mD);
  if (min < 0) min += 24 * 60;
  return (min / 60).toFixed(1);
}

const PERIODOS = [
  { id: "hoje",      label: "Hoje",          icon: "📅" },
  { id: "ontem",     label: "Ontem",         icon: "⏮️" },
  { id: "semana",    label: "Esta semana",   icon: "📆" },
  { id: "mes",       label: "Este mês",      icon: "🗓️" },
  { id: "especifico", label: "Dia específico", icon: "🗓️" },
];

export default function Coach({ user }) {
  if (periodo === "hoje") {
        const s = fmt(hoje);
        return { inicio: s, fim: s, label: "hoje" };
      }
      if (periodo === "ontem") {
        const d = new Date(hoje);
        d.setDate(d.getDate() - 1);
        const s = fmt(d);
        return { inicio: s, fim: s, label: "ontem" };
      }

  const getRange = useCallback(() => {
    const hoje = new Date();
    const fmt = (d) => formatarData(d);

    if (periodo === "hoje") {
          const s = fmt(hoje);
          return { inicio: s, fim: s, label: "hoje" };
        }
        if (periodo === "ontem") {
          const d = new Date(hoje);
          d.setDate(d.getDate() - 1);
          const s = fmt(d);
          return { inicio: s, fim: s, label: "ontem" };
        }
        if (periodo === "especifico") {
          return { inicio: dataEspecifica, fim: dataEspecifica, label: `em ${new Date(dataEspecifica + "T00:00:00").toLocaleDateString("pt-BR")}` };
        }
    if (periodo === "semana") {
      const d = new Date(hoje);
      d.setDate(d.getDate() - 6);
      return { inicio: fmt(d), fim: fmt(hoje), label: "nos últimos 7 dias" };
    }
    // mes
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio: fmt(inicioMes), fim: fmt(hoje), label: "neste mês" };
  }, [periodo]);

  const analisar = async () => {
    setAnalisando(true);
    setAnalise(null);
    setErro(null);

    try {
      const { inicio, fim, label } = getRange();

      // Busca tudo em paralelo
      const [
        { data: perfil },
        { data: treinos },
        { data: cardio },
        { data: agua },
        { data: aguaMeta },
        { data: peso },
        { data: passos },
        { data: passosMeta },
        { data: sono },
        { data: macros },
        { data: macrosMeta },
        { data: humor },
        { data: habitos },
        { data: suplementos },
      ] = await Promise.all([
        supabase.from("perfil").select("*").eq("user_id", user.id).single(),
        supabase.from("treinos_finalizados").select("*").eq("user_id", user.id)
          .gte("created_at", inicio + "T00:00:00").lte("created_at", fim + "T23:59:59"),
        supabase.from("cardio_registro").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim),
        supabase.from("agua_registro").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim),
        supabase.from("agua_meta").select("meta_ml").eq("user_id", user.id).single(),
        supabase.from("peso_registro").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim).order("data", { ascending: true }),
        supabase.from("passos_registro").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim),
        supabase.from("passos_meta").select("meta_passos").eq("user_id", user.id).single(),
        supabase.from("sono_registro").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim),
        supabase.from("macros_registro").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim),
        supabase.from("macros_meta").select("*").eq("user_id", user.id).single(),
        supabase.from("humor_registro").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim),
        supabase.from("habitos_check").select("*").eq("user_id", user.id)
          .gte("data", inicio).lte("data", fim),
        supabase.from("suplementos").select("nome").eq("user_id", user.id),
      ]);

      // Processa dados
      const totalAgua = (agua || []).reduce((s, r) => s + r.ml, 0);
      const diasAgua = [...new Set((agua || []).map(r => r.data))].length;
      const metaAgua = aguaMeta?.meta_ml || 2500;

      const aguaPorDia = {};
      (agua || []).forEach(r => { aguaPorDia[r.data] = (aguaPorDia[r.data] || 0) + r.ml; });
      const diasMetaAgua = Object.values(aguaPorDia).filter(v => v >= metaAgua).length;

      const totalPassos = (passos || []).reduce((s, r) => s + r.passos, 0);
      const metaPassos = passosMeta?.meta_passos || 10000;
      const diasMetaPassos = (passos || []).filter(r => r.passos >= metaPassos).length;

      const sonoRegistros = sono || [];
      const mediaHorasSono = sonoRegistros.length > 0
        ? (sonoRegistros.reduce((s, r) => s + parseFloat(calcularHoras(r.dormiu, r.acordou) || 0), 0) / sonoRegistros.length).toFixed(1)
        : null;
      const qualidadeMediaSono = sonoRegistros.length > 0
        ? (sonoRegistros.reduce((s, r) => s + r.qualidade, 0) / sonoRegistros.length).toFixed(1)
        : null;

      const macrosRegs = macros || [];
      const mediaKcal = macrosRegs.length > 0
        ? Math.round(macrosRegs.reduce((s, r) => s + r.kcal, 0) / macrosRegs.length)
        : null;
      const mediaProt = macrosRegs.length > 0
        ? (macrosRegs.reduce((s, r) => s + Number(r.prot), 0) / macrosRegs.length).toFixed(1)
        : null;
      const metaKcal = macrosMeta?.meta_kcal;

      const humorRegs = humor || [];
      const mediaHumor = humorRegs.length > 0
        ? (humorRegs.reduce((s, r) => s + (r.humor || 0), 0) / humorRegs.filter(r => r.humor).length).toFixed(1)
        : null;
      const mediaEnergia = humorRegs.length > 0
        ? (humorRegs.reduce((s, r) => s + (r.energia || 0), 0) / humorRegs.filter(r => r.energia).length).toFixed(1)
        : null;

      const habitosFeitos = (habitos || []).filter(r => r.concluido).length;
      const totalHabitos = (habitos || []).length;

      const pesoInicio = peso?.[0] ? Number(peso[0].peso) : null;
      const pesoFim = peso?.length > 0 ? Number(peso[peso.length - 1].peso) : null;

      // Monta o prompt
      const prompt = `Você é um personal trainer e coach de saúde especializado. Analise os dados do usuário abaixo e forneça uma análise personalizada, direta e motivadora em português brasileiro.

## PERFIL DO USUÁRIO
- Nome: ${perfil?.nome || "Usuário"}
- Peso atual: ${perfil?.peso || "não informado"}kg
- Altura: ${perfil?.altura || "não informado"}cm
- Idade: ${perfil?.idade || "não informado"} anos
- Sexo: ${perfil?.sexo === "M" ? "Masculino" : "Feminino"}
- Objetivo: ${perfil?.objetivo === "emagrecer" ? "Emagrecer" : perfil?.objetivo === "ganhar" ? "Ganhar massa" : "Manter peso"}

## PERÍODO ANALISADO: ${label.toUpperCase()}

## TREINOS
- Total de treinos: ${(treinos || []).length}
- Divisões treinadas: ${[...new Set((treinos || []).map(t => t.treino))].join(", ") || "nenhuma"}
- Tempo total: ${Math.round((treinos || []).reduce((s, t) => s + (t.tempo_segundos || 0), 0) / 60)} minutos
- Kcal queimadas (musculação): ${(treinos || []).reduce((s, t) => s + (t.kcal || 0), 0)} kcal
- Volume total: ${(treinos || []).reduce((s, t) => s + (t.volume_total || 0), 0).toLocaleString("pt-BR")} kg

## CARDIO
- Sessões de cardio: ${(cardio || []).length}
- Tipos: ${[...new Set((cardio || []).map(r => r.tipo))].join(", ") || "nenhum"}
- Tempo total cardio: ${(cardio || []).reduce((s, r) => s + r.duracao_min, 0)} minutos
- Kcal cardio: ${(cardio || []).reduce((s, r) => s + (r.kcal || 0), 0)} kcal

## HIDRATAÇÃO
- Meta diária: ${(metaAgua / 1000).toFixed(1)}L
- Dias que bateu a meta: ${diasMetaAgua} de ${diasAgua} dias registrados
- Total consumido: ${(totalAgua / 1000).toFixed(1)}L

## SONO
${mediaHorasSono ? `- Média de horas dormidas: ${mediaHorasSono}h/noite
- Qualidade média: ${qualidadeMediaSono}/5
- Noites registradas: ${sonoRegistros.length}` : "- Sem registros de sono no período"}

## NUTRIÇÃO
${mediaKcal ? `- Média de kcal/dia: ${mediaKcal} kcal${metaKcal ? ` (meta: ${metaKcal} kcal)` : ""}
- Média de proteína/dia: ${mediaProt}g
- Dias registrados: ${macrosRegs.length}` : "- Sem registros de macros no período"}

## PASSOS
- Total de passos: ${totalPassos.toLocaleString("pt-BR")}
- Meta diária: ${metaPassos.toLocaleString("pt-BR")} passos
- Dias que bateu a meta: ${diasMetaPassos} de ${(passos || []).length} dias registrados

## HUMOR E ENERGIA
${mediaHumor ? `- Humor médio: ${mediaHumor}/5
- Energia média: ${mediaEnergia}/5` : "- Sem registros de humor no período"}

## HÁBITOS
- Check-ins concluídos: ${habitosFeitos} de ${totalHabitos} registros

## PESO
${pesoInicio ? `- Peso início do período: ${pesoInicio}kg
- Peso fim do período: ${pesoFim}kg
- Variação: ${(pesoFim - pesoInicio).toFixed(1)}kg` : "- Sem registros de peso no período"}

## SUPLEMENTOS EM USO
${(suplementos || []).map(s => `- ${s.nome}`).join("\n") || "- Nenhum cadastrado"}

---

Com base nesses dados, forneça uma análise completa com:

1. **Resumo geral** — como foi o período em poucas palavras
2. **Pontos positivos** — o que o usuário está indo bem (seja específico com os números)
3. **Pontos de atenção** — onde está falhando e por quê isso importa (máx 3 pontos)
4. **Recomendações práticas** — ações concretas para os próximos dias (máx 3)
5. **Mensagem motivacional** — curta, direta e personalizada

Seja direto, use os números reais, evite ser genérico. Fale como um treinador experiente que conhece bem o usuário.`;

      // Chama a API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const texto = data.content?.map(c => c.text || "").join("") || "";
      if (!texto) throw new Error("Resposta vazia da IA");

      setAnalise(texto);
    } catch (e) {
      setErro("Erro ao gerar análise: " + e.message);
    }

    setAnalisando(false);
  };

  // Renderiza markdown simples
  const renderAnalise = (texto) => {
    const linhas = texto.split("\n");
    return linhas.map((linha, i) => {
      if (linha.startsWith("## ") || linha.startsWith("# ")) {
        return null; // ignora headers do prompt que vazarem
      }
      if (linha.startsWith("**") && linha.endsWith("**")) {
        return (
          <div key={i} style={{ fontSize: 13, fontWeight: 800, color: "#818cf8", marginTop: 16, marginBottom: 4, letterSpacing: "0.04em" }}>
            {linha.replace(/\*\*/g, "")}
          </div>
        );
      }
      if (/^\*\*.*\*\*/.test(linha)) {
        return (
          <div key={i} style={{ fontSize: 14, color: "#f8fafc", marginBottom: 6, lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: linha.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
          />
        );
      }
      if (linha.startsWith("- ") || linha.startsWith("• ")) {
        return (
          <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4, paddingLeft: 12, lineHeight: 1.6 }}>
            · {linha.slice(2)}
          </div>
        );
      }
      if (linha.match(/^\d+\./)) {
        return (
          <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, paddingLeft: 4, lineHeight: 1.6 }}>
            {linha}
          </div>
        );
      }
      if (linha.trim() === "") return <div key={i} style={{ height: 4 }} />;
      return (
        <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4, lineHeight: 1.6 }}>
          {linha}
        </div>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🤖</div>
        <h2 className="title-divisao" style={{ margin: 0 }}>DayForge Coach</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
          Análise personalizada dos seus dados de saúde e performance
        </p>
      </div>

      {/* Seletor de período */}
      <div style={{ background: "#1a1d21", border: "1px solid #ffffff0d", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800, letterSpacing: "0.08em", marginBottom: 12 }}>
          PERÍODO DA ANÁLISE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {PERIODOS.map((p) => {
            const sel = periodo === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setPeriodo(p.id); setAnalise(null); }}
                style={{
                  background: sel ? "#6366f122" : "#24282d",
                  border: `1px solid ${sel ? "#6366f1" : "#ffffff0d"}`,
                  borderRadius: 12,
                  padding: "12px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: sel ? "#818cf8" : "#94a3b8" }}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

            {periodo === "especifico" && (
              <div style={{ background: "#1a1d21", border: "1px solid #ffffff0d", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>ESCOLHA O DIA</div>
                <input
                  type="date"
                  value={dataEspecifica}
                  max={formatarData(new Date())}
                  onChange={(e) => { setDataEspecifica(e.target.value); setAnalise(null); }}
                  style={{ width: "100%", colorScheme: "dark" }}
                />
              </div>
            )}

            {/* Botão analisar */}
      <button
        onClick={analisar}
        disabled={analisando}
        style={{
          background: analisando ? "#334155" : "linear-gradient(135deg, #6366f1, #4f46e5)",
          border: "none",
          borderRadius: 14,
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          padding: 16,
          cursor: analisando ? "not-allowed" : "pointer",
          boxShadow: analisando ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {analisando ? (
          <>
            <span style={{ fontSize: 20, animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
            Analisando seus dados...
          </>
        ) : (
          <>🤖 Analisar {PERIODOS.find(p => p.id === periodo)?.label}</>
        )}
      </button>

      {/* Erro */}
      {erro && (
        <div style={{ background: "#ef444415", border: "1px solid #ef444433", borderRadius: 12, padding: 14, fontSize: 13, color: "#ef4444" }}>
          ⚠️ {erro}
        </div>
      )}

      {/* Resultado */}
      {analise && (
        <div style={{ background: "#1a1d21", border: "1px solid #6366f133", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #ffffff0d" }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>Análise do Coach</div>
              <div style={{ fontSize: 11, color: "#475569" }}>
                {PERIODOS.find(p => p.id === periodo)?.label} · {new Date().toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
          {renderAnalise(analise)}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}