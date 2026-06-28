package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO interno resultado del proceso de normalización inteligente
 * aplicado sobre un texto crudo de tienda.
 * Contiene los campos atómicos listos para buscar duplicados o insertar en la BD.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoNormalizadoDto {

    /** Nombre genérico derivado de la palabra clave buscada. Ej: "fideo". */
    private String nombreGenerico;

    /** Marca extraída del texto. Ej: "Lucchetti". Puede ser null. */
    private String marca;

    /** Variante específica extraída. Ej: "Spaghetti", "Mostachol". Puede ser null. */
    private String varianteEspecifica;

    /** Valor numérico del peso/volumen extraído. Ej: 500.0. Puede ser null. */
    private Double pesoValor;

    /** Unidad normalizada. Ej: "g", "kg", "ml", "l". Puede ser null. */
    private String pesoUnidad;
}
