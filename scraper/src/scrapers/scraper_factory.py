import logging
from typing import Optional
from urllib.parse import urlparse

from .comodinencasa_scraper import ComodinEncasaScraper
from .dia_scraper import DiaScraper
from .vea_scraper import VeaScraper
from .generic_jsonld_scraper import GenericJsonLdScraper
from ..base_scraper import BaseScraper

logger = logging.getLogger(__name__)

class ScraperFactory:
    """
    Factoría para obtener el scraper específico según la URL base del supermercado.
    """

    # Mapeo de dominios a scrapers específicos
    _SCRAPER_MAP = {
        "comodinencasa.com.ar": ComodinEncasaScraper,
        "vea.com.ar": VeaScraper,
        "diaonline.supermercadosdia.com.ar": DiaScraper,
        "supermercadosdia.com.ar": DiaScraper,
    }

    @staticmethod
    def get_scraper(url: str) -> Optional[BaseScraper]:
        """
        Analiza la URL y retorna la instancia del scraper apropiado.

        Args:
            url: URL del supermercado o del producto.

        Returns:
            Instancia de BaseScraper o None si no se encuentra un scraper específico.
        """
        if not url:
            logger.warning("Fábrica de scrapers recibió una URL vacía.")
            return None

        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
        except Exception as e:
            logger.error(f"Error parseando la URL '{url}': {e}")
            return GenericJsonLdScraper()

        # Buscar el dominio exacto o parcial en el mapa
        for target_domain, scraper_class in ScraperFactory._SCRAPER_MAP.items():
            if target_domain in domain:
                logger.info(f"Scraper específico detectado para {target_domain}.")
                return scraper_class()

        # Si no se encontró ningún scraper específico, usar el genérico
        store_name = domain.replace("www.", "").split(".")[0].capitalize() if domain else "Tienda Genérica"
        logger.info(f"No hay scraper específico para '{domain}'. Usando scraper genérico JSON-LD para: '{store_name}'.")
        return GenericJsonLdScraper(store_name)
