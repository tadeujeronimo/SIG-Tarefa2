import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Página não encontrada | Municípios do Ceará",
};

export default function NotFound() {
  return (
    <main className={styles.container}>
      <header className={styles.cabecalho}>
        <h1>Página não encontrada</h1>
        <p>O endereço que você abriu não existe neste aplicativo.</p>
      </header>
      <Link href="/" className={styles.link}>
        Voltar ao mapa
      </Link>
    </main>
  );
}
