// app/(tabs)/recentes.tsx  ->  últimas receitas geradas (rota "/recentes")

import { ListaReceitas } from "@/components/ListaReceitas";
import { useReceitas } from "@/context/ReceitasContext";

export default function Recentes() {
  const { receitas } = useReceitas();

  return (
    <ListaReceitas
      receitas={receitas.slice(0, 20)} // a lista já vem da mais nova para a mais antiga
      vazioTitulo="Nada por aqui ainda"
      vazioTexto="As receitas que você buscar na aba Início aparecem aqui."
    />
  );
}
