package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.ProductoDto;
import com.tesis.demo.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductoDto>> crear(@Valid @RequestBody ProductoDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Producto creado", productoService.crear(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoDto>> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productoService.obtenerPorId(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductoDto>>> buscar(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) Long categoriaId,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productoService.buscar(nombre, marca, categoriaId, pageable)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoDto>> actualizar(@PathVariable Long id, @Valid @RequestBody ProductoDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Producto actualizado", productoService.actualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Producto eliminado", null));
    }
}
