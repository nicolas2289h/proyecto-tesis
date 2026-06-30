# Price Scraper - Guía de Instalación y Ejecución

Este servicio modular de Web Scraping está diseñado en Python para interactuar de forma completamente desacoplada con un Backend REST (Spring Boot). A continuación, se detallan los pasos necesarios para instalar dependencias, configurar el entorno y ejecutar la extracción de manera exitosa.

---

## Requisitos Previos

Asegúrate de contar con lo siguiente instalado en tu sistema:
*   **Python**: Versión 3.9 o superior.
*   **Gestor de Paquetes**: `pip` actualizado.
*   **Conectividad de Red**: Acceso HTTP al backend Spring Boot.

---

## 1. Clonar e Instalar Dependencias

Navega hasta el directorio del scraper en tu terminal y ejecuta la instalación del entorno de dependencias requerido:

## 1.1 Crear el entorno virtual de Python

```bash
python -m venv .venv
```

## 1.2 Activar el entorno virtual

```bash
.\venv\Scripts\Activate.ps1
```

## 1.3 Instalar librerías de Python

```bash
pip install -r requirements.txt
```

## 2. Inicializar Playwright

Dado que el scraper utiliza **Playwright** para renderizar dinámicamente el JavaScript reactivo (SPA) de los supermercados modernos, es obligatorio descargar los binarios del navegador headless antes de la primera ejecución:

```bash
# Descargar e instalar los navegadores de Playwright (Chromium/Webkit)
playwright install chromium
```

*(Nota: En entornos Linux de producción o servidores CI/CD, podrías requerir instalar también las dependencias del sistema operativo mediante `playwright install-deps`).*

---

## 3. Configuración de Variables de Entorno

El scraper se rige bajo el principio de configuración desacoplada (12-Factor App). Para parametrizar credenciales y endpoints:

1.  Copia la plantilla de variables de entorno `.env.example` y crea un archivo definitivo llamado `.env` en la raíz del proyecto:
    ```bash
    cp .env.example .env
    ```
2.  Abre el archivo `.env` en tu editor de texto y define los parámetros del sistema:

```ini
# URL base de la API de Spring Boot
API_BASE_URL=http://localhost:8080

# Credenciales para autenticación JWT
SCRAPER_EMAIL=admin_scraper@tesis.com
SCRAPER_PASSWORD=password_seguro

# Control del Motor Render (Playwright)
# - true: ejecuta en background (ideal en servidores)
# - false: abre la ventana gráfica del navegador (ideal para depuración visual)
PLAYWRIGHT_HEADLESS=true

# Políticas de cortesía (Tiempo en segundos a esperar aleatoriamente entre productos)
MIN_DELAY_SECONDS=2
MAX_DELAY_SECONDS=5

# Nivel de registro de eventos (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
```

---

## 4. Estructura y Módulos de Código

*   `run.py`: Script de conveniencia para la ejecución directa.
*   `src/main.py`: Orquestador del ciclo de vida del raspado.
*   `src/api_client.py`: Cliente de persistencia, renovación de JWT en memoria y comunicación API.
*   `src/base_scraper.py`: Interfaz abstracta común y flujo de renderizado base.
*   `src/scrapers/`: Contiene el scraper genérico y la fábrica de instanciación.
*   `src/utils/normalizers.py`: Funciones puras de formateo matemático para parsear strings a tipos decimales y booleanos limpios.

---

## 5. Ejecución del Proceso

Una vez instaladas las dependencias, inicializado Playwright y configurado el archivo `.env`, puedes iniciar la recolección automática ejecutando el siguiente comando desde la raíz del scraper:

```bash
python run.py
```

### Flujo Interno Ejecutado:
1.  **Inicio y Carga**: Lee las configuraciones de `.env` y levanta el sistema de logs.
2.  **Autenticación**: Realiza un `POST` a `/api/v1/auth/login` con tus credenciales y guarda el JWT en memoria.
3.  **Obtención de Objetivos**: Realiza un `GET` a `/api/v1/productos-tienda` adjuntando el JWT. Obtiene los productos a procesar.
4.  **Bucle de Extracción**:
    *   Itera sobre cada producto.
    *   Duerme el hilo de ejecución por un tiempo aleatorio (política de cortesía).
    *   Carga la URL dinámicamente con Playwright.
    *   Extrae el precio usando BeautifulSoup4 con extractores JSON-LD y fallback CSS.
5.  **Persistencia**: Envía cada precio en un `POST` a `/api/v1/precios`. Si el backend responde con un `401 Unauthorized` por expiración de token, el cliente de API renueva el JWT automáticamente y prosigue con la operación.
6.  **Cierre**: Cierra los procesos de navegación y reporta estadísticas de éxito en consola.
