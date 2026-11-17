// app/(tabs)/favoritos.tsx  ->  receitas marcadas com coração (rota "/favoritos")

import { ListaReceitas } from "@/components/ListaReceitas";
import { useReceitas } from "@/context/ReceitasContext";

export default function Favoritos() {
  const { receitas } = useReceitas();

  return (
    <ListaReceitas
      receitas={receitas.filter((receita) => receita.favorito)}
      vazioTitulo="Nenhum favorito ainda"
      vazioTexto="Abra uma receita e toque no coração para guardá-la aqui."
    />
  );
}
