import React from "react";

const MAIS_ITEMS = [
  { id: "habitos",      icon: "✅", label: "Hábitos" },
  { id: "agua",         icon: "💧", label: "Água" },
  { id: "peso",         icon: "⚖️", label: "Peso" },
  { id: "dieta",        icon: "🥗", label: "Dieta" },
  { id: "suplementos",  icon: "💊", label: "Suplementos" },
  { id: "macros",       icon: "🍽️", label: "Macros" },
  { id: "passos",       icon: "👟", label: "Passos" },
  { id: "sono",         icon: "😴", label: "Sono" },
  { id: "stats",        icon: "📊", label: "Stats" },
  { id: "smartpocket",  icon: "💰", label: "SmartPocket" },
  { id: "rpg",          icon: "⚔️", label: "RPG" },
];

const MAIS_IDS = MAIS_ITEMS.map((i) => i.id);

export default function BottomNav({ abaPrincipal, setAbaPrincipal, showMore, setShowMore, logout }) {
  return (
    <>
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-btn ${abaPrincipal === "home" ? "active" : ""}`}
          onClick={() => setAbaPrincipal("home")}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>

        <button
          className={`bottom-nav-btn ${abaPrincipal === "treino" ? "active" : ""}`}
          onClick={() => setAbaPrincipal("treino")}
        >
          <span>🏋️</span>
          <span>Treino</span>
        </button>

        <button
          className={`bottom-nav-btn ${abaPrincipal === "rotina" ? "active" : ""}`}
          onClick={() => setAbaPrincipal("rotina")}
        >
          <span>📋</span>
          <span>Rotina</span>
        </button>

        <div className="bottom-nav-more-wrap">
          <button
            className={`bottom-nav-btn ${MAIS_IDS.includes(abaPrincipal) ? "active" : ""}`}
            onClick={() => setShowMore((p) => !p)}
          >
            <span>🗃️</span>
            <span>Mais</span>
          </button>

          {showMore && (
            <div className="bottom-nav-more-menu">
              {MAIS_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`more-menu-item ${abaPrincipal === item.id ? "active" : ""}`}
                  onClick={() => {
                    setAbaPrincipal(item.id);
                    setShowMore(false);
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                className="more-menu-item more-menu-logout"
                onClick={logout}
              >
                <span>🚪</span>
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>

        <button
          className={`bottom-nav-btn ${abaPrincipal === "perfil" ? "active" : ""}`}
          onClick={() => setAbaPrincipal("perfil")}
        >
          <span>👤</span>
          <span>Perfil</span>
        </button>
      </nav>

      {showMore && (
        <div
          className="bottom-nav-overlay"
          onClick={() => setShowMore(false)}
        />
      )}
    </>
  );
}