package com.tesis.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoTiendaDto {
    private Long id;
    
    @NotNull(message = "El producto maestro es obligatorio")
    private Long productoId;
    
    private String productoNombre;
    
    @NotNull(message = "El supermercado es obligatorio")
    private Long supermercadoId;
    
    private String supermercadoNombre;
    
    @NotBlank(message = "La URL específica es obligatoria")
    private String urlEspecifica;
    
    private String codigoExterno;
}
