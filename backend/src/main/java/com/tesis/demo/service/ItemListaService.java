package com.tesis.demo.service;

import com.tesis.demo.dto.ItemListaCreateDto;
import com.tesis.demo.dto.ItemListaDto;

import java.util.List;

public interface ItemListaService {
    ItemListaDto agregarItem(Long listaId, String userEmail, ItemListaCreateDto dto);
    List<ItemListaDto> listarItems(Long listaId, String userEmail);
    ItemListaDto obtenerItem(Long listaId, Long itemId, String userEmail);
    ItemListaDto actualizarItem(Long listaId, Long itemId, String userEmail, ItemListaCreateDto dto);
    void eliminarItem(Long listaId, Long itemId, String userEmail);
}
