package com.tesis.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoDto {

    private Long id;

    @NotBlank(message = "El nombre genérico es obligatorio")
    private String nombreGenerico;

    private String marca;

    /** Variante específica: tipo, formato, presentación. Ej: "Spaghetti", "Integral". */
    private String varianteEspecifica;

    /** Valor numérico del peso/volumen. Ej: 500.0 */
    private Double pesoValor;

    /** Unidad normalizada del peso/volumen. Ej: "g", "kg", "ml", "l". */
    private String pesoUnidad;

    @NotNull(message = "La categoría es obligatoria")
    private Long categoriaId;

    private String categoriaNombre;
}
