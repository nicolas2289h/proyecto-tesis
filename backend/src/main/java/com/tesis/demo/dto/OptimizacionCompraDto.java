package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OptimizacionCompraDto {
    private Long listaId;
    private String nombreLista;
    private BigDecimal totalOptimo;
    private BigDecimal totalMasCaro;
    private BigDecimal totalAhorrado;
    private List<TiendaOptimaDto> hojaDeRuta;
    private List<ProductoOptimoDto> productosSinPrecio;
}
