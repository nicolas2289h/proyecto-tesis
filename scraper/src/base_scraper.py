from abc import ABC, abstractmethod
import logging
from typing import Dict, Any, Optional, List
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
        
        # Cargar la página esperando a que el DOM esté disponible
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

    def get_search_url(self, url_base: str, query: str) -> str:
        """
        Genera la URL de búsqueda universal según el supermercado.
        Utiliza el formato moderno de búsqueda inteligente (patrón VTEX /s/{query}).

        Args:
            url_base: URL base del supermercado.
            query: Término de búsqueda (por ejemplo, "arroz cañuelas").

        Returns:
            str: URL de búsqueda construida.
        """
        import urllib.parse
        encoded_query = urllib.parse.quote(query)
        return f"{url_base.rstrip('/')}/s/{encoded_query}"

    async def extract_product_url(self, page: Page, search_url: str, name: str, brand: Optional[str] = None) -> Optional[str]:
        """
        Navega a la URL de búsqueda y extrae la URL del primer producto encontrado.

        Args:
            page: Objeto Page activo de Playwright.
            search_url: URL de la página de búsqueda.
            name: Nombre genérico del producto (ej: "arroz") para validar.
            brand: Marca opcional del producto (ej: "cañuelas") para validar.

        Returns:
            Optional[str]: URL absoluta del primer producto que coincide o None si no se encuentra.
        """
        store = self.get_store_name()
        logger.info(f"[{store}] Buscando producto en la página de resultados: {search_url} (Filtro: {name} | {brand or 'Sin Marca'})")
        
        await page.set_extra_http_headers({
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
        })
        
        # Cargar la página de búsqueda
        response = await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        
        if not response or response.status != 200:
            status_code = response.status if response else "Desconocido"
            logger.warning(f"[{store}] Advertencia al cargar la página de búsqueda. Código HTTP: {status_code}")
            
        # Esperar a que el listado o grilla de productos se dibuje en el DOM (máximo 8 segundos)
        try:
            await page.wait_for_selector('#gallery-layout, .search-result-main, .search-results, .vitrine, [class*="gallery"], [class*="search-result"]', timeout=8000)
        except Exception:
            # Si no aparece en 8s, continuamos con lo que haya cargado
            pass
            
        # Ejecutar script en el navegador para encontrar el primer link de producto que no sea cabecera/pie
        # y que contenga la palabra clave del producto y de la marca usando coincidencia simplificada (fuzzy)
        found_url = await page.evaluate(r"""
            (args) => {
                const simplify = (str) => {
                    if (!str) return "";
                    return str.toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/[^a-z0-9]/g, "")
                              .replace(/(.)\1+/g, "$1");
                };

                const cleanName = simplify(args.name);
                const cleanBrand = simplify(args.brand);

                // Contenedores comunes para grillas de resultados de búsqueda
                const searchContainers = [
                    '#gallery-layout',
                    '.search-result-main',
                    '.search-results',
                    '.vitrine',
                    '[class*="gallery"]',
                    '[class*="search-result"]',
                    'main'
                ];
                
                let container = null;
                for (const selector of searchContainers) {
                    const el = document.querySelector(selector);
                    if (el) {
                        container = el;
                        break;
                    }
                }

                const root = container || document;
                const links = Array.from(root.querySelectorAll('a'));
                
                for (const link of links) {
                    const href = link.href;
                    if (!href) continue;
                    
                    // Si buscamos en todo el documento, omitimos header/nav/footer
                    if (!container && (link.closest('header') || link.closest('nav') || link.closest('footer'))) {
                        continue;
                    }
                    
                    const pathname = (link.pathname || '').toLowerCase();
                    const linkText = (link.innerText || '').toLowerCase();
                    
                    const isProductUrl = (
                        (pathname.includes('/product/') || pathname.match(/\/p($|\?|\/)/)) &&
                        !pathname.includes('/busca') &&
                        !pathname.includes('/search') &&
                        !pathname.includes('/login') &&
                        !pathname.includes('/checkout') &&
                        !pathname.includes('/cart')
                    );
                    
                    if (isProductUrl) {
                        const cleanPath = simplify(pathname);
                        const cleanText = simplify(linkText);
                        
                        // Comprobar que contenga las palabras clave del nombre
                        const matchesName = cleanPath.includes(cleanName) || cleanText.includes(cleanName);
                        
                        // Si hay una marca especificada, debe coincidir también la marca
                        let matchesBrand = true;
                        if (cleanBrand) {
                            matchesBrand = cleanPath.includes(cleanBrand) || cleanText.includes(cleanBrand);
                        }
                        
                        if (matchesName && matchesBrand) {
                            return href;
                        }
                    }
                }
                return null;
            }
        """, {"name": name, "brand": brand})
        
        if found_url:
            logger.info(f"[{store}] URL de producto encontrada mediante búsqueda: {found_url}")
            return found_url
        else:
            logger.warning(f"[{store}] No se pudo extraer la URL del producto de la página de búsqueda.")
            return None

    async def extract_all_products_from_search(
        self,
        page: Page,
        search_url: str,
        keyword: str
    ) -> List[Dict[str, Any]]:
        """
        Navega a la URL de búsqueda y extrae TODOS los productos visibles en la
        primera página de resultados (grilla/vitrina).

        A diferencia de ``extract_product_url`` (que devuelve solo el primer resultado),
        este método aplica un bucle sobre todos los elementos de la grilla usando
        la API ``.all()`` de Playwright, extrayendo por cada tarjeta:

        - ``titulo``: Texto del nombre del producto en la tarjeta.
        - ``url``: URL absoluta de la página del producto.
        - ``precio_texto``: Precio crudo renderizado (string), para que el backend
          aplique su normalización inteligente. Puede ser None si la tarjeta no lo muestra.

        Args:
            page:       Objeto Page activo de Playwright.
            search_url: URL de la página de resultados de búsqueda.
            keyword:    Término de búsqueda original (para logging y contexto).

        Returns:
            List[Dict]: Lista de diccionarios con claves ``titulo``, ``url``, ``precio_texto``.
                        Lista vacía si no se encontraron productos.
        """
        store = self.get_store_name()
        logger.info(f"[{store}] Extrayendo todos los productos para keyword='{keyword}' en: {search_url}")

        await page.set_extra_http_headers({
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
        })

        # Cargar la página de búsqueda
        # Usamos 'domcontentloaded' para evitar esperas infinitas de trackers de terceros y analytics.
        # Las vitrinas/grillas de VTEX e IO se renderizan dinámicamente y se gestionan con esperas fijas y scrolls.
        response = await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        if not response or response.status != 200:
            status_code = response.status if response else "Desconocido"
            logger.warning(f"[{store}] Advertencia al cargar búsqueda '{keyword}'. HTTP: {status_code}")

        # Esperar a que la grilla de productos esté presente en el DOM
        # En sitios como VTEX, forzamos un scroll iterativo para disparar el lazy load
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 3);")
        await page.wait_for_timeout(1000)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 1.5);")
        await page.wait_for_timeout(1000)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
        await page.wait_for_timeout(2000)

        GRILLA_SELECTORS = [
            "#gallery-layout",
            "[class*='vtex-search-result']",
            ".search-result-main",
            ".search-results",
            ".vitrine",
            "[class*='gallery']",
            "[class*='search-result']",
            "[class*='product-list']",
            "[class*='shelf']",
            "main",
        ]
        for selector in GRILLA_SELECTORS:
            try:
                await page.wait_for_selector(selector, timeout=6000)
                logger.debug(f"[{store}] Grilla encontrada con selector: {selector}")
                break
            except Exception:
                continue

        # Breve espera adicional para renderizado de JS reactivo
        await page.wait_for_timeout(2000)

        # ── Selectores de tarjetas de producto ───────────────────────────────
        # Confirmado por diagnóstico en Comodín (VTEX Legacy): tarjeta raíz = div.product
        CARD_SELECTORS = [
            "div.product",                          # Comodín (VTEX Legacy - Confirmado)
            "section[class*='vtex-product-summary']",  # VTEX IO moderno
            "section[class*='product-summary']",
            "article[class*='product']",
            "div[class*='product-card']",
            "div[class*='productCard']",
            "li[class*='product']",
            "[class*='shelf-item']",
            "[class*='shelfItem']",
            "[data-testid*='product']",
        ]

        productos_encontrados: List[Dict[str, Any]] = []

        for card_selector in CARD_SELECTORS:
            # Comprobamos rápido si hay elementos en el DOM con este selector
            count = await page.locator(card_selector).count()
            if count == 0:
                continue

            logger.info(f"[{store}] Se encontraron {count} tarjetas con selector '{card_selector}'. Extrayendo datos...")

            # ── Extraer tarjetas usando JavaScript en el navegador (mucho más rápido) ──
            js_script = """
            (selector) => {
                const cards = Array.from(document.querySelectorAll(selector));
                return cards.map(card => {
                    // Extraer Título: buscar elementos con clases de nombre o h1/h2/h3
                    let titulo = "";
                    const titleEls = card.querySelectorAll(
                        "[class*='product-name'], [class*='productName'], [class*='name'], h1, h2, h3, span[class*='title']"
                    );
                    for (let el of titleEls) {
                        const t = (el.innerText || '').trim();
                        if (t) { titulo = t; break; }
                    }
                    if (!titulo) titulo = (card.innerText || '').trim().substring(0, 120);

                    // Extraer URL: primer <a> con href que contenga '/p' (URL de producto)
                    let url = "";
                    const links = card.querySelectorAll('a[href]');
                    for (let a of links) {
                        if (a.href && (a.href.includes('/p') || a.href.includes('/produto'))) {
                            url = a.href;
                            break;
                        }
                    }
                    // Fallback: cualquier <a> dentro de la tarjeta
                    if (!url) {
                        const a = card.querySelector('a[href]');
                        if (a) url = a.href;
                    }

                    // Extraer Precio: el precio REAL es el texto directo de .offer-price
                    // (excluyendo el span.regular-price hijo que es el precio TACHADO/original)
                    // HTML real de Comodín: <div class="offer-price">$659,19 <span class="regular-price">$823,99</span></div>
                    let precio_texto = "";

                    // Estrategia 1: texto directo de .offer-price (solo nodos TEXT_NODE, sin hijos)
                    const offerPriceEl = card.querySelector('.offer-price');
                    if (offerPriceEl) {
                        const directText = Array.from(offerPriceEl.childNodes)
                            .filter(n => n.nodeType === 3) // TEXT_NODE = 3
                            .map(n => n.textContent)
                            .join('')
                            .trim();
                        if (directText.includes('$') || directText.match(/[0-9]/)) {
                            precio_texto = directText;
                        }
                    }

                    // Estrategia 2 (fallback - sin descuento): buscar .regular-price como precio único
                    // Solo si NO hay .offer-price (producto sin descuento, precio único)
                    if (!precio_texto && !offerPriceEl) {
                        const regularPrice = card.querySelector('.regular-price');
                        if (regularPrice) {
                            precio_texto = (regularPrice.innerText || '').trim().split('\\n')[0].trim();
                        }
                    }

                    // Estrategia 3 (fallback genérico): cualquier elemento con clase de precio
                    if (!precio_texto) {
                        const priceEls = Array.from(card.querySelectorAll(
                            "[class*='price'], [class*='Price'], [class*='valor'], [class*='amount'], strong"
                        ));
                        
                        // 3.1. Intentar encontrar específicamente el sellingPrice / precio de venta (descartando listPrice)
                        let sellingPriceEl = null;
                        for (let el of priceEls) {
                            const className = el.className || "";
                            const classStr = typeof className === 'string' ? className : "";
                            
                            // Excluir precios tachados o de lista o de ahorro
                            if (classStr.includes('listPrice') || 
                                classStr.includes('list-price') || 
                                classStr.includes('strike') || 
                                classStr.includes('savings') ||
                                classStr.includes('regular-price') ||
                                classStr.includes('regularPrice') ||
                                el.querySelector('.strike') ||
                                el.classList.contains('strike')) {
                                continue;
                            }
                            
                            // Si contiene sellingPrice o bestPrice, tiene prioridad alta
                            if (classStr.includes('sellingPrice') || 
                                classStr.includes('selling-price') || 
                                classStr.includes('bestPrice') || 
                                classStr.includes('best-price')) {
                                sellingPriceEl = el;
                                break;
                            }
                        }
                        
                        // 3.2. Si encontramos un sellingPrice explícito, usarlo
                        if (sellingPriceEl) {
                            const firstLine = (sellingPriceEl.innerText || '').trim().split('\\n')[0].trim();
                            if (firstLine.includes('$')) {
                                precio_texto = firstLine;
                            }
                        }
                        
                        // 3.3. Si no hay sellingPrice explícito, tomar el primer elemento con $ que no sea tachado
                        if (!precio_texto) {
                            for (let el of priceEls) {
                                const className = el.className || "";
                                const classStr = typeof className === 'string' ? className : "";
                                
                                if (classStr.includes('listPrice') || 
                                    classStr.includes('list-price') || 
                                    classStr.includes('strike') || 
                                    classStr.includes('savings') ||
                                    classStr.includes('regular-price') ||
                                    classStr.includes('regularPrice') ||
                                    el.classList.contains('strike')) {
                                    continue;
                                }
                                const firstLine = (el.innerText || '').trim().split('\\n')[0].trim();
                                if (firstLine.includes('$')) { 
                                    precio_texto = firstLine; 
                                    break; 
                                }
                            }
                        }
                    }

                    return { titulo, url, precio_texto };
                });
            }
            """
            extracted_cards = await page.evaluate(js_script, card_selector)

            for item in extracted_cards:
                if not item["url"]:
                    continue

                url_producto = item["url"]
                if url_producto.startswith("/"):
                    from urllib.parse import urlparse
                    parsed = urlparse(search_url)
                    url_producto = f"{parsed.scheme}://{parsed.netloc}{url_producto}"

                productos_encontrados.append({
                    "titulo": item["titulo"],
                    "url": url_producto,
                    "precio_texto": item["precio_texto"]
                })

            # Si ya encontramos productos con este selector, no seguimos iterando
            if productos_encontrados:
                break

        logger.info(f"[{store}] Extracción completada para '{keyword}': {len(productos_encontrados)} productos.")
        return productos_encontrados
