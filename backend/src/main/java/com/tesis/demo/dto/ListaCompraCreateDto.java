package com.tesis.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ListaCompraCreateDto {
    @NotBlank(message = "El nombre de la lista es obligatorio")
    private String nombreLista;
    private boolean favorita = false;
}
