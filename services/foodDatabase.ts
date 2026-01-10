
import { FoodItem } from '../types';

export const foodDatabase: FoodItem[] = [
  // --- CARBOIDRATOS (Base) ---
  { id: '1', name: 'Arroz Branco (Cozido)', calories: 130, protein: 2.5, carbs: 28, fats: 0.2, portion: '100g (4 colheres sopa)', category: 'meal' },
  { id: '25', name: 'Arroz Integral (Cozido)', calories: 110, protein: 3, carbs: 23, fats: 1, portion: '100g (4 colheres sopa)', category: 'meal' },
  { id: '26', name: 'Batata Inglesa (Cozida)', calories: 85, protein: 2, carbs: 20, fats: 0, portion: '100g', category: 'meal' },
  { id: '27', name: 'Batata Doce (Cozida)', calories: 86, protein: 1.6, carbs: 20, fats: 0.1, portion: '100g', category: 'meal' },
  { id: '28', name: 'Mandioca / Aipim (Cozida)', calories: 160, protein: 1.4, carbs: 38, fats: 0.3, portion: '100g', category: 'meal' },
  { id: '29', name: 'Mandioquinha / Batata Baroa', calories: 80, protein: 1, carbs: 19, fats: 0, portion: '100g', category: 'meal' },
  { id: '30', name: 'Inhame (Cozido)', calories: 118, protein: 1.5, carbs: 28, fats: 0.2, portion: '100g', category: 'meal' },
  { id: '31', name: 'Macarrão (Cozido)', calories: 157, protein: 5.8, carbs: 30, fats: 0.9, portion: '100g', category: 'meal' },
  { id: '32', name: 'Macarrão Integral (Cozido)', calories: 124, protein: 5.3, carbs: 26, fats: 0.5, portion: '100g', category: 'meal' },
  { id: '33', name: 'Angu / Polenta (Cozida)', calories: 70, protein: 1.5, carbs: 15, fats: 0.5, portion: '100g', category: 'meal' },
  { id: '34', name: 'Milho Verde (Cozido)', calories: 98, protein: 3.2, carbs: 21, fats: 1.2, portion: '100g', category: 'meal' },
  { id: '35', name: 'Aveia em Flocos', calories: 360, protein: 14, carbs: 55, fats: 7, portion: '100g', category: 'snack' },
  { id: '36', name: 'Aveia (Colher)', calories: 54, protein: 2, carbs: 8, fats: 1, portion: '1 colher sopa (15g)', category: 'snack' },
  { id: '11', name: 'Cuscuz de Milho (Cozido)', calories: 110, protein: 2, carbs: 23, fats: 0.5, portion: '100g', category: 'snack' },
  { id: '10', name: 'Tapioca (Goma)', calories: 85, protein: 0, carbs: 21, fats: 0, portion: '2 colheres sopa (35g)', category: 'snack' },
  { id: '6', name: 'Pão Francês', calories: 135, protein: 4, carbs: 28, fats: 0, portion: '1 unidade', category: 'snack' },
  { id: '7', name: 'Pão de Forma Integral', calories: 60, protein: 3, carbs: 11, fats: 1, portion: '1 fatia', category: 'snack' },
  { id: '37', name: 'Pão de Forma Tradicional', calories: 75, protein: 2.5, carbs: 14, fats: 1, portion: '1 fatia', category: 'snack' },
  { id: '38', name: 'Rap10 / Tortilha (Integral)', calories: 120, protein: 3, carbs: 20, fats: 3, portion: '1 unidade', category: 'snack' },

  // --- LEGUMINOSAS (Feijões) ---
  { id: '2', name: 'Feijão Carioca (Cozido)', calories: 76, protein: 4.8, carbs: 13.6, fats: 0.5, portion: '1 concha média', category: 'meal' },
  { id: '39', name: 'Feijão Preto (Cozido)', calories: 77, protein: 4.5, carbs: 14, fats: 0.5, portion: '1 concha média', category: 'meal' },
  { id: '40', name: 'Lentilha (Cozida)', calories: 116, protein: 9, carbs: 20, fats: 0.4, portion: '100g', category: 'meal' },
  { id: '41', name: 'Grão de Bico (Cozido)', calories: 164, protein: 9, carbs: 27, fats: 2.6, portion: '100g', category: 'meal' },
  { id: '42', name: 'Ervilha (Cozida)', calories: 80, protein: 5, carbs: 14, fats: 0.4, portion: '100g', category: 'meal' },

  // --- PROTEÍNAS (Carnes e Ovos) ---
  { id: '3', name: 'Peito de Frango Grelhado', calories: 165, protein: 31, carbs: 0, fats: 3.6, portion: '100g', category: 'meal' },
  { id: '43', name: 'Sobrecoxa de Frango (Assada/Sem pele)', calories: 230, protein: 24, carbs: 0, fats: 14, portion: '100g', category: 'meal' },
  { id: '44', name: 'Filé Mignon (Grelhado)', calories: 220, protein: 32, carbs: 0, fats: 9, portion: '100g', category: 'meal' },
  { id: '5', name: 'Carne Moída (Patinho)', calories: 220, protein: 30, carbs: 0, fats: 10, portion: '100g', category: 'meal' },
  { id: '45', name: 'Acém Moído (Refogado)', calories: 250, protein: 26, carbs: 0, fats: 15, portion: '100g', category: 'meal' },
  { id: '46', name: 'Alcatra (Grelhada)', calories: 240, protein: 30, carbs: 0, fats: 12, portion: '100g', category: 'meal' },
  { id: '47', name: 'Tilápia (Grelhada)', calories: 120, protein: 26, carbs: 0, fats: 1.7, portion: '100g', category: 'meal' },
  { id: '48', name: 'Salmão (Grelhado)', calories: 230, protein: 25, carbs: 0, fats: 14, portion: '100g', category: 'meal' },
  { id: '49', name: 'Atum em Lata (Água)', calories: 116, protein: 25, carbs: 0, fats: 1, portion: '1 lata drenada (120g)', category: 'meal' },
  { id: '50', name: 'Sardinha em Lata (Óleo)', calories: 210, protein: 24, carbs: 0, fats: 12, portion: '1 lata', category: 'meal' },
  { id: '4', name: 'Ovo Cozido/Mexido', calories: 70, protein: 6, carbs: 0.5, fats: 5, portion: '1 unidade grande', category: 'meal' },
  { id: '51', name: 'Clara de Ovo', calories: 17, protein: 3.6, carbs: 0, fats: 0, portion: '1 unidade', category: 'meal' },
  { id: '52', name: 'Lombo Suíno (Assado)', calories: 210, protein: 30, carbs: 0, fats: 9, portion: '100g', category: 'meal' },
  { id: '53', name: 'Camarão (Cozido)', calories: 100, protein: 24, carbs: 0, fats: 0.3, portion: '100g', category: 'meal' },

  // --- HORTALIÇAS E LEGUMES ---
  { id: '54', name: 'Alface / Folhas Verdes', calories: 15, protein: 1, carbs: 3, fats: 0, portion: 'Prato Cheio', category: 'meal' },
  { id: '55', name: 'Brócolis (Cozido)', calories: 35, protein: 2.8, carbs: 7, fats: 0.4, portion: '100g', category: 'meal' },
  { id: '56', name: 'Cenoura (Crua)', calories: 41, protein: 1, carbs: 10, fats: 0.2, portion: '100g', category: 'meal' },
  { id: '57', name: 'Cenoura (Cozida)', calories: 30, protein: 0.8, carbs: 7, fats: 0.2, portion: '100g', category: 'meal' },
  { id: '58', name: 'Beterraba (Cozida)', calories: 44, protein: 1.7, carbs: 10, fats: 0.2, portion: '100g', category: 'meal' },
  { id: '59', name: 'Abobrinha (Refogada)', calories: 30, protein: 1, carbs: 6, fats: 0.5, portion: '100g', category: 'meal' },
  { id: '60', name: 'Abóbora Cabotiá (Assada)', calories: 40, protein: 1, carbs: 10, fats: 0.1, portion: '100g', category: 'meal' },
  { id: '61', name: 'Tomate', calories: 18, protein: 1, carbs: 4, fats: 0.2, portion: '1 unidade média', category: 'meal' },
  { id: '62', name: 'Pepino', calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, portion: '100g', category: 'meal' },
  { id: '63', name: 'Couve-Flor (Cozida)', calories: 25, protein: 2, carbs: 5, fats: 0.3, portion: '100g', category: 'meal' },
  { id: '64', name: 'Espinafre (Refogado)', calories: 23, protein: 3, carbs: 3.6, fats: 0.4, portion: '1 colher servir', category: 'meal' },

  // --- FRUTAS ---
  { id: '12', name: 'Banana Prata', calories: 70, protein: 1, carbs: 18, fats: 0, portion: '1 unidade média', category: 'snack' },
  { id: '65', name: 'Banana Nanica', calories: 90, protein: 1.5, carbs: 24, fats: 0.3, portion: '1 unidade média', category: 'snack' },
  { id: '13', name: 'Maçã', calories: 60, protein: 0, carbs: 15, fats: 0, portion: '1 unidade média', category: 'snack' },
  { id: '66', name: 'Mamão Papaia', calories: 45, protein: 0.5, carbs: 11, fats: 0.1, portion: '1/2 unidade pequena', category: 'snack' },
  { id: '67', name: 'Abacaxi', calories: 50, protein: 0.5, carbs: 13, fats: 0.1, portion: '1 fatia média', category: 'snack' },
  { id: '68', name: 'Morango', calories: 30, protein: 0.7, carbs: 7, fats: 0.3, portion: '5 unidades grandes', category: 'snack' },
  { id: '69', name: 'Melancia', calories: 30, protein: 0.6, carbs: 8, fats: 0.2, portion: '1 fatia média', category: 'snack' },
  { id: '70', name: 'Melão', calories: 34, protein: 0.8, carbs: 8, fats: 0.3, portion: '1 fatia média', category: 'snack' },
  { id: '71', name: 'Laranja', calories: 65, protein: 1, carbs: 16, fats: 0.2, portion: '1 unidade', category: 'snack' },
  { id: '72', name: 'Manga (Palmer)', calories: 70, protein: 0.5, carbs: 17, fats: 0.2, portion: '100g', category: 'snack' },
  { id: '73', name: 'Uva', calories: 70, protein: 0.7, carbs: 18, fats: 0.2, portion: '1 xícara pequena (100g)', category: 'snack' },
  { id: '74', name: 'Abacate', calories: 160, protein: 2, carbs: 9, fats: 15, portion: '100g (3 colheres)', category: 'snack' },
  { id: '75', name: 'Coco Seco', calories: 350, protein: 3, carbs: 15, fats: 33, portion: '100g', category: 'snack' },

  // --- LATICÍNIOS E DERIVADOS ---
  { id: '76', name: 'Leite Integral', calories: 120, protein: 6, carbs: 9, fats: 6, portion: '1 copo (200ml)', category: 'drink' },
  { id: '77', name: 'Leite Desnatado', calories: 70, protein: 6, carbs: 10, fats: 0, portion: '1 copo (200ml)', category: 'drink' },
  { id: '14', name: 'Iogurte Natural', calories: 60, protein: 4, carbs: 5, fats: 3, portion: '1 pote (100g)', category: 'snack' },
  { id: '78', name: 'Iogurte Grego (Natural)', calories: 100, protein: 10, carbs: 4, fats: 5, portion: '1 pote (100g)', category: 'snack' },
  { id: '8', name: 'Queijo Minas Frescal', calories: 75, protein: 5, carbs: 1, fats: 6, portion: '1 fatia média (30g)', category: 'snack' },
  { id: '79', name: 'Queijo Mussarela', calories: 95, protein: 7, carbs: 1, fats: 7, portion: '1 fatia (30g)', category: 'snack' },
  { id: '80', name: 'Queijo Prato', calories: 105, protein: 7, carbs: 0.5, fats: 9, portion: '1 fatia (30g)', category: 'snack' },
  { id: '81', name: 'Queijo Cottage', calories: 30, protein: 3.5, carbs: 1, fats: 1, portion: '1 colher sopa (30g)', category: 'snack' },
  { id: '82', name: 'Ricota', calories: 50, protein: 3, carbs: 1, fats: 4, portion: '1 fatia grossa (30g)', category: 'snack' },
  { id: '9', name: 'Requeijão Light', calories: 45, protein: 3, carbs: 1, fats: 3, portion: '1 colher sopa', category: 'snack' },
  { id: '83', name: 'Manteiga', calories: 74, protein: 0, carbs: 0, fats: 8, portion: '1 ponta faca (10g)', category: 'snack' },

  // --- GORDURAS, CASTANHAS E SUPLEMENTOS ---
  { id: '84', name: 'Azeite de Oliva', calories: 108, protein: 0, carbs: 0, fats: 12, portion: '1 colher sopa (13ml)', category: 'meal' },
  { id: '86', name: 'Castanha do Pará', calories: 27, protein: 0.6, carbs: 0.6, fats: 2.5, portion: '1 unidade', category: 'snack' },
  { id: '87', name: 'Castanha de Caju', calories: 165, protein: 5, carbs: 9, fats: 13, portion: '30g (um punhado)', category: 'snack' },
  { id: '88', name: 'Amendoim (Torrado)', calories: 170, protein: 7, carbs: 6, fats: 15, portion: '30g (um punhado)', category: 'snack' },
  { id: '89', name: 'Pasta de Amendoim', calories: 90, protein: 4, carbs: 3, fats: 8, portion: '1 colher sopa (15g)', category: 'snack' },
  { id: '15', name: 'Whey Protein (Dose)', calories: 120, protein: 24, carbs: 3, fats: 1, portion: '1 scoop (30g)', category: 'drink' },
  { id: '90', name: 'Creatina', calories: 0, protein: 3, carbs: 0, fats: 0, portion: '1 dose (3g)', category: 'drink' }, // Aprox protein

  // --- BEBIDAS ---
  { id: '91', name: 'Café (Sem Açúcar)', calories: 3, protein: 0, carbs: 0.5, fats: 0, portion: '1 xícara', category: 'drink' },
  { id: '92', name: 'Suco de Laranja (Natural)', calories: 120, protein: 2, carbs: 28, fats: 0, portion: '1 copo (250ml)', category: 'drink' },
  { id: '93', name: 'Suco de Uva (Integral)', calories: 140, protein: 1, carbs: 35, fats: 0, portion: '1 copo (250ml)', category: 'drink' },
  { id: '94', name: 'Água de Coco', calories: 45, protein: 0, carbs: 11, fats: 0, portion: '1 copo (200ml)', category: 'drink' },

  // --- "LIXO" / SUBSTITUIÇÕES LIVRES ---
  { id: '16', name: 'Pizza (Mussarela)', calories: 280, protein: 12, carbs: 30, fats: 12, portion: '1 fatia média', category: 'junk' },
  { id: '17', name: 'Pizza (Calabresa)', calories: 320, protein: 14, carbs: 28, fats: 16, portion: '1 fatia média', category: 'junk' },
  { id: '18', name: 'Hambúrguer (Simples)', calories: 450, protein: 25, carbs: 35, fats: 22, portion: '1 unidade (Fast Food)', category: 'junk' },
  { id: '95', name: 'Cheeseburger (Fast Food)', calories: 300, protein: 15, carbs: 30, fats: 12, portion: '1 unidade pequena', category: 'junk' },
  { id: '19', name: 'Batata Frita', calories: 300, protein: 3, carbs: 40, fats: 15, portion: '1 porção média', category: 'junk' },
  { id: '20', name: 'Cerveja (Lata)', calories: 150, protein: 1, carbs: 12, fats: 0, portion: '1 lata (350ml)', category: 'drink' },
  { id: '21', name: 'Refrigerante (Lata)', calories: 140, protein: 0, carbs: 35, fats: 0, portion: '1 lata (350ml)', category: 'drink' },
  { id: '96', name: 'Refrigerante Zero', calories: 0, protein: 0, carbs: 0, fats: 0, portion: '1 lata (350ml)', category: 'drink' },
  { id: '22', name: 'Chocolate (Barra)', calories: 130, protein: 2, carbs: 15, fats: 8, portion: '4 quadradinhos (25g)', category: 'junk' },
  { id: '97', name: 'Bis (Unidade)', calories: 35, protein: 0.5, carbs: 4, fats: 2, portion: '1 unidade', category: 'junk' },
  { id: '98', name: 'Bombom (Sonho de Valsa/Ouro B.)', calories: 115, protein: 1, carbs: 12, fats: 6, portion: '1 unidade', category: 'junk' },
  { id: '23', name: 'Açaí com Granola', calories: 350, protein: 4, carbs: 50, fats: 12, portion: '1 copo pequeno (200ml)', category: 'junk' },
  { id: '99', name: 'Sorvete (Massa)', calories: 110, protein: 2, carbs: 15, fats: 5, portion: '1 bola (60g)', category: 'junk' },
  { id: '24', name: 'Salgado (Coxinha/Pastel)', calories: 300, protein: 8, carbs: 30, fats: 16, portion: '1 unidade média', category: 'junk' },
  { id: '100', name: 'Pão de Queijo', calories: 85, protein: 1.5, carbs: 10, fats: 4, portion: '1 unidade pequena', category: 'snack' }
];
