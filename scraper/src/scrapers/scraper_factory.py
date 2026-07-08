import logging
from typing import Optional
from urllib.parse import urlparse
from .generic_jsonld_scraper import GenericJsonLdScraper
from .dia_scraper import DiaScraper
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
        Retorna un scraper genérico basado en JSON-LD (Schema.org) adaptado para la tienda.

        Args:
            url: URL completa del producto o URL base de la tienda.

        Returns:
            Optional[BaseScraper]: Instancia del scraper correspondiente.
        """
        if not url:
            logger.warning("Fábrica de scrapers recibió una URL vacía.")
            return None

        try:
            domain = urlparse(url).netloc
            if not domain and "/" in url:
                store_name = "Tienda Genérica"
            else:
                store_name = domain.replace("www.", "").split(".")[0].capitalize()
                
            if "supermercadosdia.com.ar" in domain:
                logger.info("Fábrica instanciando DiaScraper específico para la tienda: 'Diaonline'.")
                return DiaScraper()
                
        except Exception:
            store_name = "Tienda Genérica"
            
        logger.info(f"Fábrica instanciando GenericJsonLdScraper para la tienda: '{store_name}'.")
        return GenericJsonLdScraper(store_name)

