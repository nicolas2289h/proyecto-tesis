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
    private String marca;
    private String nombre;
    private String categoria;
    private String pesoUnidad;
    private Double pesoValor;
    private String varianteEspecifica;
    private String urlEspecifica;
    private String supermercado;
    private String urlImagen;
    private BigDecimal precio;
}
