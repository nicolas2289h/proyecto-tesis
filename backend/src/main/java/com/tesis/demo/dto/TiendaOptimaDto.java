package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TiendaOptimaDto {
    private Long supermercadoId;
    private String supermercadoNombre;
    private List<ProductoOptimoDto> productos;
    private BigDecimal subtotalTienda;
}
