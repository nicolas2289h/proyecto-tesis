import asyncio
import random
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

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
from .utils.normalizers import clean_price, parse_weight

# Configurar logging centralizado
setup_logging()
logger = logging.getLogger("scraper.main")

async def process_target(target: Dict[str, Any], page, api_client: ApiClient) -> bool:
    """
    Procesa de manera secuencial un único objetivo de raspado.

    Args:
        target: Mapeo de producto del backend (contiene 'id', 'urlEspecifica', etc.).
        page: Instancia de página activa de Playwright.
        api_client: Cliente de comunicación con el backend.

    Returns:
        bool: True si el precio se raspó y persistió exitosamente, False de lo contrario.
    """
    target_id = target.get("id")
    url = target.get("urlEspecifica")
    url_base = target.get("supermercadoUrlBase")
    nombre_prod = target.get("productoNombre")
    marca_prod = target.get("productoMarca")

    if not target_id:
        logger.error(f"Objetivo de scraping inválido. No tiene ID. Contenido: {target}")
        return False

    is_search_needed = not url

    if is_search_needed and (not url_base or not nombre_prod):
        logger.error(f"Objetivo sin URL específica y sin datos suficientes para buscar (nombre/urlBase). Saltando. Contenido: {target}")
        return False

    # 1. Obtener scraper correspondiente desde la fábrica usando la URL específica o la URL base
    scraper_url = url if url else url_base
    scraper = ScraperFactory.get_scraper(scraper_url)
    if not scraper:
        logger.warning(f"No se encontró un scraper disponible para: {scraper_url}. Saltando objetivo.")
        return False

    # 2. Aplicar Política de Cortesía (Delay Aleatorio) antes de iniciar
    delay = random.uniform(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS)
    logger.info(f"Aplicando política de cortesía: esperando {delay:.2f} segundos para mitigar bloqueos.")
    await asyncio.sleep(delay)

    # 3. Si no tenemos la URL específica, realizar la búsqueda para obtenerla
    if is_search_needed:
        query = f"{nombre_prod} {marca_prod or ''}".strip()
        search_url = scraper.get_search_url(url_base, query)
        logger.info(f"--- Buscando URL específica para '{query}' en {scraper.get_store_name()} ---")
        
        try:
            url = await scraper.extract_product_url(page, search_url, nombre_prod, marca_prod)
            if not url:
                logger.error(f"No se pudo encontrar un producto para la búsqueda: '{query}'")
                return False
                
            # Actualizar la URL en el backend para evitar búsquedas futuras
            logger.info(f"Guardando URL encontrada en el backend para el producto ID {target_id}: {url}")
            update_payload = {
                "id": target_id,
                "productoId": target.get("productoId"),
                "productoNombre": nombre_prod,
                "productoMarca": marca_prod,
                "supermercadoId": target.get("supermercadoId"),
                "supermercadoNombre": target.get("supermercadoNombre"),
                "supermercadoUrlBase": url_base,
                "urlEspecifica": url,
                "codigoExterno": target.get("codigoExterno")
            }
            api_client.update_producto_tienda(target_id, update_payload)
            target["urlEspecifica"] = url
        except Exception as e:
            logger.error(f"Error al buscar o guardar la URL del producto '{query}': {e}")
            return False

        # Aplicar un breve retraso adicional tras la búsqueda antes de ir a los detalles
        await asyncio.sleep(1.5)

    logger.info(f"--- Procesando Objetivo ID {target_id} | URL: {url} ---")

    # 4. Realizar la extracción dinâmica con Playwright y BeautifulSoup
    scraped_data = await scraper.scrape(page, url)

    # Validar resultados
    precio = scraped_data.get("precio")
    disponible = scraped_data.get("disponible", False)

    if precio is None:
        logger.error(f"Fallo al extraer el precio para el producto ID {target_id}. Motivo: {scraped_data.get('error', 'Selectores no coincidieron o sin stock')}")
        return False

    if not disponible:
        logger.warning(f"El producto con ID {target_id} figura sin stock (disponible = False). Se procederá a persistir el precio de igual manera.")

    # 5. Formatear fecha en formato ISO 8601 UTC esperado por el backend
    # Ej: '2026-05-27T00:49:15Z'
    fecha_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 6. Persistir el precio de vuelta al Backend
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
        logger.info("No se encontraron objetivos legacy registrados. Saltando fase 1...")
        targets = []

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

    # 6. Ejecutar Modo Descubrimiento Automático de Catálogo
    logger.info("Iniciando segunda fase: Modo Descubrimiento Automático...")
    async with async_playwright() as p2:
        browser2 = await p2.chromium.launch(
            headless=PLAYWRIGHT_HEADLESS,
            args=["--disable-web-security", "--no-sandbox"]
        )
        context2 = await browser2.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page2 = await context2.new_page()
        await discovery_mode_run(api_client, page2)
        await context2.close()
        await browser2.close()


async def discovery_mode_run(api_client: ApiClient, page) -> None:
    """
    Modo de Descubrimiento Automático de Catálogo.

    Ejecuta el flujo de extracción masiva:
    1. Obtiene del backend los targets (supermercado × palabraClave).
    2. Para cada combinación, navega a la grilla de búsqueda del supermercado.
    3. Extrae todas las tarjetas de productos visibles (primera página).
    4. Construye el payload DTO enriquecido con parse_weight().
    5. Envía el lote al endpoint POST /api/v1/extractor/ingesta-masiva.

    Args:
        api_client: Cliente HTTP autenticado con el backend.
        page:       Instancia de página activa de Playwright.
    """
    logger.info("════════════════════════════════════════════════════════")
    logger.info("MODO DESCUBRIMIENTO: Iniciando poblamiento automático de catálogo.")
    logger.info("════════════════════════════════════════════════════════")

    # 1. Obtener targets del backend
    try:
        targets = api_client.get_extraction_targets()
    except Exception as e:
        logger.critical(f"[Discovery] No se pudieron cargar los targets: {e}. Abortando modo descubrimiento.")
        return

    if not targets:
        logger.info("[Discovery] No hay targets configurados. Agregá criterios_busqueda y supermercados en el backend.")
        return

    logger.info(f"[Discovery] {len(targets)} combinaciones supermercado×keyword a procesar.")

    stats_discovery = {"procesados": 0, "items_totales": 0, "nuevos": 0, "unificados": 0, "errores": 0}

    for target in targets:
        supermercado_id   = target.get("supermercadoId")
        supermercado_nombre = target.get("supermercadoNombre", "Desconocido")
        url_base          = target.get("urlBase", "")
        palabra_clave     = target.get("palabraClave", "")

        if not url_base or not palabra_clave:
            logger.warning(f"[Discovery] Target incompleto (sin urlBase o palabraClave): {target}")
            continue

        # Política de cortesía entre supermercados
        delay = random.uniform(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS)
        logger.info(f"[Discovery] [{supermercado_nombre}] Buscando '{palabra_clave}'. Espera cortesía: {delay:.1f}s")
        await asyncio.sleep(delay)

        # 2. Obtener scraper e instanciar
        scraper = ScraperFactory.get_scraper(url_base)
        if not scraper:
            logger.warning(f"[Discovery] No hay scraper para '{url_base}'. Omitiendo.")
            continue

        # 3. Construir URL de búsqueda y extraer tarjetas de la grilla
        search_url = scraper.get_search_url(url_base, palabra_clave)
        try:
            productos_raw: List[Dict[str, Any]] = await scraper.extract_all_products_from_search(
                page, search_url, palabra_clave
            )
        except Exception as e:
            logger.error(f"[Discovery] Error extrayendo grilla de '{palabra_clave}' en {supermercado_nombre}: {e}")
            stats_discovery["errores"] += 1
            continue

        if not productos_raw:
            logger.warning(f"[Discovery] Sin resultados para '{palabra_clave}' en {supermercado_nombre}.")
            continue

        logger.info(f"[Discovery] [{supermercado_nombre}] '{palabra_clave}' → {len(productos_raw)} tarjetas extraídas.")

        # 4. Construir payload de ingesta masiva
        items_ingesta: List[Dict[str, Any]] = []
        for prod in productos_raw:
            titulo = prod.get("titulo") or ""
            url_producto = prod.get("url") or ""
            precio_texto = prod.get("precio_texto")

            if not titulo or not url_producto:
                continue

            # Parsear precio usando normalizer existente
            precio_float: float | None = None
            if precio_texto:
                from .utils.normalizers import clean_price
                precio_float = clean_price(precio_texto)

            items_ingesta.append({
                "textoCrudoTienda":   titulo,
                "urlEspecifica":      url_producto,
                "precioActual":       precio_float,
                "disponibilidad":     True,
                "supermercadoId":     supermercado_id,
                "palabraClaveBuscada": palabra_clave,
            })

        stats_discovery["procesados"] += 1
        stats_discovery["items_totales"] += len(items_ingesta)

        if not items_ingesta:
            logger.warning(f"[Discovery] Sin ítems válidos para enviar de '{palabra_clave}' en {supermercado_nombre}.")
            continue

        # 5. Enviar batch al backend
        try:
            resultado = api_client.post_ingesta_masiva(items_ingesta)
            stats_discovery["nuevos"]      += resultado.get("nuevosProductos", 0)
            stats_discovery["unificados"]  += resultado.get("productosUnificados", 0)
        except Exception as e:
            logger.error(f"[Discovery] Error enviando ingesta de '{palabra_clave}' en {supermercado_nombre}: {e}")
            stats_discovery["errores"] += 1

    # Reporte final del modo descubrimiento
    logger.info("════════════════════════════════════════════════════════")
    logger.info("RESUMEN MODO DESCUBRIMIENTO")
    logger.info(f"  Targets procesados:    {stats_discovery['procesados']}")
    logger.info(f"  Ítems enviados:        {stats_discovery['items_totales']}")
    logger.info(f"  Productos nuevos:      {stats_discovery['nuevos']}")
    logger.info(f"  Productos unificados:  {stats_discovery['unificados']}")
    logger.info(f"  Errores:               {stats_discovery['errores']}")
    logger.info("════════════════════════════════════════════════════════")


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
