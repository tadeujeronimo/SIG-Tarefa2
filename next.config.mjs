/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // O Next 16 bloqueia, em desenvolvimento (npm run dev), qualquer acesso que não
  // venha de "localhost". Sem esta lista, abrir http://IP_DO_COMPUTADOR:3000 no
  // celular deixa a página parada em "Carregando o mapa...", porque o JavaScript
  // do mapa nunca é liberado. Aqui liberamos as faixas de IP de redes locais.
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;
