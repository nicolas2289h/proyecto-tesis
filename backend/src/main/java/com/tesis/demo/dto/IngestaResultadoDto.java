package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO que resume los resultados de una operación de ingesta masiva
 * de productos descubiertos por el scraper.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IngestaResultadoDto {
    
    /** Cantidad total de ítems recibidos en el request. */
    private int procesados;
    
    /** Cantidad de productos maestros nuevos insertados en el catálogo. */
    private int nuevosProductos;
    
    /** Cantidad de ítems unificados con un producto maestro existente (similitud alta). */
    private int productosUnificados;
    
    /** Cantidad de precios y mapeos (ProductoTienda) registrados con éxito. */
    private int preciosRegistrados;
    
    /** Cantidad de ítems que fallaron durante el procesamiento. */
    private int errores;
}
