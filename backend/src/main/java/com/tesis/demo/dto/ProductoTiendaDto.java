package com.tesis.demo.dto;

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
    private String productoMarca;
    
    @NotNull(message = "El supermercado es obligatorio")
    private Long supermercadoId;
    
    private String supermercadoNombre;
    private String supermercadoUrlBase;
    
    private String urlEspecifica;
    
    private String codigoExterno;
    private String urlImagen;
}
