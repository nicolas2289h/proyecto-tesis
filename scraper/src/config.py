import os
import logging
from dotenv import load_dotenv

# Cargar variables desde archivo .env si existe
load_dotenv()

# ==========================================
# CONFIGURACIONES DE LA API BACKEND
# ==========================================
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080").rstrip("/")
SCRAPER_EMAIL = os.getenv("SCRAPER_EMAIL", "admin_scraper@tesis.com")
SCRAPER_PASSWORD = os.getenv("SCRAPER_PASSWORD", "password_seguro")

# ==========================================
# CONFIGURACIONES DE SCRAPING
# ==========================================
# Convertir string 'true'/'false' a booleano
PLAYWRIGHT_HEADLESS_RAW = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower()
PLAYWRIGHT_HEADLESS = PLAYWRIGHT_HEADLESS_RAW not in ("false", "0", "no")

try:
    MIN_DELAY_SECONDS = float(os.getenv("MIN_DELAY_SECONDS", "2"))
except ValueError:
    MIN_DELAY_SECONDS = 2.0

try:
    MAX_DELAY_SECONDS = float(os.getenv("MAX_DELAY_SECONDS", "5"))
except ValueError:
    MAX_DELAY_SECONDS = 5.0

# ==========================================
# CONFIGURACIÓN DE LOGGING
# ==========================================
LOG_LEVEL_STR = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_LEVEL = getattr(logging, LOG_LEVEL_STR, logging.INFO)

def setup_logging():
    """
    Configura el sistema de logging para la salida estándar de consola
    con un formato detallado y profesional para el análisis académico.
    """
    logging.basicConfig(
        level=LOG_LEVEL,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler()
        ]
    )
    # Reducir verbosidad de librerías terceras
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    # Playwright puede ser ruidoso en debug
    logging.getLogger("playwright").setLevel(logging.WARNING)
