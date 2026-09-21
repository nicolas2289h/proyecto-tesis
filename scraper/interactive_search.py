#!/usr/bin/env python
"""
Scraper interactivo para Comodín en Casa.
Pide por consola el producto a buscar, realiza la búsqueda en el sitio
y muestra los resultados con: nombre, precio, descripción y URL de imagen.
"""

import asyncio
import sys
import logging
from typing import Dict, Any, List

from playwright.async_api import async_playwright, Page

from src.config import PLAYWRIGHT_HEADLESS, setup_logging
from src.scrapers.scraper_factory import ScraperFactory
from src.utils.normalizers import clean_price

setup_logging()
logger = logging.getLogger("interactive_search")

STORE_URL = "https://www.comodinencasa.com.ar/"


async def search_via_search_bar(page: Page, query: str) -> str:
    """
    Navega a la home, encuentra el buscador, escribe la consulta y envía el formulario.
    Retorna la URL final de resultados.
    """
    logger.info(f"Navegando a {STORE_URL} para usar el buscador del sitio...")
    await page.goto(STORE_URL, wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_timeout(3000)

    search_selectors = [
        'input[type="search"]',
        'input[placeholder*="buscar" i]',
        'input[name*="search" i]',
        'input[class*="search" i]',
        'input[id*="search" i]',
        'input[aria-label*="buscar" i]',
        'input[aria-label*="search" i]',
    ]

    search_input = None
    for sel in search_selectors:
        loc = page.locator(sel).first
        if await loc.count() > 0:
            try:
                await loc.wait_for(state="visible", timeout=3000)
                search_input = loc
                logger.info(f"Campo de búsqueda encontrado con selector: {sel}")
                break
            except Exception:
                continue

    if search_input is None:
        logger.warning("No se encontró el campo de búsqueda. Usando URL de búsqueda directa.")
        scraper = ScraperFactory.get_scraper(STORE_URL)
        return scraper.get_search_url(STORE_URL, query)

    try:
        await search_input.click()
        await page.wait_for_timeout(500)
        await search_input.fill(query)
        await page.wait_for_timeout(500)
        await search_input.press("Enter")
        await page.wait_for_timeout(4000)
        logger.info(f"Búsqueda enviada desde el buscador del sitio: '{query}'")
        return page.url
    except Exception as e:
        logger.warning(f"Error al interactuar con el buscador ({e}). Usando URL directa.")
        scraper = ScraperFactory.get_scraper(STORE_URL)
        return scraper.get_search_url(STORE_URL, query)


async def extract_descriptions_from_cards(page: Page, card_selector: str) -> List[str]:
    """
    Intenta extraer descripciones cortas de las tarjetas de producto en la grilla.
    Retorna una lista de descripciones (pueden ser strings vacíos).
    """
    js = """
    (selector) => {
        const cards = Array.from(document.querySelectorAll(selector));
        return cards.map(card => {
            let desc = "";
            const descEls = card.querySelectorAll(
                "[class*='description'], [class*='Description'], [class*='desc'], [class*='Desc'], p"
            );
            for (let el of descEls) {
                const t = (el.innerText || '').trim();
                if (t && t.length > 10 && t.length < 300) { desc = t; break; }
            }
            return desc;
        });
    }
    """
    try:
        return await page.evaluate(js, card_selector)
    except Exception:
        return []


async def enrich_with_description(
    page: Page,
    productos_raw: List[Dict[str, Any]],
    card_selector: str
) -> List[Dict[str, Any]]:
    """Agrega descripción a cada producto (a partir del título si no hay descripción)."""
    descripciones = await extract_descriptions_from_cards(page, card_selector)
    for i, prod in enumerate(productos_raw):
        desc = descripciones[i] if i < len(descripciones) else ""
        if not desc:
            desc = prod.get("titulo", "")
        prod["descripcion"] = desc
    return productos_raw


async def interactive_search(producto_buscar: str):
    """Ejecuta el flujo completo: buscar en Comodín y mostrar resultados formateados."""
    print("\n" + "=" * 70)
    print(f"  SCRAPER INTERACTIVO - Comodín en Casa")
    print(f"  Buscando: '{producto_buscar}'")
    print("=" * 70 + "\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=PLAYWRIGHT_HEADLESS,
            args=[
                "--disable-web-security",
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
                "--disable-dev-shm-usage",
                "--window-size=1280,800",
                "--lang=es-AR,es",
            ]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="es-AR",
            timezone_id="America/Argentina/Buenos_Aires",
        )
        page = await context.new_page()
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['es-AR', 'es', 'en'] });
            window.chrome = { runtime: {} };
        """)

        try:
            search_url = await search_via_search_bar(page, producto_buscar)
        except Exception as e:
            logger.error(f"Error accediendo al sitio: {e}")
            await context.close()
            await browser.close()
            return

        scraper = ScraperFactory.get_scraper(STORE_URL)

        print(f"URL de resultados: {search_url}")
        print("Extrayendo productos...\n")

        try:
            productos_raw = await scraper.extract_all_products_from_search(
                page, search_url, producto_buscar
            )
        except Exception as e:
            logger.error(f"Error extrayendo productos: {e}")
            productos_raw = []

        CARD_SELECTORS = [
            "div.product",
            "section[class*='vtex-product-summary']",
            "section[class*='product-summary']",
            "article[class*='product']",
            "div[class*='product-card']",
        ]
        card_selector_used = ""
        for sel in CARD_SELECTORS:
            if await page.locator(sel).count() > 0:
                card_selector_used = sel
                break
        if card_selector_used:
            productos_raw = await enrich_with_description(page, productos_raw, card_selector_used)

        await context.close()
        await browser.close()

    if not productos_raw:
        print("❌ No se encontraron productos para la búsqueda.")
        return

    print(f"✅ Se encontraron {len(productos_raw)} productos:\n")
    print("-" * 70)

    for idx, prod in enumerate(productos_raw, 1):
        titulo = prod.get("titulo", "Sin nombre")
        precio_texto = prod.get("precio_texto", "")
        precio_float = clean_price(precio_texto) if precio_texto else None
        descripcion = prod.get("descripcion") or titulo
        url_imagen = prod.get("url_imagen", "Sin imagen")
        url = prod.get("url", "Sin URL")

        precio_mostrar = precio_texto
        if precio_float is not None:
            precio_mostrar = f"${precio_float:,.2f}".replace(",", ".").replace(".", ",", 1) if False else f"${precio_float:,.2f}"

        print(f"\n📦 Producto #{idx}")
        print(f"  Nombre     : {titulo}")
        if precio_mostrar:
            print(f"  Precio     : {precio_mostrar}")
        else:
            print(f"  Precio     : (sin dato)")
        print(f"  Descripción: {descripcion[:120]}{'...' if len(descripcion) > 120 else ''}")
        print(f"  Imagen URL : {url_imagen}")
        print(f"  Producto URL: {url}")
        print("-" * 70)

    print("\n✅ Búsqueda completada.\n")


def main():
    print()
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║         SCRAPER INTERACTIVO - Búsqueda en Comodín en Casa           ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    query = ""
    while not query.strip():
        try:
            query = input("Ingrese el producto que desea buscar (ej: fideo): ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nOperación cancelada.")
            sys.exit(0)
        if not query:
            print("⚠️  Por favor ingrese un término de búsqueda.")

    try:
        asyncio.run(interactive_search(query))
    except KeyboardInterrupt:
        print("\n\nEjecución cancelada por el usuario.")
    except Exception as e:
        logger.critical(f"Error general: {e}", exc_info=True)


if __name__ == "__main__":
    main()
