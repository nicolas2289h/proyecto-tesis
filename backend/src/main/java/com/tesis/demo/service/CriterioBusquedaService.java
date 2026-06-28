package com.tesis.demo.service;

import com.tesis.demo.dto.CriterioBusquedaDto;
import java.util.List;

public interface CriterioBusquedaService {

    CriterioBusquedaDto crear(CriterioBusquedaDto dto);

    CriterioBusquedaDto obtenerPorId(Long id);

    List<CriterioBusquedaDto> listarTodos();

    List<CriterioBusquedaDto> listarPorCategoria(Long categoriaId);

    CriterioBusquedaDto actualizar(Long id, CriterioBusquedaDto dto);

    void eliminar(Long id);
}
