import json
import logging
from typing import Dict, Any
from bs4 import BeautifulSoup

from ..base_scraper import BaseScraper
from ..utils.normalizers import clean_price

logger = logging.getLogger(__name__)

class VeaScraper(BaseScraper):
    """
    Scraper específico para Vea (VTEX).
    """

    def get_store_name(self) -> str:
        return "Vea"

    def parse(self, html: str, product_url: str = None) -> Dict[str, Any]:
        soup = BeautifulSoup(html, "html.parser")
        
        precio = None
        disponible = True
        nombre = None
        url_imagen = None

        logger.info(f"[{self.get_store_name()}] Parseando página: {product_url}")
        
        try:
            json_ld_tags = soup.find_all("script", type="application/ld+json")
            
            for tag in json_ld_tags:
                try:
                    tag_content = tag.string or ""
                    if not tag_content.strip():
                        continue
                        
                    data = json.loads(tag_content)
                    data_list = data if isinstance(data, list) else [data]
                        
                    for item in data_list:
                        if isinstance(item, dict) and item.get("@type") == "Product":
                            nombre = item.get("name")
                            if item.get("image"):
                                url_imagen = item["image"][0] if isinstance(item["image"], list) else item["image"]
                            offers = item.get("offers", {})
                            
                            if isinstance(offers, list) and len(offers) > 0:
                                offer = offers[0]
                            elif isinstance(offers, dict):
                                offer = offers
                            else:
                                offer = {}
                                
                            raw_price = offer.get("lowPrice") or offer.get("price")
                            if raw_price is not None:
                                try:
                                    precio = float(raw_price)
                                except (ValueError, TypeError):
                                    precio = clean_price(str(raw_price))
                                
                            availability = offer.get("availability")
                            if availability:
                                if isinstance(availability, str):
                                    disponible = "InStock" in availability or "OutOfStock" not in availability
                                else:
                                    disponible = True
                            if precio:
                                logger.info(f"[{self.get_store_name()}] JSON-LD OK: {nombre} - ${precio}")
                                return {
                                    "precio": precio,
                                    "disponible": disponible,
                                    "nombre": nombre,
                                    "url_imagen": url_imagen
                                }
                except Exception as je:
                    logger.debug(f"[{self.get_store_name()}] JSON-LD error: {je}")
                    continue
        except Exception as e:
            logger.warning(f"[{self.get_store_name()}] Error JSON-LD: {e}")

        # Estrategia 2: Selectores CSS (fallback)
        logger.info(f"[{self.get_store_name()}] Usando selectores CSS de respaldo")
        
        for selector in [
            "h2[class*='product']", "h1[class*='product']", 
            "[class*='product-name']", "[class*='productName']"
        ]:
            el = soup.select_one(selector)
            if el and el.text.strip():
                nombre = el.text.strip()
                break
                
        for selector in [
            ".sellingPrice .value", ".bestPrice .value", ".offer-price", 
            "[class*='selling-price']", "[class*='best-price']"
        ]:
            el = soup.select_one(selector)
            if el and el.text.strip():
                precio = clean_price(el.text.strip())
                if precio:
                    break
        
        for selector in [
            "img[class*='product']", "#product-image", "[class*='product-image'] img"
        ]:
            el = soup.select_one(selector)
            if el and el.get("src"):
                url_imagen = el.get("src")
                break

        return {
            "precio": precio,
            "disponible": disponible,
            "nombre": nombre,
            "url_imagen": url_imagen
        }
