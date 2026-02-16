import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="text-center bg-black/40 backdrop-blur-xl border border-white/10 p-12 rounded-2xl shadow-2xl">
          <h1 className="mb-4 text-6xl font-black italic uppercase tracking-tighter text-white">404</h1>
          <p className="mb-8 text-xl text-slate-400 font-medium">Oops! Página não encontrada</p>
          <a href="/" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-black uppercase italic text-white shadow-[0_0_20px_rgba(5,96,179,0.4)] hover:bg-primary/90 transition-all">
            Voltar para o Início
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
