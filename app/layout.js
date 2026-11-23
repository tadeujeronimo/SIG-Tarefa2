import "./globals.css";

export const metadata = {
  title: "Municípios do Ceará | SIG Web",
  description: "Mapa vetorial dos municípios do Ceará (IBGE) com tabela de atributos.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Define o tema antes da primeira pintura: usa a escolha salva ou a preferência do sistema
const scriptTema = `try{var t=localStorage.getItem("tema");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
