# Proyecto de Tesis: Prototipo de Comparación de Precios y Optimización de Compras

## 📝 Contexto del Proyecto
Este proyecto es un Trabajo Final de Grado para Ingeniería Informática. Consiste en una herramienta digital que permite a los usuarios comparar precios de productos en diferentes supermercados y obtener un "Circuito de Compra Óptimo". El sistema utiliza técnicas de **Web Scraping** para la recolección de datos y una arquitectura de **Microservicios/Componentes Desacoplados**.

- **Stack Tecnológico:** Java (Spring Boot), Python (Scraping), React (Frontend), PostgreSQL (DB).
- **Diferenciador:** No solo muestra precios, sino que optimiza el presupuesto dividiendo la lista de compras entre varios establecimientos según el menor costo unitario.

---

## 🎯 Objetivos

### Objetivo General
Diseñar e implementar un prototipo funcional que automatice la comparación de precios de productos de consumo masivo y genere recomendaciones de compra optimizadas para el ahorro del usuario.

### Objetivos Específicos
1. Desarrollar un motor de web scraping en Python capaz de extraer datos de múltiples cadenas de supermercados de forma nocturna.
2. Implementar un backend en Spring Boot que normalice datos heterogéneos y gestione usuarios y listas.
3. Crear un algoritmo de optimización que calcule el circuito de compra más económico para una lista dada.
4. Desarrollar una interfaz de usuario intuitiva en React para la gestión de listas y visualización de ahorros.

---

## 📋 Especificación de Requisitos

### Requisitos Funcionales (RF)
- **RF-01:** Gestión de cuentas de usuario y roles (RBAC).
- **RF-02:** Extracción automatizada nocturna de precios mediante Scraping.
- **RF-03:** Búsqueda y filtrado de productos por nombre, marca y categoría.
- **RF-04:** Comparación de precios unitarios de un mismo producto en distintas tiendas.
- **RF-05:** Gestión de múltiples listas de compras por usuario.
- **RF-06:** Cálculo de presupuesto estimado y circuito de compra optimizado.
- **RF-07:** Historial de precios para visualizar tendencias de aumento/baja.

### Requisitos No Funcionales (RNF)
- **RNF-01:** Escalabilidad para añadir nuevos supermercados sin alterar el core.
- **RNF-02:** Tiempo de respuesta de consultas menor a 3 segundos.
- **RNF-03:** Seguridad de datos mediante JWT y cifrado BCrypt.
- **RNF-04:** Integridad referencial en la base de datos para evitar duplicidad de productos maestros.

---

## 🗄️ Modelo de Datos (DER - 11 Tablas)

El sistema utiliza un modelo relacional normalizado para resolver la heterogeneidad de nombres e implementar un descubrimiento de catálogo automatizado.

### Estructura de Tablas:
1.  **usuarios:** Credenciales y datos básicos.
2.  **roles:** Catálogo de roles (USER, ADMIN, SCRAPER).
3.  **usuarios_roles:** Relación N:M para seguridad Spring Security.
4.  **categorias:** Clasificación de productos (Lácteos, Panificados, etc.).
5.  **criterios_busqueda:** (Nueva) Configuración de términos genéricos (ej: "fideo") mapeados a una categoría para alimentar el motor de rastreo del scraper.
6.  **productos:** "Catálogo Maestro". Descompuesto en campos atómicos (`nombre_generico`, `marca`, `variante_especifica`, `peso_valor`, `peso_unidad`) que actúan como clave de normalización.
7.  **supermercados:** Información de las cadenas y su URL base.
8.  **productos_tienda:** (Tabla Puente) Mapea un producto maestro con su URL específica, texto crudo de la tienda y el supermercado asociado.
9.  **historial_precios:** Almacena cada captura del scraper (precio + fecha + stock).
10. **listas_compras:** Cabecera de la lista creada por el usuario.
11. **items_lista:** Detalle de productos y cantidades dentro de cada lista.

### ¿Por qué funciona así? (Lógica de Ingeniería)
- **Descubrimiento Autónomo:** A diferencia de modelos estáticos donde se carga una URL a mano, el Scraper (Python) recibe una matriz `supermercados × criterios_busqueda`. Ingresa a los buscadores de las tiendas, busca el término, fuerza el lazy-load e itera sobre toda la grilla de resultados extraídos en caliente.
- **Normalización Inteligente (Algoritmo Jaro-Winkler):** El Scraper envía los textos "sucios" al Backend (Java). Este separa pesos y unidades con regex, y luego aplica el algoritmo **Jaro-Winkler** para medir la similitud matemática entre la marca/variante nueva y el catálogo existente en `productos`.
- **Deduplicación y Poblamiento Dinámico:** Si la similitud supera un umbral (ej: 0.92), el backend asume que es una variación tipográfica (ej: "Spagueti" vs "Spaghetti") y los unifica en la misma fila de `productos`. Si es menor, asume que es un producto inédito, lo inserta en el catálogo y crea el mapeo automáticamente en `productos_tienda`.
- **Optimización de Compra:** Al tener el catálogo maestro limpio y unificado, el algoritmo de ahorro simplemente consulta `historial_precios` cruzando los IDs del supermercado, generando el Circuito Óptimo de Compra sin errores de duplicación.

---

## 
> "Actúa como un Desarrollador Fullstack Senior. Basado en el contexto de este proyecto de comparación de precios. Respeta la estructura de 10 tablas y la lógica de negocio del 'Producto Maestro' explicada en el archivo."