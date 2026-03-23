package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.SupermercadoDto;
import com.tesis.demo.service.SupermercadoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/supermercados")
@RequiredArgsConstructor
public class SupermercadoController {

    private final SupermercadoService supermercadoService;

    @PostMapping
    public ResponseEntity<ApiResponse<SupermercadoDto>> save(@Valid @RequestBody SupermercadoDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Supermercado creado", supermercadoService.save(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupermercadoDto>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supermercadoService.findById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupermercadoDto>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(supermercadoService.findAll()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SupermercadoDto>> update(@PathVariable Long id, @Valid @RequestBody SupermercadoDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Supermercado actualizado", supermercadoService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        supermercadoService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Supermercado eliminado", null));
    }
}
