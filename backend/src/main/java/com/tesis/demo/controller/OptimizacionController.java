package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.OptimizacionCompraDto;
import com.tesis.demo.service.OptimizacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/listas")
@RequiredArgsConstructor
public class OptimizacionController {

    private final OptimizacionService optimizacionService;

    @GetMapping("/{id}/circuito-optimo")
    public ResponseEntity<ApiResponse<OptimizacionCompraDto>> generarCircuitoOptimo(@PathVariable Long id,
                                                                                   Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Circuito óptimo generado",
                optimizacionService.generarCircuitoOptimo(id, principal.getName())));
    }
}
