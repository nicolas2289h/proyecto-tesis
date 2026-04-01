package com.tesis.demo.repository;

import com.tesis.demo.model.ItemLista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemListaRepository extends JpaRepository<ItemLista, Long> {
    List<ItemLista> findByListaCompraIdOrderByIdAsc(Long listaId);
    Optional<ItemLista> findByIdAndListaCompraId(Long id, Long listaId);
    Optional<ItemLista> findByListaCompraIdAndProductoId(Long listaId, Long productoId);
    void deleteByListaCompraId(Long listaId);
}
