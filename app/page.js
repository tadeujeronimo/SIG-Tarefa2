import { readdir } from "node:fs/promises";
import path from "node:path";
import Aplicativo from "@/components/Aplicativo";
import { montarCamadas } from "@/lib/camadas";

// Componente de servidor: lê a pasta public/ e entrega ao mapa a lista de GeoJSON.
// Em desenvolvimento, um arquivo novo aparece ao recarregar a página.
// Em produção, a lista é montada no "npm run build".
export default async function Page() {
  const nomes = await readdir(path.join(process.cwd(), "public"));
  return <Aplicativo camadas={montarCamadas(nomes)} />;
}
