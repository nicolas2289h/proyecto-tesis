package com.tesis.demo.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ListaCompraDetalleDto extends ListaCompraDto {
    private List<ItemListaConPrecioDto> items;
    private BigDecimal totalEstimado;

    public ListaCompraDetalleDto(Long id, String nombreLista, LocalDateTime fechaCreacion, boolean favorita,
                                 List<ItemListaConPrecioDto> items, BigDecimal totalEstimado) {
        super(id, nombreLista, fechaCreacion, favorita);
        this.items = items;
        this.totalEstimado = totalEstimado;
    }
}
