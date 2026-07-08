import logging
import json
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from playwright.async_api import Page

from ..base_scraper import BaseScraper
from ..utils.normalizers import clean_price

logger = logging.getLogger(__name__)


class VeaScraper(BaseScraper):
    """
    Scraper concreto para Vea (www.vea.com.ar)
    """

    def get_store_name(self) -> str:
        return "Vea"

    async def fetch_html(self, page: Page, url: str) -> str:
        """
        Carga la página y espera a que el contenido se cargue completamente.
        """
        logger.info(f"[{self.get_store_name()}] Navegando a la URL: {url}")

        await page.set_extra_http_headers({
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
        })

        try:
            response = await page.goto(url, wait_until="networkidle", timeout=60000)
        except Exception as e:
            logger.warning(f"[{self.get_store_name()}] Error al cargar {url}: {e}, continuando...")
            response = None

        if not response or response.status != 200:
            status_code = response.status if response else "Desconocido"
            logger.warning(f"[{self.get_store_name()}] Advertencia al cargar URL. Código HTTP: {status_code}")

        # Esperar un poco más para contenido dinámico
        await page.wait_for_timeout(3000)

        return await page.content()

    def parse(self, html: str, *args, **kwargs) -> Dict[str, Any]:
        """
        Parsea el HTML de una página de producto para extraer datos.
        Compatible con la clase base y con argumentos extra.
        """
        soup = BeautifulSoup(html, "html.parser")
        product_url = kwargs.get("product_url", "")
        
        nombre = None
        precio = None
        url_imagen = None
        disponible = True

        # Estrategia 1: JSON-LD (más fiable)
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

                            # Primero intentar con lowPrice (precio de oferta en negro)
                            raw_price = offer.get("lowPrice")
                            if not raw_price:
                                raw_price = offer.get("price")
                            precio = float(raw_price) if raw_price else None

                            # Obtener disponibilidad
                            availability = offer.get("availability")
                            disponible = "InStock" in availability if availability else True

                            image = item.get("image")
                            if isinstance(image, list) and len(image) > 0:
                                image = image[0]
                            url_imagen = image

                            logger.info(f"[{self.get_store_name()} JSON-LD] Datos extraídos: {nombre} - ${precio}")
                            return {
                                "nombre": nombre,
                                "precio": precio,
                                "url_imagen": url_imagen,
                                "url_producto": product_url,
                                "disponible": disponible
                            }
                except (json.JSONDecodeError, TypeError, ValueError):
                    continue
        except Exception as e:
            logger.warning(f"[{self.get_store_name()}] Error al parsear JSON-LD: {e}")

        # Estrategia 2: Selectores CSS específicos para la página de producto
        if not nombre:
            # Buscar nombre del producto (priorizar h2, luego h1, etc.)
            selectores_nombre = [
                "h2[class*='product']",
                "h2",
                "h1[class*='product-name']",
                "h1[class*='productName']",
                ".product-name",
                ".productName",
                "h1"
            ]
            for selector in selectores_nombre:
                name_elem = soup.select_one(selector)
                if name_elem:
                    nombre = name_elem.get_text(strip=True)
                    if nombre:
                        break

        if not precio:
            selectores_precio = [
                "[class*='selling-price']",
                "[class*='sellingPrice']",
                "[class*='price']:not([class*='old']):not([class*='tachado'])",
                ".vtex-store-components-3-x-sellingPrice",
                ".price"
            ]
            
            for selector in selectores_precio:
                price_elems = soup.select(selector)
                for price_elem in price_elems:
                    if price_elem:
                        texto = price_elem.get_text(strip=True)
                        if "$" in texto or any(c.isdigit() for c in texto):
                            precio = clean_price(texto)
                            if precio is not None:
                                break
                if precio is not None:
                    break

        if not url_imagen:
            img_elems = soup.select("img")
            for img_elem in img_elems:
                src = img_elem.get("src", "")
                data_src = img_elem.get("data-src", "")
                img_url = src if src else data_src
                
                if img_url and ("product" in img_url.lower() or "imagen" in img_url.lower()):
                    if not img_url.startswith("http"):
                        img_url = urljoin("https://www.vea.com.ar", img_url)
                    url_imagen = img_url
                    break

        return {
            "nombre": nombre,
            "precio": precio,
            "url_imagen": url_imagen,
            "url_producto": product_url,
            "disponible": disponible
        }

    async def search_and_scrape(self, page: Page, search_term: str, base_url: str = "https://www.vea.com.ar") -> List[Dict[str, Any]]:
        """
        Realiza una búsqueda interactuando con el buscador de la página y extrae **todos los productos de todas las páginas de paginación**.
        """
        logger.info(f"[{self.get_store_name()}] Navegando a la página principal: {base_url}")
        
        # 1. Navegar primero a la página principal
        await page.goto(base_url, wait_until="networkidle")
        
        # 2. Intentar encontrar y usar el buscador (probamos varios selectores comunes)
        search_input_selectors = [
            "input[type='search']",
            "input[name='q']",
            "input[placeholder*='buscar']",
            "input[class*='search']",
            "#search-input",
            ".search-input"
        ]
        
        found_search = False
        for sel in search_input_selectors:
            try:
                # Esperar un poco para que el buscador cargue
                await page.wait_for_selector(sel, timeout=5000)
                search_input = await page.query_selector(sel)
                if search_input:
                    logger.info(f"[{self.get_store_name()}] Encontrado buscador con selector: {sel}")
                    await search_input.fill(search_term)
                    found_search = True
                    
                    # Intentar enviar la búsqueda con Enter primero
                    await search_input.press("Enter")
                    break
            except:
                continue
        
        # Si no se pudo usar el buscador, intentar la URL directa como fallback
        if not found_search:
            logger.warning(f"[{self.get_store_name()}] No se pudo encontrar el buscador, usando URL directa")
            search_url = f"{base_url}/{search_term}"
            await page.goto(search_url, wait_until="networkidle")
        else:
            logger.info(f"[{self.get_store_name()}] Esperando resultados de búsqueda...")
            await page.wait_for_timeout(3000)  # Esperar que carguen los resultados

        # 3. Extraer productos de todas las páginas de paginación
        all_product_urls = set()
        current_page = 1
        
        while True:
            logger.info(f"[{self.get_store_name()}] Procesando página {current_page}")
            
            # Obtener el HTML de la página actual
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")
            
            # Extraer enlaces de productos de esta página
            all_links = soup.find_all("a", href=True)
            page_product_urls = set()
            for link in all_links:
                href = link.get("href", "")
                if href and ("/p/" in href or href.endswith("/p")):
                    full_url = urljoin(base_url, href)
                    page_product_urls.add(full_url)
            
            # Añadir a la lista general
            all_product_urls.update(page_product_urls)
            logger.info(f"[{self.get_store_name()}] Encontrados {len(page_product_urls)} productos en la página {current_page}")
            
            # Buscar enlace a la próxima página (VTEX usualmente usa "Siguiente" o clase "vtex-button-next")
            next_page_selectors = [
                "a[class*='next']",
                "button[class*='next']",
                "a[aria-label*='Siguiente']",
                ".vtex-button-next a",
                ".pagination-next a"
            ]
            
            next_page_url = None
            for sel in next_page_selectors:
                try:
                    next_link = soup.select_one(sel)
                    if next_link and next_link.get("href"):
                        href = next_link.get("href")
                        if href:
                            next_page_url = urljoin(base_url, href)
                            break
                except:
                    continue
            
            # Si no hay próxima página, terminar
            if not next_page_url:
                logger.info(f"[{self.get_store_name()}] No hay más páginas de resultados")
                break
            
            # Navegar a la próxima página
            current_page += 1
            logger.info(f"[{self.get_store_name()}] Navegando a la página {current_page}")
            await page.goto(next_page_url, wait_until="networkidle")
            await page.wait_for_timeout(2000)  # Esperar que cargue la página

        logger.info(f"[{self.get_store_name()}] Total de productos encontrados: {len(all_product_urls)}")
        
        # 4. Visitar cada producto para extraer los detalles completos
        results = []
        for i, product_url in enumerate(sorted(all_product_urls)):
            try:
                logger.info(f"[{self.get_store_name()}] Procesando {i+1}/{len(all_product_urls)}: {product_url}")
                product_html = await self.fetch_html(page, product_url)
                product_data = self.parse(product_html, product_url=product_url)
                
                if product_data.get("nombre"):
                    results.append(product_data)
                    logger.info(f"[{self.get_store_name()}] OK: {product_data['nombre']} - ${product_data['precio']}")
                else:
                    logger.warning(f"[{self.get_store_name()}] No se pudo extraer nombre de: {product_url}")
            
            except Exception as e:
                logger.warning(f"[{self.get_store_name()}] Error al procesar {product_url}: {e}", exc_info=True)
                continue

        return results
