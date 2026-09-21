package com.tesis.demo.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class ProductoBusquedaDtoTest {

    @Test
    void buildNombreProducto_shouldConcatenateGenericNameVariantAndWeight() {
        String nombre = ProductoBusquedaDto.buildNombreProducto(
                "Manteca",
                "Tonadita",
                200.0,
                "g"
        );

        assertEquals("Manteca Tonadita 200 g", nombre);
    }

    @Test
    void buildNombreProducto_shouldIgnoreEmptyParts() {
        String nombre = ProductoBusquedaDto.buildNombreProducto(
                "Arroz",
                null,
                null,
                "kg"
        );

        assertEquals("Arroz kg", nombre);
    }
}
