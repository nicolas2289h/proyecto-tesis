# Changelog - Scraper de Precios Modular

Historial de control de cambios del desarrollo del scraper. Organizado de forma cronológica e incremental por sprints de trabajo académico.

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
