alter table public.products add column if not exists code text;
create unique index if not exists products_code_key on public.products(code) where code is not null;
alter table public.products alter column price drop not null;

insert into public.products (code,name,brand,price,category,description,image_url,active,stock,on_sale,sale_price,featured)
values
('TLA-001','Cremas para manos CEO y Paris Meet','CEO / Paris Meet',70,'Cuidado corporal','Cremas para manos en tubos compactos, prácticas para llevar y aplicar durante el día.','images/images/WhatsApp Image 2026-08-04 at 15.43.04.jpeg',true,1,false,null,false),
('TLA-002','Nerds Rainbow','Nerds',75,'Dulces y snacks','Caramelos pequeños y crujientes con sabores frutales variados en una caja práctica.',null,true,1,false,null,false),
('TLA-003','Sour Patch Kids Original','Sour Patch Kids',75,'Dulces y snacks','Gomitas con mezcla de sabores frutales y el característico contraste ácido-dulce.',null,true,1,false,null,false),
('TLA-004','Lemonhead','Lemonhead',75,'Dulces y snacks','Caramelos con intenso sabor a limón y perfil cítrico en presentación de caja.',null,true,1,false,null,false),
('TLA-005','SweeTarts Original','SweeTarts',75,'Dulces y snacks','Caramelos comprimidos con sabores frutales y un toque ácido.',null,true,1,false,null,false),
('TLA-006','Jabón espumoso Pumpkin Pecan Waffles','Bath & Body Works',80,'Cuidado corporal','Jabón espumoso para manos con dispensador, ideal para baño o tocador.','images/images/WhatsApp Image 2026-08-04 at 15.43.05 (2).jpeg',true,1,false,null,false),
('TLA-007','Lápices de colores, 12 piezas','Crayola',80,'Papelería','Set de doce lápices de colores para dibujo, tareas y actividades creativas.','images/images/WhatsApp Image 2026-08-04 at 15.43.06 (1).jpeg',true,1,false,null,false),
('TLA-008','Vanish Foundation Stick','Hourglass',80,'Maquillaje','Base de maquillaje en barra de formato compacto para una aplicación práctica.','images/images/WhatsApp Image 2026-08-04 at 15.43.06.jpeg',true,1,false,null,false),
('TLA-009','Peelez sabor sandía','Peelez',80,'Dulces y snacks','Dulce masticable con presentación inspirada en rebanadas de sandía.','images/images/WhatsApp Image 2026-08-04 at 15.43.07 (1).jpeg',true,1,false,null,false),
('TLA-010','Swedish Fish Tails','Swedish Fish',80,'Dulces y snacks','Gomitas suaves con forma de pez y combinación de dos sabores en cada pieza.','images/images/WhatsApp Image 2026-08-04 at 15.43.10 (1).jpeg',true,1,false,null,false),
('TLA-011','Hi-Chew Fantasy Mix','Hi-Chew',80,'Dulces y snacks','Caramelos masticables de textura suave con una selección de sabores frutales.','images/images/WhatsApp Image 2026-08-04 at 15.43.10.jpeg',true,1,false,null,false),
('TLA-012','Sour Patch Kids Grape','Sour Patch Kids',80,'Dulces y snacks','Gomitas sabor uva con contraste ácido y dulce en bolsa para compartir.','images/images/WhatsApp Image 2026-08-04 at 15.43.11.jpeg',true,1,false,null,false),
('TLA-013','Lucky Charms tamaño familiar','Lucky Charms',80,'Dulces y snacks','Cereal con piezas crujientes y malvaviscos de colores en presentación familiar.','images/images/WhatsApp Image 2026-08-04 at 15.43.13 (4).jpeg',true,1,false,null,false),
('TLA-014','Froot Loops / Cocoa Pebbles en vaso','Kellogg’s / Post',80,'Dulces y snacks','Cereales en presentación individual de vaso, prácticos para una porción rápida.','images/images/WhatsApp Image 2026-08-04 at 15.43.13.jpeg',true,1,false,null,false),
('TLA-015','Marcadores Fine Line, 10 colores','Crayola',90,'Papelería','Marcadores de punta fina para escritura, dibujo y actividades escolares.','images/images/WhatsApp Image 2026-08-04 at 15.43.07.jpeg',true,1,false,null,false),
('TLA-016','Sour Punch Bites Banana','Sour Punch',90,'Dulces y snacks','Bocados de caramelo suave con cubierta ácida y sabor a plátano.','images/images/WhatsApp Image 2026-08-04 at 15.45.56 (1).jpeg',true,1,false,null,false),
('TLA-017','Blow Pop Minis','Charms',90,'Dulces y snacks','Mini paletas de sabores surtidos, prácticas para compartir o regalar.','images/images/WhatsApp Image 2026-08-04 at 15.45.56.jpeg',true,1,false,null,false),
('TLA-018','Laffy Taffy surtidos','Laffy Taffy',90,'Dulces y snacks','Caramelos masticables en distintos sabores frutales y empaque individual.','images/images/WhatsApp Image 2026-08-04 at 15.45.57 (1).jpeg',true,1,false,null,false),
('TLA-019','Skittles Gummies','Skittles',90,'Dulces y snacks','Gomitas suaves inspiradas en los sabores frutales de Skittles.','images/images/WhatsApp Image 2026-08-04 at 15.45.57.jpeg',true,1,false,null,false),
('TLA-020','Swedish Fish Mini Tropical','Swedish Fish',90,'Dulces y snacks','Gomitas pequeñas con forma de pez y mezcla de sabores tropicales.','images/images/WhatsApp Image 2026-08-04 at 15.45.58 (1).jpeg',true,1,false,null,false),
('TLA-021','Smarties Original','Smarties',90,'Dulces y snacks','Caramelos comprimidos de sabores frutales en presentación clásica.','images/images/WhatsApp Image 2026-08-04 at 15.45.58 (2).jpeg',true,1,false,null,false),
('TLA-022','Goobers','Goobers',90,'Dulces y snacks','Cacahuates cubiertos de chocolate en caja cómoda para disfrutar como snack.','images/images/WhatsApp Image 2026-08-04 at 15.45.58 (3).jpeg',true,1,false,null,false),
('TLA-023','Krabby Patties Watermelon','Krabby Patties',90,'Dulces y snacks','Gomitas con forma de mini hamburguesa y sabor sandía.','images/images/WhatsApp Image 2026-08-04 at 15.45.58 (4).jpeg',true,1,false,null,false),
('TLA-024','Nerds Gummy Clusters Rainbow','Nerds',90,'Dulces y snacks','Centros suaves de gomita cubiertos con pequeños caramelos crujientes.','images/images/WhatsApp Image 2026-08-04 at 15.45.58.jpeg',true,1,false,null,false),
('TLA-025','Mascarillas Madagascar Centella','Madagascar Centella',100,'Skincare','Mascarillas faciales individuales para complementar una rutina de cuidado personal.','images/images/WhatsApp Image 2026-08-04 at 15.43.05 (1).jpeg',true,1,false,null,false),
('TLA-026','Mike and Ike Mega Mix','Mike and Ike',120,'Dulces y snacks','Caramelos masticables con amplia mezcla de sabores frutales en caja.',null,true,1,false,null,false),
('TLA-027','Hot Tamales Tropical Heat','Hot Tamales',120,'Dulces y snacks','Caramelos masticables con mezcla tropical y perfil de sabor intenso.',null,true,1,false,null,false),
('TLA-028','Tarte Maneater Mini','Tarte',170,'Maquillaje','Máscara de pestañas en formato mini, práctica para llevar y usar en retoques.','images/images/WhatsApp Image 2026-08-04 at 15.43.05.jpeg',true,1,false,null,false),
('TLA-029','Organizador para cosméticos y accesorios','',200,'Accesorios','Organizador con compartimentos para maquillaje, brochas y accesorios pequeños.','images/images/WhatsApp Image 2026-08-04 at 15.43.13 (1).jpeg',true,1,false,null,false),
('TLA-030','Patrick Ta Double-Take Blush Duo','Patrick Ta',555,'Maquillaje','Dúo de rubor con dos presentaciones complementarias para añadir color y dimensión.','images/images/WhatsApp Image 2026-08-04 at 15.43.13 (2).jpeg',true,1,false,null,false),
('TLA-031','Dior Backstage Airflash Mist','Dior',920,'Maquillaje','Bruma para complementar y refrescar el acabado del maquillaje.','images/images/WhatsApp Image 2026-08-04 at 15.43.05 (3).jpeg',true,1,false,null,false),
('TLA-032','Trolli Sour Brite Crawlers Very Berry','Trolli',null,'Dulces y snacks','Gomitas ácidas en forma de gusano con mezcla de sabores de frutos rojos.',null,true,1,false,null,false),
('TLA-033','Mamba Fruit Chews','Mamba',null,'Dulces y snacks','Caramelos masticables de sabores frutales en piezas individuales.',null,true,1,false,null,false),
('TLA-034','Sour Punch Bites Tropical Blends','Sour Punch',null,'Dulces y snacks','Bocados suaves con cubierta ácida y combinación de sabores tropicales.',null,true,1,false,null,false)
on conflict (code) do update set
name=excluded.name,brand=excluded.brand,price=excluded.price,category=excluded.category,description=excluded.description,image_url=excluded.image_url,active=excluded.active,updated_at=now();