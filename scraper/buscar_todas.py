#!/usr/bin/env python
"""
Script de búsqueda interactiva para Comodín en Casa, Vea y Dia.
Permite ingresar un producto por consola y genera 3 JSONs separados.
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
from src.scrapers.comodinencasa_scraper import ComodinEncasaScraper
from src.scrapers.vea_scraper import VeaScraper
from src.scrapers.dia_scraper import DiaScraper
from src.config import setup_logging
from src.utils.normalizers import format_price_arg

# Configurar logging
setup_logging()
logger = logging.getLogger("scraper.search_all")


async def scrape_store(page, scraper, search_term, output_filename):
    """Helper para raspar una tienda y guardar los resultados"""
    try:
        logger.info(f"\n{'='*60}")
        logger.info(f"  INICIANDO RASPADO PARA: {scraper.get_store_name()}")
        logger.info(f"{'='*60}")
        
        results = await scraper.search_and_scrape(page, search_term)
        
        # Guardar resultados
        output_path = os.path.join(scraper_dir, output_filename)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=4)
            
        logger.info(f"  ✅ {len(results)} productos guardados en {output_filename}")
        
        # Imprimir resumen
        print(f"\n{scraper.get_store_name()}:")
        print(f"  Total productos: {len(results)}")
        if results:
            precio = results[0].get('precio')
            precio_str = format_price_arg(precio)
            print(f"  Ejemplo: {results[0].get('nombre', 'Sin nombre')} - {precio_str}")
        
        return results
    except Exception as e:
        logger.error(f"  ❌ Error al raspar {scraper.get_store_name()}: {e}", exc_info=True)
        return []


async def main_async():
    print("="*60)
    print("  SCRAPER DE BÚSQUEDA - 3 TIENDAS: COMODÍN, VEA & DIA")
    print("="*60)
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
    logger.info(f"  Buscando: '{search_term}' en las 3 tiendas")
    print()

    async with async_playwright() as p:
        # Lanzar navegador Chromium
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

        # Raspado de cada tienda
        all_results = {}
        
        all_results["comodinencasa"] = await scrape_store(
            page, ComodinEncasaScraper(), search_term, "resultados_comodinencasa.json"
        )
        
        all_results["vea"] = await scrape_store(
            page, VeaScraper(), search_term, "resultados_vea.json"
        )
        
        all_results["dia"] = await scrape_store(
            page, DiaScraper(), search_term, "resultados_dia.json"
        )

        # Cerrar recursos
        await context.close()
        await browser.close()

    # Resumen final
    print()
    print("="*60)
    print("  RESUMEN TOTAL")
    print("="*60)
    for store_name, results in all_results.items():
        print(f"{store_name}: {len(results)} productos")
    print()
    print("  ¡Raspado completado! 🎉")


def main():
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        logger.info("Ejecución cancelada manualmente por el usuario (Ctrl+C).")
    except Exception as e:
        logger.critical(f"Fallo catastrófico en la ejecución: {e}", exc_info=True)


if __name__ == "__main__":
    main()
