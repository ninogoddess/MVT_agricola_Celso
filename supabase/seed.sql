-- Seed de crop_parameters: 30 cultivos comunes en Chile/Latam
-- hemisferio_sur_meses_siembra: meses óptimos de siembra en Chile
-- hemisferio_norte_meses_siembra: equivalente para hemisferio norte
-- dias_a_cosecha: días promedio desde siembra hasta cosecha
-- ventana_poda_meses: meses recomendados para poda (frutales)
-- calendario_fertilizacion: [{dap: días_después_plantación, tipo: "N"|"P"|"K"|"NPK"}]

INSERT INTO crop_parameters (species, variety, temp_min_germinacion, temp_max_germinacion, temp_optima_min, temp_optima_max, dias_a_cosecha, hemisferio_sur_meses_siembra, hemisferio_norte_meses_siembra, ventana_poda_meses, calendario_fertilizacion, humedad_suelo_optima_min, humedad_suelo_optima_max, notes) VALUES

-- FRUTALES
('uva', 'mesa', 10, 35, 20, 30, 150, '{8,9,10}', '{2,3,4}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":90,"tipo":"K"}]', 40, 70, 'Uva de mesa. Poda invernal en junio-julio (hemisferio sur).'),
('uva', 'vinífera', 10, 35, 18, 28, 180, '{8,9}', '{2,3}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":75,"tipo":"NPK"},{"dap":120,"tipo":"K"}]', 35, 65, 'Uva vinífera para vinificación. Requiere estrés hídrico controlado.'),
('palta', 'hass', 15, 35, 20, 28, 365, '{9,10,11}', '{3,4,5}', '{3,4}', '[{"dap":60,"tipo":"N"},{"dap":120,"tipo":"NPK"},{"dap":240,"tipo":"K"}]', 50, 75, 'Palta Hass. Sensible a heladas. Cosecha escalonada.'),
('manzana', 'royal gala', 7, 35, 15, 25, 150, '{7,8,9}', '{1,2,3}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":90,"tipo":"K"}]', 50, 75, 'Manzana Royal Gala. Requiere horas frío (>600).'),
('manzana', 'fuji', 7, 35, 15, 25, 170, '{7,8,9}', '{1,2,3}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":100,"tipo":"K"}]', 50, 75, 'Manzana Fuji. Cosecha tardía, requiere >700 horas frío.'),
('cereza', 'lapins', 5, 30, 12, 22, 90, '{7,8}', '{1,2}', '{6,7}', '[{"dap":20,"tipo":"N"},{"dap":50,"tipo":"NPK"},{"dap":70,"tipo":"K"}]', 50, 70, 'Cereza Lapins. Autofértil. Sensible a lluvia en cosecha.'),
('cereza', 'bing', 5, 30, 12, 22, 85, '{7,8}', '{1,2}', '{6,7}', '[{"dap":20,"tipo":"N"},{"dap":50,"tipo":"NPK"},{"dap":70,"tipo":"K"}]', 50, 70, 'Cereza Bing. Requiere polinizador. Alta demanda de horas frío.'),
('arándano', 'duke', 8, 30, 14, 24, 120, '{7,8,9}', '{1,2,3}', '{6,7,8}', '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":90,"tipo":"K"}]', 55, 75, 'Arándano Duke. Temprano. Suelo ácido pH 4.5-5.5.'),
('arándano', 'brigitta', 8, 30, 14, 24, 150, '{7,8,9}', '{1,2,3}', '{6,7,8}', '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":100,"tipo":"K"}]', 55, 75, 'Arándano Brigitta. Tardío. Fruta firme para exportación.'),
('frambuesa', 'heritage', 8, 30, 15, 25, 90, '{7,8}', '{1,2}', '{6,7}', '[{"dap":20,"tipo":"N"},{"dap":50,"tipo":"NPK"}]', 55, 75, 'Frambuesa Heritage. Remontante. Dos cosechas al año.'),
('kiwi', 'hayward', 10, 30, 18, 25, 240, '{9,10}', '{3,4}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":90,"tipo":"NPK"},{"dap":150,"tipo":"K"}]', 60, 80, 'Kiwi Hayward. Dioico, requiere polinizador macho. Sensible a heladas.'),
('durazno', NULL, 8, 35, 15, 28, 130, '{7,8,9}', '{1,2,3}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":90,"tipo":"K"}]', 50, 70, 'Durazno/Nectarín. Requiere >400 horas frío según variedad.'),
('ciruela', 'angeleno', 8, 35, 15, 28, 160, '{7,8,9}', '{1,2,3}', '{6,7}', '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":100,"tipo":"K"}]', 50, 70, 'Ciruela Angeleno. Tardía. Buena postcosecha.'),

-- HORTALIZAS
('tomate', 'determinado', 12, 35, 20, 28, 90, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":15,"tipo":"N"},{"dap":30,"tipo":"NPK"},{"dap":50,"tipo":"K"}]', 60, 80, 'Tomate determinado. Crecimiento compacto, cosecha concentrada.'),
('tomate', 'indeterminado', 12, 35, 20, 28, 120, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":15,"tipo":"N"},{"dap":30,"tipo":"NPK"},{"dap":60,"tipo":"K"},{"dap":90,"tipo":"K"}]', 60, 80, 'Tomate indeterminado. Requiere tutorado. Cosecha escalonada.'),
('lechuga', NULL, 5, 25, 12, 20, 60, '{3,4,5,8,9,10}', '{9,10,11,2,3,4}', NULL, '[{"dap":15,"tipo":"N"},{"dap":30,"tipo":"N"}]', 60, 80, 'Lechuga. Cultivo rápido. Sensible al calor (espiga).'),
('papa', 'désirée', 8, 30, 15, 22, 120, '{8,9,10}', '{2,3,4}', NULL, '[{"dap":20,"tipo":"N"},{"dap":45,"tipo":"NPK"},{"dap":70,"tipo":"K"}]', 60, 80, 'Papa Désirée. Piel roja, pulpa amarilla. Versátil.'),
('cebolla', 'valenciana', 10, 30, 15, 24, 150, '{4,5,6}', '{10,11,12}', NULL, '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":90,"tipo":"K"}]', 50, 70, 'Cebolla valenciana. Día largo. Almacenamiento prolongado.'),
('ajo', 'rosado', 5, 25, 12, 20, 180, '{3,4,5}', '{9,10,11}', NULL, '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":120,"tipo":"K"}]', 50, 65, 'Ajo rosado chileno. Siembra otoñal, cosecha en verano.'),
('zapallo', 'camote', 15, 35, 20, 30, 120, '{10,11}', '{4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":45,"tipo":"NPK"},{"dap":75,"tipo":"K"}]', 55, 75, 'Zapallo camote. Rastrero. Requiere espacio.'),
('pimiento', 'cristal', 15, 35, 20, 28, 90, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":15,"tipo":"N"},{"dap":35,"tipo":"NPK"},{"dap":60,"tipo":"K"}]', 60, 80, 'Pimiento cristal chileno. Dulce, para consumo fresco.'),
('pimiento', 'cacho de cabra', 15, 35, 20, 30, 100, '{9,10,11}', '{3,4,5}', NULL, '[{"dap":15,"tipo":"N"},{"dap":35,"tipo":"NPK"},{"dap":65,"tipo":"K"}]', 55, 75, 'Ají cacho de cabra. Picante medio. Secado tradicional.'),
('choclo', NULL, 12, 35, 20, 30, 90, '{10,11}', '{4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"N"},{"dap":60,"tipo":"NPK"}]', 60, 80, 'Choclo (maíz dulce). Cosecha en estado lechoso.'),
('remolacha', NULL, 8, 28, 15, 22, 75, '{8,9,10,3,4}', '{2,3,4,9,10}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"NPK"}]', 60, 75, 'Remolacha. Tolera frío moderado. Siembra directa.'),
('zanahoria', NULL, 7, 28, 15, 22, 90, '{8,9,10,3,4}', '{2,3,4,9,10}', NULL, '[{"dap":25,"tipo":"N"},{"dap":50,"tipo":"NPK"}]', 60, 75, 'Zanahoria. Suelo suelto y profundo. Siembra directa.'),
('espinaca', NULL, 5, 25, 10, 18, 45, '{3,4,5,8,9}', '{9,10,11,2,3}', NULL, '[{"dap":15,"tipo":"N"},{"dap":30,"tipo":"N"}]', 60, 80, 'Espinaca. Cultivo de clima fresco. Espiga con calor.'),
('acelga', NULL, 7, 30, 12, 22, 60, '{3,4,5,8,9,10}', '{9,10,11,2,3,4}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"NPK"}]', 60, 80, 'Acelga. Muy rústica. Cosecha de hojas continua.'),
('alcachofa', NULL, 8, 28, 14, 20, 180, '{2,3,4}', '{8,9,10}', NULL, '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"NPK"},{"dap":120,"tipo":"K"}]', 55, 75, 'Alcachofa. Perenne. Producción principal en invierno-primavera.'),
('espárrago', NULL, 10, 30, 16, 24, 730, '{7,8,9}', '{1,2,3}', NULL, '[{"dap":30,"tipo":"N"},{"dap":90,"tipo":"NPK"},{"dap":180,"tipo":"NPK"}]', 50, 70, 'Espárrago. Perenne (10+ años). Primera cosecha al 2do año.'),
('poroto', NULL, 12, 30, 18, 25, 80, '{10,11}', '{4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"NPK"}]', 55, 75, 'Poroto (frijol). Leguminosa, fija nitrógeno. Sensible a heladas.'),

-- CEREALES Y OLEAGINOSAS
('trigo', 'pan', 5, 30, 12, 22, 150, '{5,6,7}', '{11,12,1}', NULL, '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"N"},{"dap":90,"tipo":"N"}]', 40, 65, 'Trigo pan. Siembra invernal en Chile central.'),
('maíz', 'grano', 12, 35, 20, 30, 140, '{10,11}', '{4,5}', NULL, '[{"dap":20,"tipo":"N"},{"dap":40,"tipo":"N"},{"dap":60,"tipo":"NPK"}]', 55, 75, 'Maíz grano. Alta demanda de nitrógeno.'),
('avena', NULL, 5, 28, 10, 20, 130, '{4,5,6}', '{10,11,12}', NULL, '[{"dap":25,"tipo":"N"},{"dap":50,"tipo":"N"}]', 40, 65, 'Avena. Tolerante al frío. Doble propósito (grano/forraje).'),
('cebada', NULL, 5, 28, 10, 20, 120, '{5,6}', '{11,12}', NULL, '[{"dap":25,"tipo":"N"},{"dap":50,"tipo":"N"}]', 40, 60, 'Cebada. Cervecera o forrajera. Ciclo corto.'),
('raps', 'canola', 5, 28, 12, 22, 160, '{4,5}', '{10,11}', NULL, '[{"dap":30,"tipo":"N"},{"dap":60,"tipo":"N"},{"dap":90,"tipo":"NPK"}]', 45, 65, 'Raps/Canola. Oleaginosa invernal. Buen cultivo de rotación.');
