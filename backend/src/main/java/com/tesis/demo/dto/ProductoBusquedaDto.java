package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoBusquedaDto {
    private Long id;
    private String marca;
    private String nombreGenerico;
    private String categoria;
    private String pesoUnidad;
    private Double pesoValor;
    private String varianteEspecifica;
    private String urlEspecifica;
    private String supermercado;
    private String urlImagen;
    private BigDecimal precio;

    // Constructor utilizado por la query de HEAD en HistorialPrecioRepository
    public ProductoBusquedaDto(Long id, String nombreGenerico, String marca, BigDecimal precio, String urlImagen, String supermercado) {
        this.id = id;
        this.nombreGenerico = nombreGenerico;
        this.marca = marca;
        this.precio = precio;
        this.urlImagen = urlImagen;
        this.supermercado = supermercado;
    }

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

