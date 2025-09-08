import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TermoInquilino from "./pages/TermoInquilino";
import SavedTerms from "./pages/SavedTerms";
import EditTerm from "./pages/EditTerm";
import Contratos from "./pages/Contratos";
import CadastrarContrato from "./pages/CadastrarContrato";
import ProcessoDesocupacao from "./pages/ProcessoDesocupacao";
import GerarDocumento from "./pages/GerarDocumento";
import TermoLocador from "./pages/TermoLocador";
import TermoLocatario from "./pages/TermoLocatario";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/cadastrar-contrato" element={<CadastrarContrato />} />
          <Route path="/gerar-documento" element={<GerarDocumento />} />
          <Route path="/termo-locador" element={<TermoLocador />} />
          <Route path="/termo-locatario" element={<TermoLocatario />} />
          <Route path="/processo/:contratoId" element={<ProcessoDesocupacao />} />
          <Route path="/processo/:contratoId/termo-chaves" element={<TermoInquilino />} />
          <Route path="/termos-salvos" element={<SavedTerms />} />
          <Route path="/editar-termo/:id" element={<EditTerm />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
