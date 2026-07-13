package com.tesis.demo.service;

import com.tesis.demo.dto.IngestaResultadoDto;
import com.tesis.demo.dto.ItemIngestaDto;
import com.tesis.demo.dto.ProductoNormalizadoDto;
import com.tesis.demo.model.*;
import com.tesis.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implementación del servicio de ingesta masiva.
 *
 * <p>Por cada {@link ItemIngestaDto} recibido del scraper, ejecuta el siguiente pipeline:</p>
 * <ol>
 *   <li>Normaliza el texto crudo mediante {@link NormalizacionService}.</li>
 *   <li>Busca en la BD un producto con las mismas características (similitud Jaro-Winkler ≥ 0.92).</li>
 *   <li>Si no existe → crea un nuevo {@link Producto} en el catálogo maestro.</li>
 *   <li>Verifica si ya existe el mapeo {@link ProductoTienda} para ese par (producto, supermercado).</li>
 *   <li>Si no existe → crea el mapeo con la URL específica.</li>
 *   <li>Persiste el precio actual en {@link HistorialPrecio}.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class IngestaServiceImpl implements IngestaService {

    private static final Logger log = LoggerFactory.getLogger(IngestaServiceImpl.class);
    private static final double UMBRAL_SIMILITUD = 0.92;

    private final NormalizacionService normalizacionService;
    private final ProductoRepository productoRepository;
    private final ProductoTiendaRepository productoTiendaRepository;
    private final HistorialPrecioRepository historialPrecioRepository;
    private final SupermercadoRepository supermercadoRepository;
    private final CriterioBusquedaRepository criterioBusquedaRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional
    public IngestaResultadoDto procesarIngestaMasiva(List<ItemIngestaDto> items) {
        int procesados = 0;
        int nuevosProductos = 0;
        int productosUnificados = 0;
        int preciosRegistrados = 0;
        int errores = 0;

        for (ItemIngestaDto item : items) {
            procesados++;
            try {
                boolean esNuevo = procesarItem(item);
                if (esNuevo) {
                    nuevosProductos++;
                } else {
                    productosUnificados++;
                }
                preciosRegistrados++;
            } catch (IllegalArgumentException e) {
                errores++;
                log.warn("[IngestaService] Ítem omitido por validación semántica: {}", e.getMessage());
            } catch (Exception e) {
                errores++;
                log.error("[IngestaService] Error inesperado procesando ítem '{}' del supermercado {}: {}",
                        item.getTextoCrudoTienda(), item.getSupermercadoId(), e.getMessage(), e);
            }
        }

        log.info("[IngestaService] Ingesta masiva completada. Procesados: {}, Nuevos: {}, Unificados: {}, Precios: {}, Errores: {}",
                procesados, nuevosProductos, productosUnificados, preciosRegistrados, errores);

        return IngestaResultadoDto.builder()
                .procesados(procesados)
                .nuevosProductos(nuevosProductos)
                .productosUnificados(productosUnificados)
                .preciosRegistrados(preciosRegistrados)
                .errores(errores)
                .build();
    }

    /**
     * Procesa un único ítem del scraper.
     *
     * @return true si se creó un producto nuevo, false si se unificó con uno existente
     */
    private boolean procesarItem(ItemIngestaDto item) {
        // ── PASO 0: Validar compatibilidad semántica del ítem ─────────────────
        if (!normalizacionService.esItemCompatible(item.getTextoCrudoTienda(), item.getPalabraClaveBuscada())) {
            throw new IllegalArgumentException(String.format("El producto '%s' no es compatible con el término de búsqueda '%s'",
                    item.getTextoCrudoTienda(), item.getPalabraClaveBuscada()));
        }

        // ── PASO 1: Normalizar el texto crudo ─────────────────────────────────
        ProductoNormalizadoDto normalizado = normalizacionService.normalizar(
                item.getTextoCrudoTienda(),
                item.getPalabraClaveBuscada()
        );
        log.debug("[IngestaService] Normalizado: {} | Marca: {} | Variante: {} | Peso: {} {}",
                normalizado.getNombreGenerico(), normalizado.getMarca(),
                normalizado.getVarianteEspecifica(), normalizado.getPesoValor(), normalizado.getPesoUnidad());

        // ── PASO 2: Buscar producto similar en la BD ──────────────────────────
        List<Producto> candidatos = productoRepository
                .findAllByNombreGenericoIgnoreCase(normalizado.getNombreGenerico());

        Optional<Producto> match = candidatos.stream()
                .filter(c -> normalizacionService.esSimilar(c, normalizado, UMBRAL_SIMILITUD))
                .findFirst();

        boolean esNuevo = match.isEmpty();
        Producto producto;

        if (esNuevo) {
            // ── PASO 3a: Insertar nuevo producto maestro ───────────────────────
            Categoria categoria = resolverCategoria(item.getPalabraClaveBuscada());
            producto = new Producto();
            producto.setNombreGenerico(normalizado.getNombreGenerico());
            producto.setMarca(normalizado.getMarca());
            producto.setVarianteEspecifica(normalizado.getVarianteEspecifica());
            producto.setPesoValor(normalizado.getPesoValor());
            producto.setPesoUnidad(normalizado.getPesoUnidad());
            producto.setCategoria(categoria);
            producto = productoRepository.save(producto);
            log.info("[IngestaService] Nuevo producto creado: ID={} | {}",
                    producto.getId(), item.getTextoCrudoTienda());
        } else {
            // ── PASO 3b: Reusar el producto existente ──────────────────────────
            producto = match.get();
            log.debug("[IngestaService] Producto unificado: ID={} con texto '{}'",
                    producto.getId(), item.getTextoCrudoTienda());
        }

        // ── PASO 4: Obtener supermercado ──────────────────────────────────────
        Supermercado supermercado = supermercadoRepository.findById(item.getSupermercadoId())
                .orElseThrow(() -> new RuntimeException(
                        "Supermercado no encontrado con id: " + item.getSupermercadoId()));

        // ── PASO 5: Verificar/crear mapeo ProductoTienda ──────────────────────
        Optional<ProductoTienda> productoTiendaOpt =
                productoTiendaRepository.findByProductoIdAndSupermercadoId(
                        producto.getId(), supermercado.getId());

        ProductoTienda productoTienda;
        if (productoTiendaOpt.isEmpty()) {
            productoTienda = new ProductoTienda();
            productoTienda.setProducto(producto);
            productoTienda.setSupermercado(supermercado);
            productoTienda.setUrlEspecifica(item.getUrlEspecifica());
            productoTienda.setUrlImagen(item.getUrlImagen());
            productoTienda = productoTiendaRepository.save(productoTienda);
            log.debug("[IngestaService] Nuevo ProductoTienda creado: ID={}", productoTienda.getId());
        } else {
            productoTienda = productoTiendaOpt.get();
            // Actualizar URL si cambió
            boolean changed = false;
            if (item.getUrlEspecifica() != null &&
                !item.getUrlEspecifica().equals(productoTienda.getUrlEspecifica())) {
                productoTienda.setUrlEspecifica(item.getUrlEspecifica());
                changed = true;
            }
            if (item.getUrlImagen() != null &&
                !item.getUrlImagen().equals(productoTienda.getUrlImagen())) {
                productoTienda.setUrlImagen(item.getUrlImagen());
                changed = true;
            }
            if (changed) {
                productoTienda = productoTiendaRepository.save(productoTienda);
            }
        }

        // ── PASO 6: Persistir precio en historial ─────────────────────────────
        if (item.getPrecioActual() != null && item.getPrecioActual().compareTo(BigDecimal.ZERO) > 0) {
            HistorialPrecio historial = new HistorialPrecio();
            historial.setProductoTienda(productoTienda);
            historial.setPrecio(item.getPrecioActual());
            historial.setFechaRecoleccion(LocalDateTime.now());
            historialPrecioRepository.save(historial);
        } else {
            log.warn("[IngestaService] Ítem '{}' sin precio válido. Se omite registro en historial.",
                    item.getTextoCrudoTienda());
        }

        return esNuevo;
    }

    /**
     * Resuelve la categoría del producto buscando en criterios_busqueda por la palabraClave.
     * Si no encuentra un criterio, usa la categoría por defecto (id=1) o la primera disponible.
     */
    private Categoria resolverCategoria(String palabraClave) {
        try {
            CriterioBusqueda criterio = criterioBusquedaRepository
                    .findByTerminoBusquedaIgnoreCase(palabraClave.trim().toLowerCase());
            if (criterio != null) {
                return criterio.getCategoria();
            }
        } catch (Exception e) {
            log.warn("[IngestaService] No se encontró criterio de búsqueda para '{}'. Usando categoría por defecto.", palabraClave);
        }
        // Fallback: primera categoría disponible
        return categoriaRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "No existe ninguna categoría en la BD. Creá al menos una antes de ingestar."));
    }
}
