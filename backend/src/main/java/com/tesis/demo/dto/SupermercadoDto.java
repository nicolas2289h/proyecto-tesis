package com.tesis.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SupermercadoDto {
    private Long id;
    
    @NotBlank(message = "El nombre del supermercado es obligatorio")
    private String nombre;
    
    private String urlBase;
}
