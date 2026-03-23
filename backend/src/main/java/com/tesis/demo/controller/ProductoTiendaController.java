package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.ProductoTiendaDto;
import com.tesis.demo.service.ProductoTiendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/productos-tienda")
@RequiredArgsConstructor
public class ProductoTiendaController {

    private final ProductoTiendaService productoTiendaService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductoTiendaDto>> save(@Valid @RequestBody ProductoTiendaDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Mapeo de producto creado", productoTiendaService.save(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoTiendaDto>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productoTiendaService.findById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductoTiendaDto>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(productoTiendaService.findAll()));
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<ApiResponse<List<ProductoTiendaDto>>> findByProductoId(@PathVariable Long productoId) {
        return ResponseEntity.ok(ApiResponse.success(productoTiendaService.findByProductoId(productoId)));
    }

    @GetMapping("/supermercado/{supermercadoId}")
    public ResponseEntity<ApiResponse<List<ProductoTiendaDto>>> findBySupermercadoId(@PathVariable Long supermercadoId) {
        return ResponseEntity.ok(ApiResponse.success(productoTiendaService.findBySupermercadoId(supermercadoId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoTiendaDto>> update(@PathVariable Long id, @Valid @RequestBody ProductoTiendaDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Mapeo de producto actualizado", productoTiendaService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productoTiendaService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Mapeo de producto eliminado", null));
    }
}
