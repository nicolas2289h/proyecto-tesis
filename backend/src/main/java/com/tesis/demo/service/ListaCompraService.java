package com.tesis.demo.service;

import com.tesis.demo.dto.ListaCompraDetalleDto;
import com.tesis.demo.dto.ListaCompraCreateDto;
import com.tesis.demo.dto.ListaCompraDto;
import java.util.List;

public interface ListaCompraService {
    ListaCompraDto crearLista(String userEmail, ListaCompraCreateDto dto);
    List<ListaCompraDetalleDto> listarMisListas(String userEmail);
    ListaCompraDetalleDto obtenerListaDetalle(Long id, String userEmail);
    ListaCompraDto obtenerLista(Long id, String userEmail);
    ListaCompraDto actualizarLista(Long id, String userEmail, ListaCompraCreateDto dto);
    void eliminarLista(Long id, String userEmail);
    ListaCompraDto toggleFavorita(Long id, String userEmail);
}
