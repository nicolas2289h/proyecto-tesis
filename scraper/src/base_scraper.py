from abc import ABC, abstractmethod
import logging
from typing import Dict, Any, Optional
from playwright.async_api import Page

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    """
    Clase abstracta base (Interface/Template Method) que define y estandariza
    el ciclo de vida del raspado de cualquier supermercado o cadena comercial.
    
    Implementa el principio Abierto/Cerrado (Open/Closed Principle) y de Responsabilidad Única.
    """

    @abstractmethod
    def get_store_name(self) -> str:
        """
        Retorna el nombre descriptivo de la cadena de supermercados.
        Ejemplo: "Jumbo", "Lider".
        """
        pass

    @abstractmethod
    def parse(self, html: str) -> Dict[str, Any]:
        """
        Parsea el contenido HTML renderizado usando BeautifulSoup4 y extrae los datos del producto.
        Este método debe ser implementado por cada scraper concreto de acuerdo con sus selectores.

        Args:
            html: Código fuente HTML de la página web.

        Returns:
            Dict[str, Any]: Diccionario conteniendo:
                - "precio": (float | None) El precio normalizado del producto.
                - "disponible": (bool) Estado de stock.
                - "nombre": (str | None) Nombre o descripción opcional del producto.
        """
        pass

    async def fetch_html(self, page: Page, url: str) -> str:
        """
        Realiza la carga y renderizado dinámico de la página web utilizando Playwright.
        Puede ser sobrescrita por las subclases si la tienda requiere interacciones específicas
        (ej: clics en diálogos de cookies, selección de región, scroll dinámico).

        Args:
            page: Objeto Page activo de Playwright.
            url: Dirección URL específica del producto a consultar.

        Returns:
            str: Código HTML final completamente renderizado.
        """
        logger.info(f"[{self.get_store_name()}] Navegando a la URL: {url}")
        
        # Configurar headers de agente de usuario para mitigar bloqueos básicos
        await page.set_extra_http_headers({
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
        })
        
        # Cargar la página esperando a que la red esté inactiva (ideal para JS dinámico)
        # Timeout por defecto de 30 segundos
        response = await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        if not response or response.status != 200:
            status_code = response.status if response else "Desconocido"
            logger.warning(f"[{self.get_store_name()}] Advertencia al cargar URL. Código HTTP: {status_code}")
            
        # Esperar un breve momento para el renderizado del JS reactivo de las páginas modernas (SPA)
        await page.wait_for_timeout(2000)
        
        # Retornar el HTML final del DOM renderizado
        return await page.content()

    async def scrape(self, page: Page, url: str) -> Dict[str, Any]:
        """
        Método plantilla (Template Method) que orquesta todo el proceso de raspado de un producto.
        Ejecuta de forma secuencial la extracción y el posterior parseado.

        Args:
            page: Instancia de página activa de Playwright.
            url: URL del producto.

        Returns:
            Dict[str, Any]: Resultado del raspado estructurado.
        """
        store = self.get_store_name()
        try:
            # 1. Obtener HTML dinámico
            html = await self.fetch_html(page, url)
            
            # 2. Parsear el HTML usando BeautifulSoup
            extracted_data = self.parse(html)
            
            logger.info(f"[{store}] Raspado completado para {url}. Precio extraído: {extracted_data.get('precio')}, Stock disponible: {extracted_data.get('disponible')}")
            return extracted_data
            
        except Exception as e:
            logger.error(f"[{store}] Error crítico durante el proceso de raspado de {url}: {e}", exc_info=True)
            return {
                "precio": None,
                "disponible": False,
                "error": str(e)
            }
