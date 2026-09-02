package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoComparativoDto {

    private Long id;

    private String producto;      // nombre_generico

    private String marca;

    private Double precio;

    private String urlImagen;     // url_imagen

    private String supermercado;  // nombre del supermercado
}
