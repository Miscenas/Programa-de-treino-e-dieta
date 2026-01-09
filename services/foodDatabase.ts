
import { FoodItem } from '../types';

export const foodDatabase: FoodItem[] = [
  // --- Básico Brasileiro ---
  { id: '1', name: 'Arroz Branco (Cozido)', calories: 130, protein: 2.5, carbs: 28, fats: 0.2, portion: '100g (4 colheres sopa)', category: 'meal' },
  { id: '2', name: 'Feijão Carioca (Cozido)', calories: 76, protein: 4.8, carbs: 13.6, fats: 0.5, portion: '1 concha média', category: 'meal' },
  { id: '3', name: 'Peito de Frango Grelhado', calories: 165, protein: 31, carbs: 0, fats: 3.6, portion: '100g (1 filé médio)', category: 'meal' },
  { id: '4', name: 'Ovo Cozido/Mexido', calories: 70, protein: 6, carbs: 0.5, fats: 5, portion: '1 unidade grande', category: 'meal' },
  { id: '5', name: 'Carne Moída (Patinho)', calories: 220, protein: 30, carbs: 0, fats: 10, portion: '100g', category: 'meal' },
  
  // --- Café da Manhã ---
  { id: '6', name: 'Pão Francês', calories: 135, protein: 4, carbs: 28, fats: 0, portion: '1 unidade', category: 'snack' },
  { id: '7', name: 'Pão de Forma Integral', calories: 60, protein: 3, carbs: 11, fats: 1, portion: '1 fatia', category: 'snack' },
  { id: '8', name: 'Queijo Minas Frescal', calories: 75, protein: 5, carbs: 1, fats: 6, portion: '1 fatia média (30g)', category: 'snack' },
  { id: '9', name: 'Requeijão Light', calories: 45, protein: 3, carbs: 1, fats: 3, portion: '1 colher sopa', category: 'snack' },
  { id: '10', name: 'Tapioca (Goma)', calories: 85, protein: 0, carbs: 21, fats: 0, portion: '2 colheres sopa (35g)', category: 'snack' },
  { id: '11', name: 'Cuscuz de Milho (Cozido)', calories: 110, protein: 2, carbs: 23, fats: 0.5, portion: '100g', category: 'snack' },

  // --- Frutas & Outros ---
  { id: '12', name: 'Banana Prata', calories: 70, protein: 1, carbs: 18, fats: 0, portion: '1 unidade média', category: 'snack' },
  { id: '13', name: 'Maçã', calories: 60, protein: 0, carbs: 15, fats: 0, portion: '1 unidade média', category: 'snack' },
  { id: '14', name: 'Iogurte Natural', calories: 60, protein: 4, carbs: 5, fats: 3, portion: '1 pote (100g)', category: 'snack' },
  { id: '15', name: 'Whey Protein (Dose)', calories: 120, protein: 24, carbs: 3, fats: 1, portion: '1 scoop (30g)', category: 'drink' },

  // --- "Lixo" / Substituições Livres ---
  { id: '16', name: 'Pizza (Mussarela)', calories: 280, protein: 12, carbs: 30, fats: 12, portion: '1 fatia média', category: 'junk' },
  { id: '17', name: 'Pizza (Calabresa)', calories: 320, protein: 14, carbs: 28, fats: 16, portion: '1 fatia média', category: 'junk' },
  { id: '18', name: 'Hambúrguer (Simples)', calories: 450, protein: 25, carbs: 35, fats: 22, portion: '1 unidade (Fast Food)', category: 'junk' },
  { id: '19', name: 'Batata Frita', calories: 300, protein: 3, carbs: 40, fats: 15, portion: '1 porção média', category: 'junk' },
  { id: '20', name: 'Cerveja (Lata)', calories: 150, protein: 1, carbs: 12, fats: 0, portion: '1 lata (350ml)', category: 'drink' },
  { id: '21', name: 'Refrigerante (Lata)', calories: 140, protein: 0, carbs: 35, fats: 0, portion: '1 lata (350ml)', category: 'drink' },
  { id: '22', name: 'Chocolate (Barra)', calories: 130, protein: 2, carbs: 15, fats: 8, portion: '4 quadradinhos (25g)', category: 'junk' },
  { id: '23', name: 'Açaí com Granola', calories: 350, protein: 4, carbs: 50, fats: 12, portion: '1 copo pequeno (200ml)', category: 'junk' },
  { id: '24', name: 'Salgado (Coxinha/Pastel)', calories: 300, protein: 8, carbs: 30, fats: 16, portion: '1 unidade média', category: 'junk' }
];
