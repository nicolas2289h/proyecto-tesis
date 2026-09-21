package com.tesis.demo.dto;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    public static String buildNombreProducto(String nombreGenerico, String varianteEspecifica, Double pesoValor, String pesoUnidad) {
        String nombre = StreamJoiner.joinNonBlank(
                nombreGenerico,
                varianteEspecifica,
                formatPeso(pesoValor, pesoUnidad)
        );

        return nombre.isBlank() ? "Producto" : nombre;
    }

    private static String formatPeso(Double pesoValor, String pesoUnidad) {
        if (pesoValor == null || pesoValor == 0) {
            return null;
        }

        String unidad = (pesoUnidad == null || pesoUnidad.isBlank()) ? "" : pesoUnidad.trim();
        String valorFormateado = String.valueOf(pesoValor);

        if (unidad.isBlank()) {
            return valorFormateado;
        }

        return valorFormateado + " " + unidad;
    }

    private static class StreamJoiner {
        private static String joinNonBlank(String... parts) {
            return Arrays.stream(parts)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(part -> !part.isEmpty())
                    .collect(Collectors.joining(" "));
        }
    }
}
