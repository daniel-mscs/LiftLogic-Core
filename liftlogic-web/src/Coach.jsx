import React, { useState } from "react";
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
  { id: "hoje",   label: "Hoje",        icon: "📅" },
  { id: "semana", label: "Esta semana", icon: "📆" },
  { id: "mes",    label: "Este mês",    icon: "🗓️" },
];

export default function Coach({ user }) {
  const [periodo, setPeriodo] = useState("semana");
  const [dataCustom, setDataCustom] = useState(formatarData(new Date()));
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [erro, setErro] = useState(null);

  const getRange = () => {
    const hoje = new Date();
    const fmt = (d) => formatarData(d);

    if (periodo === "hoje") {
      const s = fmt(hoje);
      return { inicio: s, fim: s, label: "hoje" };
    }
    if (periodo === "semana") {
      const d = new Date(hoje);
      d.setDate(d.getDate() - 6);
      return { inicio: fmt(d), fim: fmt(hoje), label: "nos últimos 7 dias" };
    }
    if (periodo === "mes") {
      const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return { inicio: fmt(ini), fim: fmt(hoje), label: "neste mês" };
    }
    // data custom
    return {
      inicio: dataCustom,
      fim: dataCustom,
      label: `em ${new Date(dataCustom + "T00:00:00").toLocaleDateString("pt-BR")}`,
    };
  };

  const analisar = async () => {
    setAnalisando(true);
    setAnalise(null);
    setErro(null);

    try {
      const { inicio, fim, label } = getRange();

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

      const metaAgua = aguaMeta?.meta_ml || 2500;
      const totalAgua = (agua || []).reduce((s, r) => s + r.ml, 0);
      const diasAgua = [...new Set((agua || []).map(r => r.data))].length;
      const aguaPorDia = {};
      (agua || []).forEach(r => { aguaPorDia[r.data] = (aguaPorDia[r.data] || 0) + r.ml; });
      const diasMetaAgua = Object.values(aguaPorDia).filter(v => v >= metaAgua).length;

      const metaPassos = passosMeta?.meta_passos || 10000;
      const totalPassos = (passos || []).reduce((s, r) => s + r.passos, 0);
      const diasMetaPassos = (passos || []).filter(r => r.passos >= metaPassos).length;

      const sonoRegs = sono || [];
      const mediaHorasSono = sonoRegs.length > 0
        ? (sonoRegs.reduce((s, r) => s + parseFloat(calcularHoras(r.dormiu, r.acordou) || 0), 0) / sonoRegs.length).toFixed(1)
        : null;
      const qualidadeSono = sonoRegs.length > 0
        ? (sonoRegs.reduce((s, r) => s + r.qualidade, 0) / sonoRegs.length).toFixed(1)
        : null;

      const macrosRegs = macros || [];
      const mediaKcal = macrosRegs.length > 0
        ? Math.round(macrosRegs.reduce((s, r) => s + r.kcal, 0) / macrosRegs.length)
        : null;
      const mediaProt = macrosRegs.length > 0
        ? (macrosRegs.reduce((s, r) => s + Number(r.prot), 0) / macrosRegs.length).toFixed(1)
        : null;

      const humorRegs = (humor || []).filter(r => r.humor);
      const energiaRegs = (humor || []).filter(r => r.energia);
      const mediaHumor = humorRegs.length > 0
        ? (humorRegs.reduce((s, r) => s + r.humor, 0) / humorRegs.length).toFixed(1) : null;
      const mediaEnergia = energiaRegs.length > 0
        ? (energiaRegs.reduce((s, r) => s + r.energia, 0) / energiaRegs.length).toFixed(1) : null;

      const habitosFeitos = (habitos || []).filter(r => r.concluido).length;
      const totalHabitos = (habitos || []).length;
      const pesoInicio = peso?.[0] ? Number(peso[0].peso) : null;
      const pesoFim = peso?.length > 0 ? Number(peso[peso.length - 1].peso) : null;

      const prompt = `Você é um personal trainer e coach de saúde especializado. Analise os dados do usuário abaixo e forneça uma análise personalizada, direta e motivadora em português brasileiro.

## PERFIL
- Nome: ${perfil?.nome || "Usuário"}
- Peso: ${perfil?.peso || "?"}kg | Altura: ${perfil?.altura || "?"}cm | Idade: ${perfil?.idade || "?"} anos
- Sexo: ${perfil?.sexo === "M" ? "Masculino" : "Feminino"}
- Objetivo: ${perfil?.objetivo === "emagrecer" ? "Emagrecer" : perfil?.objetivo === "ganhar" ? "Ganhar massa" : "Manter peso"}

## PERÍODO: ${label.toUpperCase()}

## TREINOS
- Total: ${(treinos || []).length} treinos | Divisões: ${[...new Set((treinos || []).map(t => t.treino))].join(", ") || "nenhuma"}
- Tempo total: ${Math.round((treinos || []).reduce((s, t) => s + (t.tempo_segundos || 0), 0) / 60)} min
- Kcal musculação: ${(treinos || []).reduce((s, t) => s + (t.kcal || 0), 0)} kcal
- Volume total: ${(treinos || []).reduce((s, t) => s + (t.volume_total || 0), 0).toLocaleString("pt-BR")} kg

## CARDIO
- Sessões: ${(cardio || []).length} | Tipos: ${[...new Set((cardio || []).map(r => r.tipo))].join(", ") || "nenhum"}
- Tempo: ${(cardio || []).reduce((s, r) => s + r.duracao_min, 0)} min | Kcal: ${(cardio || []).reduce((s, r) => s + (r.kcal || 0), 0)} kcal

## HIDRATAÇÃO
- Meta: ${(metaAgua / 1000).toFixed(1)}L/dia | Total: ${(totalAgua / 1000).toFixed(1)}L
- Dias na meta: ${diasMetaAgua}/${diasAgua} dias registrados

## SONO
${mediaHorasSono ? `- Média: ${mediaHorasSono}h/noite | Qualidade: ${qualidadeSono}/5 | Noites: ${sonoRegs.length}` : "- Sem registros"}

## NUTRIÇÃO
${mediaKcal ? `- Kcal média: ${mediaKcal}${macrosMeta?.meta_kcal ? ` (meta: ${macrosMeta.meta_kcal})` : ""} | Proteína: ${mediaProt}g/dia | Dias: ${macrosRegs.length}` : "- Sem registros"}

## PASSOS
- Total: ${totalPassos.toLocaleString("pt-BR")} | Meta: ${metaPassos.toLocaleString("pt-BR")}/dia
- Dias na meta: ${diasMetaPassos}/${(passos || []).length}

## HUMOR/ENERGIA
${mediaHumor ? `- Humor: ${mediaHumor}/5 | Energia: ${mediaEnergia}/5` : "- Sem registros"}

## HÁBITOS
- Concluídos: ${habitosFeitos}/${totalHabitos}

## PESO
${pesoInicio ? `- Início: ${pesoInicio}kg | Fim: ${pesoFim}kg | Variação: ${(pesoFim - pesoInicio).toFixed(1)}kg` : "- Sem registros"}

## SUPLEMENTOS
${(suplementos || []).map(s => `- ${s.nome}`).join("\n") || "- Nenhum"}

---
Forneça análise com:
1. **Resumo geral**
2. **Pontos positivos** (use os números reais)
3. **Pontos de atenção** (máx 3)
4. **Recomendações práticas** (máx 3, ações concretas)
5. **Mensagem motivacional** (curta e personalizada)

Seja direto, específico, fale como treinador experiente.`;

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      console.log("Resposta da API:", JSON.stringify(data));
            const texto = data.content?.map(c => c.text || "").join("") || "";
            if (!texto) throw new Error("Resposta vazia: " + JSON.stringify(data));
      setAnalise(texto);
    } catch (e) {
      setErro("Erro ao gerar análise: " + e.message);
    }
    setAnalisando(false);
  };

  const renderAnalise = (texto) => {
    return texto.split("\n").map((linha, i) => {
      if (!linha.trim()) return <div key={i} style={{ height: 6 }} />;
      if (/^\*\*(.*?)\*\*$/.test(linha.trim())) {
        return <div key={i} style={{ fontSize: 13, fontWeight: 800, color: "#818cf8", marginTop: 16, marginBottom: 4 }}>{linha.replace(/\*\*/g, "")}</div>;
      }
      if (/\*\*(.*?)\*\*/.test(linha)) {
        return <div key={i} style={{ fontSize: 13, color: "#f8fafc", marginBottom: 5, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: linha.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
      }
      if (linha.startsWith("- ") || linha.startsWith("• ")) {
        return <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4, paddingLeft: 12, lineHeight: 1.6 }}>· {linha.slice(2)}</div>;
      }
      if (/^\d+\./.test(linha)) {
        return <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 5, lineHeight: 1.6 }}>{linha}</div>;
      }
      return <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4, lineHeight: 1.6 }}>{linha}</div>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 80 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🤖</div>
        <h2 className="title-divisao" style={{ margin: 0 }}>DayForge Coach</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Análise personalizada dos seus dados</p>
      </div>

      {/* Período */}
      <div style={{ background: "#1a1d21", border: "1px solid #ffffff0d", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800, letterSpacing: "0.08em", marginBottom: 12 }}>PERÍODO DA ANÁLISE</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {PERIODOS.map((p) => {
            const sel = periodo === p.id;
            return (
              <button key={p.id} onClick={() => { setPeriodo(p.id); setAnalise(null); }} style={{
                flex: 1, background: sel ? "#6366f122" : "#24282d",
                border: `1px solid ${sel ? "#6366f1" : "#ffffff0d"}`,
                borderRadius: 12, padding: "10px 4px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: sel ? "#818cf8" : "#64748b" }}>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Data personalizada */}
        <div style={{ borderTop: "1px solid #ffffff0d", paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
            📅 OU ESCOLHA UM DIA ESPECÍFICO
          </div>
          <input
            type="date"
            value={dataCustom}
            max={formatarData(new Date())}
            onChange={(e) => { setDataCustom(e.target.value); setPeriodo("custom"); setAnalise(null); }}
            style={{ width: "100%", colorScheme: "dark" }}
          />
          {periodo === "custom" && (
            <div style={{ fontSize: 11, color: "#6366f1", marginTop: 6 }}>
              ✓ Analisando: {new Date(dataCustom + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </div>
          )}
        </div>
      </div>

      {/* Botão */}
      <button onClick={analisar} disabled={analisando} style={{
        background: analisando ? "#334155" : "linear-gradient(135deg, #6366f1, #4f46e5)",
        border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 700,
        padding: 16, cursor: analisando ? "not-allowed" : "pointer",
        boxShadow: analisando ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        {analisando ? (
          <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span> Analisando seus dados...</>
        ) : (
          <>🤖 Analisar {periodo === "custom" ? new Date(dataCustom + "T00:00:00").toLocaleDateString("pt-BR") : PERIODOS.find(p => p.id === periodo)?.label}</>
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
                {periodo === "custom"
                  ? new Date(dataCustom + "T00:00:00").toLocaleDateString("pt-BR")
                  : PERIODOS.find(p => p.id === periodo)?.label} · {new Date().toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
          {renderAnalise(analise)}
        </div>
      )}
    </div>
  );
}