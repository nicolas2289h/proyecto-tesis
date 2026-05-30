import asyncio
import random
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from playwright.async_api import async_playwright

from .config import (
    API_BASE_URL,
    SCRAPER_EMAIL,
    SCRAPER_PASSWORD,
    PLAYWRIGHT_HEADLESS,
    MIN_DELAY_SECONDS,
    MAX_DELAY_SECONDS,
    setup_logging
)
from .api_client import ApiClient
from .scrapers.scraper_factory import ScraperFactory

# Configurar logging centralizado
setup_logging()
logger = logging.getLogger("scraper.main")

async def process_target(target: Dict[str, Any], page, api_client: ApiClient) -> bool:
    """
    Procesa de manera secuencial un único objetivo de raspado.

    Args:
        target: Mapeo de producto del backend (contiene 'id' y 'urlEspecifica').
        page: Instancia de página activa de Playwright.
        api_client: Cliente de comunicación con el backend.

    Returns:
        bool: True si el precio se raspó y persistió exitosamente, False de lo contrario.
    """
    target_id = target.get("id")
    url = target.get("urlEspecifica")

    if not target_id or not url:
        logger.error(f"Objetivo de scraping inválido. Saltando. Contenido: {target}")
        return False

    logger.info(f"--- Procesando Objetivo ID {target_id} | URL: {url} ---")

    # 1. Obtener scraper correspondiente desde la fábrica
    scraper = ScraperFactory.get_scraper(url)
    if not scraper:
        logger.warning(f"No se encontró un scraper disponible para la URL: {url}. Saltando objetivo.")
        return False

    # 2. Aplicar Política de Cortesía (Delay Aleatorio) antes de iniciar la extracción
    delay = random.uniform(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS)
    logger.info(f"Aplicando política de cortesía: esperando {delay:.2f} segundos para mitigar bloqueos.")
    await asyncio.sleep(delay)

    # 3. Realizar la extracción dinâmica con Playwright y BeautifulSoup
    scraped_data = await scraper.scrape(page, url)

    # Validar resultados
    precio = scraped_data.get("precio")
    disponible = scraped_data.get("disponible", False)

    if precio is None:
        logger.error(f"Fallo al extraer el precio para el producto ID {target_id}. Motivo: {scraped_data.get('error', 'Selectores no coincidieron o sin stock')}")
        return False

    if not disponible:
        logger.warning(f"El producto con ID {target_id} figura sin stock (disponible = False). Se procederá a persistir el precio de igual manera.")

    # 4. Formatear fecha en formato ISO 8601 UTC esperado por el backend
    # Ej: '2026-05-27T00:49:15Z'
    fecha_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 5. Persistir el precio de vuelta al Backend
    try:
        success = api_client.post_price(
            producto_tienda_id=target_id,
            precio=precio,
            fecha_recoleccion=fecha_iso
        )
        return success
    except Exception as e:
        logger.error(f"Error inesperado al intentar guardar el precio en el backend: {e}")
        return False

async def main_async():
    """
    Función asíncrona principal que maneja el ciclo de vida del scraper.
    """
    logger.info("Iniciando orquestador del Scraper de Precios...")
    
    # 1. Inicializar cliente HTTP
    api_client = ApiClient(
        base_url=API_BASE_URL,
        email=SCRAPER_EMAIL,
        password=SCRAPER_PASSWORD
    )

    # 2. Obtener la lista de objetivos a raspar
    try:
        targets = api_client.get_scraping_targets()
    except Exception as e:
        logger.critical(f"No se pudieron cargar los objetivos de raspado del backend: {e}. Finalizando ejecución.")
        return

    if not targets:
        logger.info("No se encontraron objetivos de scraping registrados en el backend. Proceso terminado.")
        return

    # Métricas de ejecución
    stats = {
        "totales": len(targets),
        "exitos": 0,
        "fallos": 0,
        "omitidos": 0
    }

    # 3. Inicializar Playwright
    logger.info("Inicializando motor de renderizado dinámico Playwright (Modo Headless)...")
    async with async_playwright() as p:
        # Lanzar navegador Chromium
        browser = await p.chromium.launch(
            headless=PLAYWRIGHT_HEADLESS,
            args=["--disable-web-security", "--no-sandbox"]
        )
        
        # Crear contexto del navegador emulando una resolución estándar y User-Agent común
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        
        # Abrir pestaña única
        page = await context.new_page()

        # 4. Procesar secuencialmente cada producto
        for i, target in enumerate(targets):
            logger.info(f"Progreso actual: {i + 1}/{stats['totales']}")
            
            try:
                success = await process_target(target, page, api_client)
                if success:
                    stats["exitos"] += 1
                else:
                    stats["fallos"] += 1
            except Exception as e:
                logger.error(f"Excepción no controlada procesando objetivo {target}: {e}")
                stats["fallos"] += 1

        # Limpieza de recursos
        await context.close()
        await browser.close()

    # 5. Reportar Métricas Finales
    logger.info("==================================================")
    logger.info("RESUMEN DE EJECUCIÓN DEL SCRAPER")
    logger.info(f"Objetivos Totales: {stats['totales']}")
    logger.info(f"Registrados con Éxito: {stats['exitos']}")
    logger.info(f"Fallidos / Error: {stats['fallos']}")
    logger.info("==================================================")
    logger.info("Orquestador finalizado de manera correcta.")

def main():
    """
    Wrapper sincrónico para ejecutar el flujo asíncrono desde el exterior.
    """
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        logger.info("Ejecución cancelada manualmente por el usuario (Ctrl+C).")
    except Exception as e:
        logger.critical(f"Fallo catastrófico en la ejecución: {e}", exc_info=True)

if __name__ == "__main__":
    main()
