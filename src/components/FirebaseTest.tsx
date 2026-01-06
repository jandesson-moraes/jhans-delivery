import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, DocumentData } from 'firebase/firestore';

// 1. Definimos a interface do nosso dado (O poder do TypeScript)
interface Item {
  id: string;
  nome: string;
  valor: number;
}

export function FirebaseTest() {
  const [items, setItems] = useState<Item[]>([]);
  const [novoNome, setNovoNome] = useState('');

  // Referência à coleção no Firestore
  const itemsCollectionRef = collection(db, "teste_items");

  // Função para buscar dados
  const getItems = async () => {
    try {
      const data = await getDocs(itemsCollectionRef);
      // Mapeamos os dados retornados garantindo a tipagem
      const cleanData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Item[];
      
      setItems(cleanData);
    } catch (err) {
      console.error("Erro ao buscar itens:", err);
    }
  };

  // Função para adicionar dado
  const criarItem = async () => {
    try {
      await addDoc(itemsCollectionRef, {
        nome: novoNome,
        valor: 100, // Exemplo fixo
      });
      getItems(); // Atualiza a lista após criar
    } catch (err) {
      console.error("Erro ao criar item:", err);
    }
  };

  useEffect(() => {
    getItems();
  }, []);

  return (
    <div>
      <h2>Integração Firebase + TS</h2>
      
      <input 
        placeholder="Nome do item..." 
        onChange={(e) => setNovoNome(e.target.value)} 
      />
      <button onClick={criarItem}>Enviar para o Banco</button>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.nome} - R$ {item.valor}
          </li>
        ))}
      </ul>
    </div>
  );
}