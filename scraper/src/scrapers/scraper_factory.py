import logging
from typing import Optional
from urllib.parse import urlparse
from .jumbo_scraper import JumboScraper
from .lider_scraper import LiderScraper
from .generic_jsonld_scraper import GenericJsonLdScraper
from ..base_scraper import BaseScraper

logger = logging.getLogger(__name__)

class ScraperFactory:
    """
    Fábrica estática para el diseño e instanciación de scrapers concretos.
    Aplica el principio de inversión de dependencias y encapsula la creación de objetos.
    """

    @staticmethod
    def get_scraper(url: str) -> Optional[BaseScraper]:
        """
        Determina e instancia el scraper correspondiente analizando la URL provista.
        Si no se reconoce una tienda específica, retorna un scraper genérico basado en JSON-LD.

        Args:
            url: URL completa del producto a raspar.

        Returns:
            Optional[BaseScraper]: Instancia de la clase scraper concreta o genérica.
        """
        if not url:
            logger.warning("Fábrica de scrapers recibió una URL vacía.")
            return None

        normalized_url = url.lower()

        # 1. Determinar si corresponde a una cadena comercial con reglas específicas
        if "jumbo.cl" in normalized_url or "jumbo" in normalized_url:
            logger.info("Fábrica instanciando JumboScraper para la URL provista.")
            return JumboScraper()
            
        elif "lider.cl" in normalized_url or "lider" in normalized_url:
            logger.info("Fábrica instanciando LiderScraper para la URL provista.")
            return LiderScraper()
            
        # 2. Fallback Universal: Scraper Genérico Semántico (Carrefour, Día, Vea, Comodín, etc.)
        else:
            try:
                # Intentamos extraer un nombre comercial limpio a partir de la URL
                domain = urlparse(url).netloc
                if not domain and "/" in url:
                    # En caso de que se pase un path relativo y no contenga dominio aún
                    store_name = "Tienda Genérica"
                else:
                    store_name = domain.replace("www.", "").split(".")[0].capitalize()
            except Exception:
                store_name = "Tienda Genérica"
                
            logger.info(f"Fábrica instanciando GenericJsonLdScraper de contingencia para la tienda: '{store_name}'.")
            return GenericJsonLdScraper(store_name)

