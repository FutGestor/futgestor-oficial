interface SectionCtaProps {
  text: string;
}

export function SectionCta({ text }: SectionCtaProps) {
  const scrollTo = () => {
    document.getElementById("precos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="text-center py-8 bg-[#0A1628]">
      <button
        onClick={scrollTo}
        className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] shadow-[0_4px_20px_rgba(212,168,75,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(212,168,75,0.4)] transition-all"
      >
        {text}
      </button>
    </div>
  );
}
