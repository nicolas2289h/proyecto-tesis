package com.tesis.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ListaCompraDto {
    private Long id;
    private String nombreLista;
    private LocalDateTime fechaCreacion;
    private boolean favorita;
}
