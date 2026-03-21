package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.CategoriaDto;
import com.tesis.demo.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoriaDto>> crear(@Valid @RequestBody CategoriaDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Categoría creada", categoriaService.crear(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoriaDto>> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(categoriaService.obtenerPorId(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoriaDto>>> listarTodas() {
        return ResponseEntity.ok(ApiResponse.success(categoriaService.listarTodas()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoriaDto>> actualizar(@PathVariable Long id, @Valid @RequestBody CategoriaDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Categoría actualizada", categoriaService.actualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        categoriaService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Categoría eliminada", null));
    }
}
