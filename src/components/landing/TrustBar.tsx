export function TrustBar() {
  const items = [
    { emoji: "🔒", text: "Dados seguros" },
    { emoji: "📱", text: "Funciona no celular" },
    { emoji: "⚡", text: "Setup em 2 minutos" },
    { emoji: "🚫", text: "Sem fidelidade" },
    { emoji: "💳", text: "Cancele quando quiser" },
  ];

  return (
    <section className="bg-[#0F2440]/80 border-y border-white/[0.06] py-5">
      <div className="container px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {items.map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-gray-400">
              <span>{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
