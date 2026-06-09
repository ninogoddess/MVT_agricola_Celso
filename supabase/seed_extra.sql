-- Nuevos cultivos y variedades enfocados en Chile y Latinoamérica

INSERT INTO crop_parameters (species, variety, temp_min_germinacion, temp_max_germinacion, temp_optima_min, temp_optima_max, dias_a_cosecha, hemisferio_sur_meses_siembra, hemisferio_norte_meses_siembra, ventana_poda_meses, calendario_fertilizacion, humedad_suelo_optima_min, humedad_suelo_optima_max, notes) VALUES

-- NUEVAS VARIEDADES DE FRUTALES EXISTENTES
('palta', 'edranol', 15, 35, 20, 28, 300, '{9,10,11}', '{3,4,5}', '{3,4}', '[{"dap":60,"tipo":"N"},{"dap":120,"tipo":"NPK"},{"dap":240,"tipo":"K"}]', 50, 75, 'Palta Edranol. Piel verde, muy buena calidad. Polinizante ideal de Hass.'),
('palta', 'negra de la cruz', 14, 34, 18, 28, 300, '{9,10,11}', '{3,4,5}', '{3,4}', '[{"dap":60,"tipo":"N"},{"dap":120,"tipo":"NPK"},{"dap":240,"tipo":"K"}]', 50, 75, 'Palta Negra de la Cruz (Chilena). Más resistente al frío, de cáscara negra y lisa.'),
('uva', 'carmenere', 10, 35, 18, 28, 190, '{8,9}', '{2,3}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":75,"tipo":"NPK"},{"dap":120,"tipo":"K"}]', 35, 65, 'Cepa emblemática chilena. Maduración muy tardía.'),
('uva', 'cabernet sauvignon', 10, 35, 18, 28, 180, '{8,9}', '{2,3}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":75,"tipo":"NPK"},{"dap":120,"tipo":"K"}]', 35, 65, 'Cabernet Sauvignon. Clásico tinto de los valles de Chile.'),
('cereza', 'santina', 5, 30, 12, 22, 75, '{7,8}', '{1,2}', '{6,7}', '[{"dap":20,"tipo":"N"},{"dap":50,"tipo":"NPK"}]', 50, 70, 'Cereza Santina. Variedad temprana, requiere menos horas frío.'),

-- NUEVAS VARIEDADES DE HORTALIZAS EXISTENTES
('tomate', 'limachino', 12, 35, 20, 28, 110, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":15,"tipo":"N"},{"dap":30,"tipo":"NPK"},{"dap":60,"tipo":"K"}]', 60, 80, 'Tomate rosado tradicional de Limache. Muy sabroso, corta postcosecha.'),
('tomate', 'cherry', 12, 35, 20, 28, 80, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":15,"tipo":"N"},{"dap":30,"tipo":"NPK"},{"dap":60,"tipo":"K"}]', 60, 80, 'Tomate cherry. Crecimiento indeterminado, ideal para consumo en fresco.'),
('papa', 'karu', 8, 30, 15, 22, 110, '{8,9,10}', '{2,3,4}', NULL, '[{"dap":20,"tipo":"N"},{"dap":45,"tipo":"NPK"},{"dap":70,"tipo":"K"}]', 60, 80, 'Papa Karu-INIA. Rendimiento alto, excelente para puré y freír.'),
('poroto', 'granado', 12, 30, 18, 25, 90, '{10,11}', '{4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"NPK"}]', 55, 75, 'Poroto para desgranar. Indispensable para los porotos granados chilenos.'),
('poroto', 'verde', 12, 30, 18, 25, 60, '{10,11}', '{4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"NPK"}]', 55, 75, 'Poroto verde, de vaina tierna para ensaladas y guisos.'),
('choclo', 'pastelero', 12, 35, 20, 30, 110, '{10,11}', '{4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"N"},{"dap":60,"tipo":"NPK"}]', 60, 80, 'Choclo humeño o pastelero. Grano grande y lechoso para pastel de choclo.'),

-- NUEVOS CULTIVOS (FRUTALES Y CÍTRICOS)
('limón', 'sutil', 14, 35, 20, 30, 180, '{8,9,10}', '{2,3,4}', '{8,9}', '[{"dap":60,"tipo":"N"},{"dap":120,"tipo":"NPK"},{"dap":240,"tipo":"K"}]', 50, 75, 'Limón sutil o de Pica. Pequeño, muy aromático, clásico para el Pisco Sour.'),
('limón', 'eureka', 12, 35, 18, 28, 200, '{8,9,10}', '{2,3,4}', '{8,9}', '[{"dap":60,"tipo":"N"},{"dap":120,"tipo":"NPK"},{"dap":240,"tipo":"K"}]', 50, 75, 'Limón Eureka o de año. Buena producción casi todo el año.'),
('naranja', 'washington navel', 12, 35, 18, 28, 240, '{8,9,10}', '{2,3,4}', '{8,9}', '[{"dap":60,"tipo":"N"},{"dap":120,"tipo":"NPK"},{"dap":240,"tipo":"K"}]', 50, 75, 'Naranja de ombligo. Sin semilla, muy dulce para invierno.'),
('nuez', 'chandler', 8, 30, 15, 25, 200, '{7,8}', '{1,2}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":90,"tipo":"NPK"},{"dap":150,"tipo":"K"}]', 50, 75, 'Nogal Chandler. El más plantado en Chile, nuez de cáscara clara.'),
('almendra', 'nonpareil', 8, 30, 15, 25, 180, '{7,8}', '{1,2}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":90,"tipo":"NPK"}]', 40, 65, 'Almendro Nonpareil. Variedad de cáscara delgada ("de papel").'),
('frutilla', 'camarosa', 8, 30, 15, 25, 90, '{4,5,6}', '{10,11,12}', NULL, '[{"dap":20,"tipo":"N"},{"dap":45,"tipo":"NPK"},{"dap":70,"tipo":"K"}]', 60, 80, 'Frutilla Camarosa. Muy productiva y de gran tamaño.'),

-- NUEVOS CULTIVOS (HORTALIZAS Y OTROS)
('zapallo', 'italiano', 14, 35, 18, 28, 60, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"NPK"}]', 60, 80, 'Zapallo italiano (Zucchini). De rápido crecimiento y gran rendimiento.'),
('melón', 'tuna', 15, 35, 22, 32, 110, '{9,10}', '{3,4}', NULL, '[{"dap":20,"tipo":"N"},{"dap":45,"tipo":"NPK"},{"dap":75,"tipo":"K"}]', 50, 70, 'Melón Tuna. Cáscara lisa verde claro, pulpa verde/blanca, extremadamente dulce.'),
('melón', 'calameño', 15, 35, 22, 32, 100, '{9,10}', '{3,4}', NULL, '[{"dap":20,"tipo":"N"},{"dap":45,"tipo":"NPK"},{"dap":75,"tipo":"K"}]', 50, 70, 'Melón Calameño (escrito). Pulpa anaranjada, aromático, infaltable en verano con vino.'),
('sandía', 'klondike', 15, 35, 22, 32, 120, '{9,10}', '{3,4}', NULL, '[{"dap":20,"tipo":"N"},{"dap":45,"tipo":"NPK"},{"dap":75,"tipo":"K"}]', 50, 70, 'Sandía rayada alargada, clásica de Paine y zonas centrales.'),
('ají', 'putamadre', 15, 35, 20, 30, 100, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":15,"tipo":"N"},{"dap":35,"tipo":"NPK"},{"dap":65,"tipo":"K"}]', 55, 75, 'Ají "putamadre". Variedad muy pequeña pero extremadamente picante.'),
('cilantro', NULL, 5, 25, 10, 20, 45, '{3,4,5,8,9,10}', '{9,10,11,2,3,4}', NULL, '[{"dap":15,"tipo":"N"}]', 60, 80, 'Cilantro. Esencial para el pebre. Ciclo corto, florece rápido con calor.'),
('perejil', NULL, 5, 25, 10, 20, 60, '{3,4,5,8,9,10}', '{9,10,11,2,3,4}', NULL, '[{"dap":20,"tipo":"N"}]', 60, 80, 'Perejil liso o crespo. Resistente, rebrota después del corte.');
