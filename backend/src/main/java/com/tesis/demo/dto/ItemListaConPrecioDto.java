package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemListaConPrecioDto {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String marca;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal precioTotal;
    private Long supermercadoId;
    private String supermercadoNombre;
}
