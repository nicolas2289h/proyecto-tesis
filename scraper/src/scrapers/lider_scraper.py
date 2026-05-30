import json
import logging
from typing import Dict, Any
from bs4 import BeautifulSoup

from ..base_scraper import BaseScraper
from ..utils.normalizers import clean_price, clean_stock

logger = logging.getLogger(__name__)

class LiderScraper(BaseScraper):
    """
    Scraper concreto para el supermercado Líder (Walmart).
    Implementa una arquitectura de extracción de triple contingencia:
    1. Intenta parsear datos estructurados JSON-LD (Schema.org).
    2. Busca e hidrata desde el tag script '__NEXT_DATA__' (NextJS State).
    3. Utiliza selectores CSS de fallback en caso de fallar los anteriores.
    """

    def get_store_name(self) -> str:
        return "Lider"

    def parse(self, html: str) -> Dict[str, Any]:
        soup = BeautifulSoup(html, "html.parser")
        
        precio = None
        disponible = True
        nombre = None

        # --- ESTRATEGIA 1: JSON-LD ---
        try:
            json_ld_tags = soup.find_all("script", type="application/ld+json")
            for tag in json_ld_tags:
                try:
                    data = json.loads(tag.string or "")
                    if isinstance(data, list):
                        data_list = data
                    else:
                        data_list = [data]

                    for item in data_list:
                        if item.get("@type") == "Product":
                            nombre = item.get("name")
                            offers = item.get("offers", {})
                            
                            if isinstance(offers, list) and len(offers) > 0:
                                offer = offers[0]
                            else:
                                offer = offers
                                
                            raw_price = offer.get("price")
                            if raw_price:
                                precio = float(raw_price)
                                
                            availability = offer.get("availability")
                            if availability:
                                disponible = "InStock" in availability or "OutOfStock" not in availability
                                
                            logger.info(f"[Lider JSON-LD] Datos extraídos. Nombre: {nombre}, Precio: {precio}, Disponible: {disponible}")
                            return {
                                "precio": precio,
                                "disponible": disponible,
                                "nombre": nombre
                            }
                except (json.JSONDecodeError, TypeError, ValueError):
                    continue
        except Exception as e:
            logger.warning(f"[Lider] Error al parsear JSON-LD: {e}")

        # --- ESTRATEGIA 2: NEXT.JS STATE (__NEXT_DATA__) ---
        # Walmart y Líder suelen construirse sobre Next.js. El estado inicial está en el DOM en formato JSON.
        try:
            next_data_tag = soup.find("script", id="__NEXT_DATA__")
            if next_data_tag and next_data_tag.string:
                next_data = json.loads(next_data_tag.string)
                
                # Intentar recorrer la estructura dinámica recursiva o buscar llaves conocidas
                # Dependiendo de la versión, puede estar en props.pageProps.initialState o props.pageProps.product
                props = next_data.get("props", {})
                page_props = props.get("pageProps", {})
                
                # Intentos de ruta común para producto en NextJS de Lider
                product_info = page_props.get("product") or page_props.get("initialState", {}).get("product", {})
                
                if product_info and isinstance(product_info, dict):
                    nombre = product_info.get("name") or product_info.get("displayName")
                    
                    # Extraer precio
                    price_info = product_info.get("price", {})
                    if isinstance(price_info, dict):
                        precio = price_info.get("salesPrice") or price_info.get("price")
                        
                    # Extraer disponibilidad
                    disponible = product_info.get("available", True) and not product_info.get("outOfStock", False)
                    
                    if precio is not None:
                        logger.info(f"[Lider NEXT_DATA] Extracción exitosa. Nombre: {nombre}, Precio: {precio}, Disponible: {disponible}")
                        return {
                            "precio": float(precio),
                            "disponible": disponible,
                            "nombre": nombre
                        }
        except Exception as e:
            logger.warning(f"[Lider] Error al parsear __NEXT_DATA__ de Next.js: {e}")

        # --- ESTRATEGIA 3: Selectores CSS (Fallback final) ---
        logger.info("[Lider CSS] Ejecutando selectores CSS de fallback.")

        # 1. Nombre del Producto
        name_tag = soup.select_one("h1, [class*='product-title'], [class*='productName']")
        if name_tag:
            nombre = name_tag.get_text(strip=True)

        # 2. Precio del Producto
        price_selectors = [
            "[data-testid='product-price']",
            ".product-price",
            "[class*='price-container']",
            ".sales-price",
            "[class*='salesPrice']",
            ".price"
        ]
        
        for selector in price_selectors:
            price_tag = soup.select_one(selector)
            if price_tag:
                raw_price_str = price_tag.get_text(strip=True)
                precio = clean_price(raw_price_str)
                if precio is not None:
                    break

        # 3. Disponibilidad / Stock
        # Líder suele deshabilitar los botones de "Agregar al carro" o mostrar "Sin Stock"
        stock_indicators = [
            "[class*='out-of-stock']",
            "[class*='outOfStock']",
            ".btn-add-to-cart:disabled",
            "[data-testid='out-of-stock-label']"
        ]
        
        for indicator in stock_indicators:
            indicator_tag = soup.select_one(indicator)
            if indicator_tag:
                text_content = indicator_tag.get_text(strip=True)
                disponible = clean_stock(text_content)
                if "agotado" in text_content.lower() or "sin stock" in text_content.lower() or indicator_tag:
                    disponible = False
                    break

        return {
            "precio": precio,
            "disponible": disponible,
            "nombre": nombre
        }
