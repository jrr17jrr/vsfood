-- VSFood / Dudu Burger
-- Atualiza as URLs de imagens da demo para o domínio images.unsplash.com.
-- Requer o next.config.ts deste pacote (remotePatterns para images.unsplash.com).

UPDATE products
SET image_url = CASE name
  WHEN 'Dudu Clássico' THEN 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Dudu Bacon' THEN 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Dudu Duplo' THEN 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Dudu Monstro' THEN 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Dudu Chicken' THEN 'https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Combo Dudu Clássico' THEN 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Combo Dudu Duplo' THEN 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Combo Casal Dudu' THEN 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Batata Frita' THEN 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Batata Cheddar & Bacon' THEN 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Onion Rings' THEN 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Coca-Cola Lata 350ml' THEN 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Guaraná Lata 350ml' THEN 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Água Mineral' THEN 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Brownie com Chocolate' THEN 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=85'
  WHEN 'Milk-shake de Chocolate' THEN 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=85'
  ELSE image_url
END
WHERE restaurant_id = (
  SELECT id FROM restaurants WHERE slug = 'dudu-burguer' LIMIT 1
);
