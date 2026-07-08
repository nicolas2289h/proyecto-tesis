#!/usr/bin/env python
"""
Script de búsqueda interactiva para Vea.
Permite ingresar un término de búsqueda por consola, interactúa directamente con el buscador de la página,
y extrae todos los resultados con la misma lógica robusta.
"""

import asyncio
import logging
import json
import sys
import os

# Añadir el directorio scraper al path para importar módulos
scraper_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, scraper_dir)

from playwright.async_api import async_playwright

# Importamos directamente el scraper sin usar el paquete
from src.scrapers.vea_scraper import VeaScraper
from src.config import setup_logging
from src.utils.normalizers import format_price_arg

# Configurar logging
setup_logging()
logger = logging.getLogger("scraper.search_vea")


async def main_async():
    print("=" * 80)
    print("       SCRAPER DE BÚSQUEDA - VEA")
    print("=" * 80)
    print()
    
    # Pedir al usuario el término de búsqueda
    if len(sys.argv) > 1:
        search_term = " ".join(sys.argv[1:])
    else:
        search_term = input("Ingrese el producto que desea buscar (ej: 'fideos'): ").strip()
    
    if not search_term:
        logger.error("No se ingresó ningún término de búsqueda. Saliendo...")
        return
    
    print()
    logger.info(f"Iniciando búsqueda para: '{search_term}'")
    print()

    async with async_playwright() as p:
        # Lanzar navegador Chromium (visible para ver el proceso)
        browser = await p.chromium.launch(
            headless=False,
            args=["--disable-web-security", "--no-sandbox"]
        )

        # Crear contexto del navegador
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )

        page = await context.new_page()

        # Instanciar el scraper
        scraper = VeaScraper()

        # Realizar la búsqueda y scrapear resultados
        results = await scraper.search_and_scrape(page, search_term)

        # Cerrar recursos
        await context.close()
        await browser.close()

    # Mostrar resultados
    print()
    print("=" * 80)
    print(f"       RESULTADOS DE BÚSQUEDA PARA: '{search_term}'")
    print("=" * 80)
    print()
    
    if not results:
        logger.warning("No se encontraron resultados para la búsqueda.")
        print("No se encontraron productos.")
        return

    print(f"Se encontraron {len(results)} productos:")
    print()

    # Guardar resultados en un archivo JSON para mejor visualización
    output_file = os.path.join(scraper_dir, "resultados_vea.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=4)

    print(f"✅ Resultados guardados en: {output_file}")
    print()

    # Mostrar resumen de resultados en consola
    for i, product in enumerate(results, 1):
        print("-" * 80)
        print(f"📦 Producto {i}:")
        print(f"   Nombre:       {product.get('nombre', 'Sin nombre')}")
        precio = product.get('precio')
        print(f"   Precio:       {format_price_arg(precio)}")
        print(f"   Disponible:   {'✅ Sí' if product.get('disponible', True) else '❌ No'}")
        print(f"   URL Producto: {product.get('url_producto', 'No disponible')}")
        print(f"   URL Imagen:   {product.get('url_imagen', 'No disponible')}")
    
    print("\n" + "=" * 80)
    print("¡Scraping completado!")


def main():
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        logger.info("Ejecución cancelada manualmente por el usuario (Ctrl+C).")
    except Exception as e:
        logger.critical(f"Fallo catastrófico en la ejecución: {e}", exc_info=True)


if __name__ == "__main__":
    main()
