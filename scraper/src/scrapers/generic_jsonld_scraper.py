import json
import logging
from typing import Dict, Any
from bs4 import BeautifulSoup

from ..base_scraper import BaseScraper
from ..utils.normalizers import clean_price

logger = logging.getLogger(__name__)

class GenericJsonLdScraper(BaseScraper):
    """
    Scraper genérico de contingencia.
    Aprovecha el estándar semántico de la web Schema.org (JSON-LD) para extraer 
    información de productos (nombre, precio, disponibilidad) de forma universal
    en plataformas modernas de e-commerce (como VTEX, Shopify, Next.js, etc.)
    sin depender de selectores CSS específicos que cambien frecuentemente.
    """

    def __init__(self, store_name: str = "Tienda Genérica"):
        self.store_name = store_name

    def get_store_name(self) -> str:
        return self.store_name

    def parse(self, html: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html, "html.parser")
        
        precio = None
        disponible = True
        nombre = None

        logger.info(f"[{self.store_name}] Intentando parseo universal mediante datos estructurados JSON-LD (Schema.org).")
        
        try:
            # Buscar todos los scripts de tipo JSON-LD
            json_ld_tags = soup.find_all("script", type="application/ld+json")
            
            for tag in json_ld_tags:
                try:
                    # Algunos tags pueden estar vacíos o con texto no estructurado
                    tag_content = tag.string or ""
                    if not tag_content.strip():
                        continue
                        
                    data = json.loads(tag_content)
                    
                    # El JSON-LD puede presentarse como un solo objeto o como una lista de objetos
                    data_list = data if isinstance(data, list) else [data]
                        
                    for item in data_list:
                        # Buscamos elementos de tipo 'Product'
                        if isinstance(item, dict) and item.get("@type") == "Product":
                            nombre = item.get("name")
                            offers = item.get("offers", {})
                            
                            # Si 'offers' es una lista, extraemos la primera oferta disponible
                            if isinstance(offers, list) and len(offers) > 0:
                                offer = offers[0]
                            elif isinstance(offers, dict):
                                offer = offers
                            else:
                                offer = {}
                                
                            # Extraer y normalizar precio
                            raw_price = offer.get("price")
                            if raw_price is not None:
                                try:
                                    precio = float(raw_price)
                                except (ValueError, TypeError):
                                    # Por si el precio viene formateado como string con comas/símbolos
                                    precio = clean_price(str(raw_price))
                                
                            # Extraer y normalizar disponibilidad
                            availability = offer.get("availability")
                            if availability:
                                if isinstance(availability, str):
                                    # Estándares comunes de Schema: http://schema.org/InStock o http://schema.org/OutOfStock
                                    disponible = "InStock" in availability or "OutOfStock" not in availability
                                else:
                                    disponible = True
                            
                            if precio is not None:
                                logger.info(f"[{self.store_name} JSON-LD] Extracción genérica exitosa. Nombre: '{nombre}', Precio: {precio}, Disponible: {disponible}")
                                return {
                                    "precio": precio,
                                    "disponible": disponible,
                                    "nombre": nombre
                                }
                except (json.JSONDecodeError, TypeError, ValueError) as je:
                    logger.debug(f"[{self.store_name} JSON-LD] Error menor decodificando tag: {je}")
                    continue
        except Exception as e:
            logger.warning(f"[{self.store_name}] Error general analizando JSON-LD estructurado: {e}")

        # --- ESTRATEGIA 2: Fallback para VTEX Legacy (skuJson / skuJson_0) ---
        logger.info(f"[{self.store_name}] JSON-LD no disponible. Intentando extracción de variables globales VTEX Legacy (skuJson).")
        try:
            import re
            match_sku = re.search(r"var\s+skuJson(?:_0)?\s*=\s*(\{.*?\});", html, re.DOTALL)
            if match_sku:
                sku_data = json.loads(match_sku.group(1))
                skus = sku_data.get("skus", [])
                if skus:
                    first_sku = skus[0]
                    best_price_formated = first_sku.get("bestPriceFormated")
                    if best_price_formated:
                        precio = clean_price(best_price_formated)
                    else:
                        precio_raw = first_sku.get("bestPrice") or first_sku.get("price")
                        precio = float(precio_raw) / 100.0 if precio_raw else None
                        
                    disponible = first_sku.get("available", True)
                    nombre = first_sku.get("skuname") or sku_data.get("name")
                    
                    if precio is not None:
                        logger.info(f"[{self.store_name} skuJson] Extracción exitosa. Nombre: '{nombre}', Precio: {precio}, Disponible: {disponible}")
                        return {
                            "precio": precio,
                            "disponible": disponible,
                            "nombre": nombre
                        }
        except Exception as e:
            logger.debug(f"[{self.store_name}] Error parseando skuJson: {e}")

        # --- ESTRATEGIA 3: Fallback para VTEX events (vtex.events.addData) ---
        logger.info(f"[{self.store_name}] Intentando extracción de eventos VTEX (vtex.events.addData).")
        try:
            import re
            match_events = re.search(r"vtex\.events\.addData\((\{.*?\})\);", html, re.DOTALL)
            if match_events:
                event_data = json.loads(match_events.group(1))
                nombre = event_data.get("productName")
                precio_raw = event_data.get("productPriceTo") or event_data.get("productPriceFrom")
                precio = float(precio_raw) if precio_raw else None
                
                sku_stocks = event_data.get("skuStocks", {})
                disponible = True
                if sku_stocks:
                    disponible = any(stock > 0 for stock in sku_stocks.values())
                
                if precio is not None:
                    logger.info(f"[{self.store_name} vtex.events] Extracción exitosa. Nombre: '{nombre}', Precio: {precio}, Disponible: {disponible}")
                    return {
                        "precio": precio,
                        "disponible": disponible,
                        "nombre": nombre
                    }
        except Exception as e:
            logger.debug(f"[{self.store_name}] Error parseando vtex.events.addData: {e}")

        # Si todas las estrategias fallan completamente, reportamos los valores nulos
        logger.warning(f"[{self.store_name}] No se pudo extraer la información del producto usando datos estructurados.")
        return {
            "precio": None,
            "disponible": False,
            "error": "No se encontró estructura semántica válida Schema.org (Product) ni variables globales VTEX con precio."
        }
