// Nomes legíveis dos atributos (properties) dos GeoJSON do IBGE usados no projeto.
// A chave é o nome da coluna no arquivo; o resto é só apresentação.

const formatadorKm2 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export const ATRIBUTOS = {
  CD_MUN: { rotulo: "Código IBGE" },
  NM_MUN: { rotulo: "Município" },
  NM_RGI: { rotulo: "Região imediata" },
  NM_RGINT: { rotulo: "Região intermediária" },
  AREA_KM2: {
    rotulo: "Área territorial",
    formatar: (valor) => `${formatadorKm2.format(valor)} km²`,
  },
};

// Colunas que não estão no dicionário (por exemplo, as das suas camadas autorais)
// aparecem com o próprio nome da coluna.
export function descreverAtributo(chave) {
  return ATRIBUTOS[chave] ?? { rotulo: chave };
}

export function formatarValor(chave, valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  const formatar = ATRIBUTOS[chave]?.formatar;
  if (formatar && typeof valor === "number") return formatar(valor);
  if (typeof valor === "number") return valor.toLocaleString("pt-BR");
  return String(valor);
}

// Nome da feição para usar como título (município, ponto, rio...)
export function tituloDaFeicao(atributos, padrao = "Feição") {
  return (
    atributos.NM_MUN || atributos.NOME || atributos.nome || atributos.name || atributos.Camada || padrao
  );
}
