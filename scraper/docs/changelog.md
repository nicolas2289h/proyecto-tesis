# Changelog - Scraper de Precios Modular

Historial de control de cambios del desarrollo del scraper. Organizado de forma cronológica e incremental por sprints de trabajo académico.

---

## [2.0.0] - 2026-06-23
### Añadido: Modo de Descubrimiento Automático de Catálogo
*   **`extract_all_products_from_search` (`base_scraper.py`)**:
    *   Nuevo método en `BaseScraper` que navega a la URL de búsqueda y extrae **todas** las tarjetas de productos visibles en la primera página de resultados.
    *   Utiliza `.all()` de Playwright para iterar sobre la grilla completa en lugar de retornar solo el primer resultado.
    *   Por cada tarjeta extrae en caliente: `titulo` (nombre del producto), `url` (URL absoluta del producto), `precio_texto` (precio crudo renderizado).
    *   Soporta múltiples selectores de grilla (VTEX, Shopify, Next.js) y selectores de tarjeta fallback para máxima compatibilidad.
    *   El método `extract_product_url` legacy **se conserva** para compatibilidad con el flujo de scraping de URL fija.
*   **`parse_weight` (`normalizers.py`)**:
    *   Nueva función de pre-normalización que extrae `peso_valor` y `peso_unidad` de un texto crudo de producto.
    *   Soporta variantes en español: "500g", "500 gr", "x 500 gramos", "1,5 kg", "750ml", "1 litro", "750cc".
    *   Normaliza unidades a formato estándar: "g", "kg", "ml", "l".
*   **`get_extraction_targets()` y `post_ingesta_masiva()` (`api_client.py`)**:
    *   `get_extraction_targets()`: `GET /api/v1/extractor/targets` — obtiene el producto cartesiano supermercados × criterios_busqueda desde el backend.
    *   `post_ingesta_masiva(items)`: `POST /api/v1/extractor/ingesta-masiva` — envía la lista de productos descubiertos para normalización y persistencia automática.
    *   Ambos métodos implementan la misma política de reintentos con backoff exponencial que los métodos existentes.
*   **`discovery_mode_run()` (`main.py`)**:
    *   Nueva función asíncrona que orquesta el flujo completo de descubrimiento:
        1. Obtiene targets del backend.
        2. Por cada combinación (supermercado, keyword), navega a la grilla de búsqueda.
        3. Extrae todas las tarjetas con `extract_all_products_from_search`.
        4. Construye el payload `ItemIngestaDto` con precio normalizado vía `clean_price()`.
        5. Envía el batch al endpoint `/api/v1/extractor/ingesta-masiva`.
    *   Se ejecuta automáticamente como segunda fase en `main_async()`, tras el flujo legacy.
    *   Reporta métricas detalladas al finalizar (targets procesados, ítems enviados, nuevos productos, unificados, errores).

---

## [1.2.0] - 2026-06-21
### Añadido
*   **Coincidencia Estricta por Nombre y Marca (`base_scraper.py`, `main.py`)**:
    *   Se mejoró `extract_product_url` para validar que los enlaces de productos encontrados en la búsqueda coincidan obligatoriamente tanto con el nombre genérico como con la marca (si está provista), evitando asociaciones erróneas.
### Eliminado
*   **Scrapers Específicos**:
    *   Eliminados los scrapers específicos de **Jumbo** y **Líder** (`jumbo_scraper.py`, `lider_scraper.py`), simplificando el proyecto y utilizando el `GenericJsonLdScraper` de manera universal.
    *   Refactorizada la fábrica `ScraperFactory` y el módulo de scrapers para limpiar todas las referencias a los módulos borrados.

---

## [1.1.0] - 2026-06-19
### Añadido
*   **Búsqueda Dinámica y Extracción de URL (`base_scraper.py`)**:
    *   Implementado `get_search_url` para generar automáticamente la URL de búsqueda para Jumbo, Líder y otros supermercados basados en VTEX o plataformas genéricas.
    *   Implementado `extract_product_url` para navegar a la página de resultados y extraer dinámicamente la URL absoluta del primer producto (usando una heurística de DOM JS que ignora cabeceras/menús/pies de página).
*   **Persistencia en Backend (`api_client.py`)**:
    *   Añadido el método `update_producto_tienda` para enviar una petición `PUT` a `/api/v1/productos-tienda/{id}` con la URL encontrada.
*   **Orquestación Adaptativa (`main.py`)**:
    *   Refactorizado `process_target` para detectar la ausencia de `urlEspecifica`, ejecutar la búsqueda por nombre y marca, persistir el enlace resuelto en el backend, y proceder con el scraping tradicional del precio.

---

## [1.0.0] - 2026-05-26 (Versión Inicial Estable de Producción)
### Añadido
*   **Arquitectura Modular**: Estructura limpia e independiente con empaquetamiento Python en `src/` aplicando principios de inyección y desacoplamiento absoluto de persistencia.
*   **Cliente HTTP Resiliente (`api_client.py`)**:
    *   Autenticación automática en `/api/v1/auth/login` con almacenamiento en memoria del token JWT.
    *   Mecanismo de detección y refresco automático de token (HTTP 401 Unauthorized) en segundo plano sin interrupción.
    *   Política de reintentos con retroceso exponencial (`backoff`) y control fino de timeouts.
*   **Clase Abstracta Base (`base_scraper.py`)**:
    *   Estandarización del ciclo de vida de raspado (Template Method Pattern).
    *   Integración del motor Playwright Headless para renderizado JS dinámico compartido por todas las subclases.
*   **Scrapers Concretos de Supermercados (`jumbo_scraper.py`, `lider_scraper.py`)**:
    *   Estrategia robusta de extracción híbrida mediante búsqueda de datos Schema.org estructurados (JSON-LD) y deserialización de NextJS props (`__NEXT_DATA__`).
    *   Estructura secundaria basada en selectores CSS alternativos para resiliencia ante cambios de interfaz.
*   **Fábrica Dinámica de Scrapers (`scraper_factory.py`)**:
    *   Instanciación automatizada por dominio de URL basándose en patrones de diseño orientados a objetos.
*   **Librerías de Normalización (`normalizers.py`)**:
    *   Limpieza y conversión precisa de cadenas monetarias complejas latinoamericanas a decimales (`float`).
    *   Mapeo inteligente de stock.
*   **Documentación Académica Detallada (`docs/`)**:
    *   `readme.md`: Guía de inicialización de dependencias, variables `.env` y ejecución.
    *   `endpoints.md`: Contratos HTTP JSON y códigos de estado.
    *   `changelog.md`: Este registro histórico de avances.

---

## [0.2.0-beta] - 2026-05-25 (Sprint 2: Extracción y Renderizado Reactivo)
### Añadido
*   Prototipo de scraping asíncrono implementado directamente con Playwright y Chromium headless.
*   Manejo de agentes de usuario (User-Agents) y selectores DOM preliminares.
*   Implementación de expresiones regulares de normalización numérica probadas en casos de borde.

---

## [0.1.0-alpha] - 2026-05-24 (Sprint 1: Modelado de Arquitectura y Clientes)
### Añadido
*   Planificación arquitectónica del sistema de scraping (arquitectura distribuida y desacoplada).
*   Mock de endpoints de login y precios en servidor local para validar contratos de red.
*   Modelado de clases base y jerarquía orientada a objetos preliminar.
