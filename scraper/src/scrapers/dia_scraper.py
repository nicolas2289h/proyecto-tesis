import logging
import urllib.parse
from typing import Dict, Any
from .generic_jsonld_scraper import GenericJsonLdScraper

logger = logging.getLogger(__name__)

class DiaScraper(GenericJsonLdScraper):
    """
    Scraper específico para Supermercados Día.
    Hereda la extracción genérica (JSON-LD) pero sobrescribe métodos específicos
    como la generación de la URL de búsqueda.
    """

    def __init__(self):
        super().__init__(store_name="Diaonline")

    def get_search_url(self, url_base: str, query: str) -> str:
        """
        Genera la URL de búsqueda específica para Día.
        Usa el formato /{query}?_q={query}&map=ft
        """
        encoded_query = urllib.parse.quote(query)
        base = url_base.rstrip('/')
        return f"{base}/{encoded_query}?_q={encoded_query}&map=ft"

    def parse(self, html: str) -> Dict[str, Any]:
        """
        Sobrescribe el parser genérico para priorizar selectores de precio específicos 
        de Dia/VTEX IO en el HTML y evitar capturar el precio de lista/tachado.
        """
        from bs4 import BeautifulSoup
        from ..utils.normalizers import clean_price
        
        soup = BeautifulSoup(html, "html.parser")
        
        precio = None
        disponible = True
        nombre = None
        
        # 1. Intentar obtener nombre del producto
        name_el = soup.select_one("span.vtex-store-components-3-x-productBrand, [class*='brandName'], h1")
        if name_el:
            nombre = name_el.get_text(strip=True)
            
        # 2. Intentar buscar el precio de venta final utilizando selectores de venta
        selling_selectors = [
            "span[class*='sellingPriceValue']",
            "span[class*='sellingPrice']",
            "span[class*='price-sellingPrice']",
            "[class*='sellingPriceValue']",
            ".diaio-store-5-x-sellingPriceValue",
            ".vtex-product-price-1-x-sellingPriceValue",
        ]
        
        for selector in selling_selectors:
            price_el = soup.select_one(selector)
            if price_el:
                price_text = price_el.get_text(strip=True)
                val = clean_price(price_text)
                if val and val > 0:
                    precio = val
                    logger.debug(f"[{self.get_store_name()}] Precio de venta encontrado por CSS '{selector}': {precio}")
                    break
                    
        # 3. Si no encontramos precio de venta específico, pero hay otros precios en la página,
        # buscamos cualquier precio siempre que no contenga clases de precio de lista o descuento/ahorro.
        if not precio:
            price_els = soup.select("[class*='price'], [class*='Price'], [class*='value'], [class*='Value']")
            for el in price_els:
                class_str = " ".join(el.get("class", [])).lower()
                if "listprice" in class_str or "list-price" in class_str or "strike" in class_str or "savings" in class_str:
                    continue
                price_text = el.get_text(strip=True)
                if "$" in price_text:
                    val = clean_price(price_text)
                    if val and val > 0:
                        precio = val
                        logger.debug(f"[{self.get_store_name()}] Precio de fallback encontrado por CSS: {precio}")
                        break

        # 4. Determinar disponibilidad analizando selectores de fuera de stock
        out_of_stock_indicators = [
            "[class*='outOfStock']",
            "[class*='notAvailable']",
            ".vtex-product-summary-2-x-clearLink--unavailable",
            "[class*='unavailable']"
        ]
        for indicator in out_of_stock_indicators:
            if soup.select_one(indicator):
                disponible = False
                logger.debug(f"[{self.get_store_name()}] Producto detectado sin stock por selector: {indicator}")
                break

        # 5. Si logramos extraer el precio correctamente, retornamos
        if precio is not None:
            logger.info(f"[{self.get_store_name()}] Extracción por selectores CSS específica de Dia exitosa. Nombre: '{nombre}', Precio: {precio}, Disponible: {disponible}")
            return {
                "precio": precio,
                "disponible": disponible,
                "nombre": nombre
            }
            
        # 6. Fallback a la extracción estructurada JSON-LD genérica
        logger.info(f"[{self.get_store_name()}] No se pudo extraer precio con selectores CSS específicos. Intentando fallback JSON-LD genérico.")
        return super().parse(html)

