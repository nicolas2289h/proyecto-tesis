package com.tesis.demo.service;

import com.tesis.demo.dto.ItemListaCreateDto;
import com.tesis.demo.dto.ItemListaDto;
import com.tesis.demo.model.ItemLista;
import com.tesis.demo.model.ListaCompra;
import com.tesis.demo.model.Producto;
import com.tesis.demo.repository.ItemListaRepository;
import com.tesis.demo.repository.ListaCompraRepository;
import com.tesis.demo.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemListaServiceImpl implements ItemListaService {

    private final ItemListaRepository itemListaRepository;
    private final ListaCompraRepository listaCompraRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional
    public ItemListaDto agregarItem(Long listaId, String userEmail, ItemListaCreateDto dto) {
        ListaCompra lista = getListaAndCheckOwner(listaId, userEmail);

        itemListaRepository.findByListaCompraIdAndProductoId(listaId, dto.getProductoId())
                .ifPresent(existing -> {
                    throw new RuntimeException("Ese producto ya existe en la lista");
                });

        Producto producto = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        ItemLista itemLista = new ItemLista();
        itemLista.setListaCompra(lista);
        itemLista.setProducto(producto);
        itemLista.setCantidad(dto.getCantidad());

        return mapToDto(itemListaRepository.save(itemLista));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemListaDto> listarItems(Long listaId, String userEmail) {
        getListaAndCheckOwner(listaId, userEmail);
        return itemListaRepository.findByListaCompraIdOrderByIdAsc(listaId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ItemListaDto obtenerItem(Long listaId, Long itemId, String userEmail) {
        getListaAndCheckOwner(listaId, userEmail);
        return itemListaRepository.findByIdAndListaCompraId(itemId, listaId)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Item no encontrado en la lista"));
    }

    @Override
    @Transactional
    public ItemListaDto actualizarItem(Long listaId, Long itemId, String userEmail, ItemListaCreateDto dto) {
        getListaAndCheckOwner(listaId, userEmail);

        ItemLista itemLista = itemListaRepository.findByIdAndListaCompraId(itemId, listaId)
                .orElseThrow(() -> new RuntimeException("Item no encontrado en la lista"));

        itemListaRepository.findByListaCompraIdAndProductoId(listaId, dto.getProductoId())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(itemId)) {
                        throw new RuntimeException("Ya existe otro item con ese producto en la lista");
                    }
                });

        Producto producto = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        itemLista.setProducto(producto);
        itemLista.setCantidad(dto.getCantidad());

        return mapToDto(itemListaRepository.save(itemLista));
    }

    @Override
    @Transactional
    public void eliminarItem(Long listaId, Long itemId, String userEmail) {
        getListaAndCheckOwner(listaId, userEmail);

        ItemLista itemLista = itemListaRepository.findByIdAndListaCompraId(itemId, listaId)
                .orElseThrow(() -> new RuntimeException("Item no encontrado en la lista"));

        itemListaRepository.delete(itemLista);
    }

    private ListaCompra getListaAndCheckOwner(Long listaId, String email) {
        ListaCompra lista = listaCompraRepository.findById(listaId)
                .orElseThrow(() -> new RuntimeException("Lista no encontrada"));

        if (!lista.getUsuario().getEmail().equals(email)) {
            throw new RuntimeException("No tiene permisos sobre esta lista");
        }

        return lista;
    }

    private ItemListaDto mapToDto(ItemLista itemLista) {
        return new ItemListaDto(
                itemLista.getId(),
                itemLista.getListaCompra().getId(),
                itemLista.getProducto().getId(),
                itemLista.getProducto().getNombreGenerico(),
                itemLista.getProducto().getMarca(),
                itemLista.getCantidad()
        );
    }
}
