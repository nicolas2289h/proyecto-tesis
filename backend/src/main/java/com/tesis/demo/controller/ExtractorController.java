package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.IngestaResultadoDto;
import com.tesis.demo.dto.ItemIngestaDto;
import com.tesis.demo.model.CriterioBusqueda;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.repository.CriterioBusquedaRepository;
import com.tesis.demo.repository.SupermercadoRepository;
import com.tesis.demo.service.IngestaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para el módulo de extracción y descubrimiento automático de catálogo.
 *
 * <p>Expone dos endpoints exclusivos para el scraper Python:</p>
 * <ul>
 *   <li>{@code GET /api/v1/extractor/targets} – Retorna los objetivos de búsqueda
 *       (combinaciones supermercado × criterio_busqueda) configurados por el administrador.</li>
 *   <li>{@code POST /api/v1/extractor/ingesta-masiva} – Recibe la lista de productos
 *       descubiertos y los procesa en el catálogo maestro.</li>
 * </ul>
 *
 * <p>Ambos endpoints requieren autenticación JWT con rol {@code ROLE_ADMIN}.</p>
 */
@RestController
@RequestMapping("/api/v1/extractor")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
public class ExtractorController {

    private final IngestaService ingestaService;
    private final CriterioBusquedaRepository criterioBusquedaRepository;
    private final SupermercadoRepository supermercadoRepository;

    /**
     * Retorna el producto cartesiano de supermercados × criterios_busqueda activos.
     * El scraper itera sobre esta lista para saber qué buscar en cada tienda.
     *
     * <p>Response body de cada elemento:</p>
     * <pre>
     * {
     *   "supermercadoId": 1,
     *   "supermercadoNombre": "Comodin",
     *   "urlBase": "https://www.comodinencasa.com.ar",
     *   "palabraClave": "fideo",
     *   "categoriaId": 2,
     *   "categoriaNombre": "Almacén"
     * }
     * </pre>
     */
    @GetMapping("/targets")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> obtenerTargets() {
        List<Supermercado> supermercados = supermercadoRepository.findAll();
        List<CriterioBusqueda> criterios = criterioBusquedaRepository.findAll();

        List<Map<String, Object>> targets = new ArrayList<>();

        for (Supermercado supermercado : supermercados) {
            for (CriterioBusqueda criterio : criterios) {
                targets.add(Map.of(
                        "supermercadoId",    supermercado.getId(),
                        "supermercadoNombre", supermercado.getNombre(),
                        "urlBase",           supermercado.getUrlBase(),
                        "palabraClave",      criterio.getTerminoBusqueda(),
                        "categoriaId",       criterio.getCategoria().getId(),
                        "categoriaNombre",   criterio.getCategoria().getNombre()
                ));
            }
        }

        return ResponseEntity.ok(ApiResponse.success(
                "Targets de extracción generados: " + targets.size() + " combinaciones", targets));
    }

    /**
     * Recibe la lista de productos descubiertos por el scraper en la grilla de resultados
     * y ejecuta el pipeline de normalización, deduplicación y persistencia.
     *
     * @param items Lista de ítems crudos extraídos de los supermercados.
     * @return Resumen estadístico de la operación de ingesta.
     */
    @PostMapping("/ingesta-masiva")
    public ResponseEntity<ApiResponse<IngestaResultadoDto>> ingestaMasiva(
            @Valid @RequestBody List<ItemIngestaDto> items) {

        if (items == null || items.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "La lista de ítems no puede estar vacía."));
        }

        IngestaResultadoDto resultado = ingestaService.procesarIngestaMasiva(items);

        return ResponseEntity.ok(ApiResponse.success(
                "Ingesta masiva procesada exitosamente.", resultado));
    }
}
