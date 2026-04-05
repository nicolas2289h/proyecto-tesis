package com.tesis.demo.service;

import com.tesis.demo.dto.OptimizacionCompraDto;

public interface OptimizacionService {
    OptimizacionCompraDto generarCircuitoOptimo(Long listaId, String userEmail);
}
