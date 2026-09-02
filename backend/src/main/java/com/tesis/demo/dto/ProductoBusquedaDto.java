package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoBusquedaDto {
    private Long id;
    private String nombreGenerico;
    private String marca;
    private BigDecimal precio;
    private String urlImagen;
    private String nombreSupermercado;
}
