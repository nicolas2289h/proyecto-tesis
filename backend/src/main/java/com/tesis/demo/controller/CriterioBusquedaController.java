package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.CriterioBusquedaDto;
import com.tesis.demo.service.CriterioBusquedaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión del catálogo de criterios de búsqueda.
 * Permite a los administradores configurar qué términos genéricos rastreará
 * el scraper en los supermercados.
 */
@RestController
@RequestMapping("/api/v1/criterios-busqueda")
@RequiredArgsConstructor
public class CriterioBusquedaController {

    private final CriterioBusquedaService criterioBusquedaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<CriterioBusquedaDto>> crear(
            @Valid @RequestBody CriterioBusquedaDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(),
                        "Criterio de búsqueda creado", criterioBusquedaService.crear(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CriterioBusquedaDto>>> listarTodos() {
        return ResponseEntity.ok(ApiResponse.success(criterioBusquedaService.listarTodos()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CriterioBusquedaDto>> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(criterioBusquedaService.obtenerPorId(id)));
    }

    @GetMapping("/por-categoria/{categoriaId}")
    public ResponseEntity<ApiResponse<List<CriterioBusquedaDto>>> listarPorCategoria(
            @PathVariable Long categoriaId) {
        return ResponseEntity.ok(ApiResponse.success(
                criterioBusquedaService.listarPorCategoria(categoriaId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<CriterioBusquedaDto>> actualizar(
            @PathVariable Long id, @Valid @RequestBody CriterioBusquedaDto dto) {
        return ResponseEntity.ok(ApiResponse.success(
                "Criterio de búsqueda actualizado", criterioBusquedaService.actualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        criterioBusquedaService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Criterio de búsqueda eliminado", null));
    }
}
