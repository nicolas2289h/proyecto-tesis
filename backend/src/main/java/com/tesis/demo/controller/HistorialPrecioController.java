package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.HistorialPrecioCreateDto;
import com.tesis.demo.dto.HistorialPrecioDto;
import com.tesis.demo.service.HistorialPrecioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/precios")
@RequiredArgsConstructor
public class HistorialPrecioController {

    private final HistorialPrecioService historialPrecioService;

    @PostMapping
    public ResponseEntity<ApiResponse<HistorialPrecioDto>> registrar(@Valid @RequestBody HistorialPrecioCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Precio registrado", historialPrecioService.registrar(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HistorialPrecioDto>>> listarTodos() {
        return ResponseEntity.ok(ApiResponse.success(historialPrecioService.listarTodos()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HistorialPrecioDto>> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(historialPrecioService.obtenerPorId(id)));
    }

    @GetMapping("/producto-tienda/{productoTiendaId}")
    public ResponseEntity<ApiResponse<List<HistorialPrecioDto>>> listarPorProductoTienda(@PathVariable Long productoTiendaId) {
        return ResponseEntity.ok(ApiResponse.success(historialPrecioService.listarPorProductoTienda(productoTiendaId)));
    }

    @GetMapping("/producto-tienda/{productoTiendaId}/ultimo")
    public ResponseEntity<ApiResponse<HistorialPrecioDto>> obtenerUltimoPorProductoTienda(@PathVariable Long productoTiendaId) {
        return ResponseEntity.ok(ApiResponse.success(historialPrecioService.obtenerUltimoPorProductoTienda(productoTiendaId)));
    }

    @GetMapping("/producto-maestro/{productoId}/historico")
    public ResponseEntity<ApiResponse<List<HistorialPrecioDto>>> listarHistoricoPorProductoMaestro(@PathVariable Long productoId) {
        return ResponseEntity.ok(ApiResponse.success(historialPrecioService.listarHistoricoPorProductoMaestro(productoId)));
    }
}
