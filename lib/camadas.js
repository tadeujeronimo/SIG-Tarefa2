// Funções de apoio para os arquivos GeoJSON que ficam em public/.
// Não usa nada do Node, então pode ser importado tanto pelo servidor quanto pelo navegador.

export const COD_SOBRAL = "2312908"; // CD_MUN de Sobral no IBGE

// Nomes amigáveis para os arquivos conhecidos, na ordem em que aparecem no select.
// Qualquer outro .geojson colocado em public/ também aparece, depois destes.
const CONHECIDAS = [
  { arquivo: "ce-norte.geojson", rotulo: "Municípios do Norte do Ceará", escopo: "do Norte do Ceará" },
  { arquivo: "ce-municipios.geojson", rotulo: "Municípios do Ceará", escopo: "do Ceará" },
  { arquivo: "sobral-pontos.geojson", rotulo: "Pontos de Sobral" },
  { arquivo: "sobral-rio.geojson", rotulo: "Rio Acaraú em Sobral" },
];

function rotuloPadrao(nome) {
  const texto = nome.replace(/\.geojson$/i, "").replace(/[-_]+/g, " ").trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Recebe os nomes dos arquivos de public/ e devolve a lista para o select
export function montarCamadas(nomes) {
  const geojson = nomes.filter((n) => n.toLowerCase().endsWith(".geojson"));
  const indice = (nome) => {
    const i = CONHECIDAS.findIndex((c) => c.arquivo === nome);
    return i === -1 ? CONHECIDAS.length : i;
  };
  return geojson
    .sort((a, b) => indice(a) - indice(b) || a.localeCompare(b, "pt-BR"))
    .map((nome) => {
      const conhecida = CONHECIDAS.find((c) => c.arquivo === nome);
      return {
        arquivo: `/${nome}`,
        nome,
        rotulo: conhecida?.rotulo ?? rotuloPadrao(nome),
        escopo: conhecida?.escopo ?? "desta camada",
      };
    });
}

// Camada de municípios do IBGE: todas as feições têm CD_MUN e AREA_KM2.
// Só nelas faz sentido colorir por região/área e destacar Sobral.
export function ehCamadaMunicipal(dados) {
  const feicoes = dados?.features ?? [];
  return (
    feicoes.length > 0 &&
    feicoes.every((f) => f.properties?.CD_MUN && typeof f.properties?.AREA_KM2 === "number")
  );
}
