import json
import logging
from typing import Dict, Any
from bs4 import BeautifulSoup

from ..base_scraper import BaseScraper
from ..utils.normalizers import clean_price, clean_stock

logger = logging.getLogger(__name__)

class JumboScraper(BaseScraper):
    """
    Scraper concreto para el supermercado Jumbo.
    Utiliza una estrategia híbrida:
    1. Intenta parsear los datos estructurados en formato JSON-LD (Schema.org).
    2. Si no están disponibles, recurre a selectores CSS específicos de Jumbo.
    """

    def get_store_name(self) -> str:
        return "Jumbo"

    def parse(self, html: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html, "html.parser")
        
        precio = None
        disponible = True
        nombre = None

        # --- ESTRATEGIA 1: JSON-LD (Altamente robusta y recomendada académicamente) ---
        try:
            json_ld_tags = soup.find_all("script", type="application/ld+json")
            for tag in json_ld_tags:
                try:
                    data = json.loads(tag.string or "")
                    
                    # El JSON-LD puede ser un solo objeto o una lista de objetos
                    if isinstance(data, list):
                        data_list = data
                    else:
                        data_list = [data]
                        
                    for item in data_list:
                        if item.get("@type") == "Product":
                            nombre = item.get("name")
                            offers = item.get("offers", {})
                            
                            # Si 'offers' es una lista, tomamos la primera oferta disponible
                            if isinstance(offers, list) and len(offers) > 0:
                                offer = offers[0]
                            else:
                                offer = offers
                                
                            raw_price = offer.get("price")
                            if raw_price:
                                precio = float(raw_price)
                                
                            availability = offer.get("availability")
                            if availability:
                                # Ej: "http://schema.org/InStock" o "InStock"
                                disponible = "InStock" in availability
                                
                            logger.info(f"[Jumbo JSON-LD] Datos extraídos correctamente. Nombre: {nombre}, Precio: {precio}, Disponible: {disponible}")
                            return {
                                "precio": precio,
                                "disponible": disponible,
                                "nombre": nombre
                            }
                except (json.JSONDecodeError, TypeError, ValueError) as je:
                    logger.debug(f"[Jumbo JSON-LD] Error al decodificar un tag JSON-LD: {je}")
                    continue
        except Exception as e:
            logger.warning(f"[Jumbo] Fallo general al buscar/procesar JSON-LD: {e}")

        # --- ESTRATEGIA 2: Selectores CSS (Fallback para cuando falla JS o el renderizado JSON-LD) ---
        logger.info("[Jumbo CSS] Intentando extracción mediante selectores CSS de fallback.")
        
        # 1. Nombre del Producto
        name_tag = soup.select_one("h1.product-single-name, h1.product-name, .product-title")
        if name_tag:
            nombre = name_tag.get_text(strip=True)

        # 2. Precio del Producto
        # Jumbo utiliza varias clases según la versión de su frontend reactivo
        price_selectors = [
            ".prices-main-price",
            ".prices-price",
            ".product-single-price",
            ".prices-main-price-value",
            "[data-testid='product-price']"
        ]
        
        for selector in price_selectors:
            price_tag = soup.select_one(selector)
            if price_tag:
                raw_price_str = price_tag.get_text(strip=True)
                precio = clean_price(raw_price_str)
                if precio is not None:
                    break

        # 3. Disponibilidad / Stock
        # Buscar botones de "Agotado", textos explícitos de "Sin Stock" o "Agregar" deshabilitado
        stock_indicators = [
            ".product-out-of-stock",
            ".btn-add-to-cart:disabled",
            ".prices-out-of-stock",
            ".availability-status"
        ]
        
        for indicator in stock_indicators:
            indicator_tag = soup.select_one(indicator)
            if indicator_tag:
                text_content = indicator_tag.get_text(strip=True)
                disponible = clean_stock(text_content)
                # Si encontramos un indicador explícito que apunte a sin stock, lo marcamos
                if "agotado" in text_content.lower() or "sin stock" in text_content.lower():
                    disponible = False
                    break
        
        # Adicionalmente, si el botón de compra tiene texto de "Agotado"
        buy_button = soup.select_one(".product-single-buy-button, .btn-add-to-cart")
        if buy_button:
            button_text = buy_button.get_text(strip=True).lower()
            if "agotado" in button_text or "notificar" in button_text:
                disponible = False

        return {
            "precio": precio,
            "disponible": disponible,
            "nombre": nombre
        }
