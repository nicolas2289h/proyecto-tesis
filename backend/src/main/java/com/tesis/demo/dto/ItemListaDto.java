package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemListaDto {
    private Long id;
    private Long listaId;
    private Long productoId;
    private String productoNombre;
    private String marca;
    private Integer cantidad;
}
