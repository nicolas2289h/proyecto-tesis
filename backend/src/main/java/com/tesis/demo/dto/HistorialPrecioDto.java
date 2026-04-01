package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HistorialPrecioDto {
    private Long id;
    private Long productoTiendaId;
    private Long productoId;
    private String productoNombre;
    private Long supermercadoId;
    private String supermercadoNombre;
    private BigDecimal precio;
    private LocalDateTime fechaRecoleccion;
}
