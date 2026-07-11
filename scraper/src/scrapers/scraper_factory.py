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

    @staticmethod
    def get_scraper(url: str) -> Optional[BaseScraper]:
        """
        Analiza la URL y retorna la instancia del scraper apropiado.

        Args:
            url: URL del supermercado o del producto.

        Returns:
            Instancia de BaseScraper o None si no se encuentra un scraper específico.
        """
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
        except Exception as e:
            logger.error(f"Error parseando la URL '{url}': {e}")
            return GenericJsonLdScraper()

        # Mapeo de dominios a scrapers específicos
        scraper_map = {
            "comodinencasa.com.ar": ComodinEncasaScraper,
            "vea.com.ar": VeaScraper,
            "diaonline.supermercadosdia.com.ar": DiaScraper
        }

        # Buscar el dominio exacto o parcial en el mapa
        for target_domain, scraper_class in scraper_map.items():
            if target_domain in domain:
                logger.info(f"Scraper específico detectado para {target_domain}")
                return scraper_class()

        # Si no se encontró ningún scraper específico, usar el genérico
        logger.info(f"No hay scraper específico para {domain}. Usando scraper genérico JSON-LD.")
        return GenericJsonLdScraper()
