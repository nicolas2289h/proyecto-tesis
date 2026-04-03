package com.tesis.demo.service;

import com.tesis.demo.dto.ItemListaConPrecioDto;
import com.tesis.demo.dto.ListaCompraCreateDto;
import com.tesis.demo.dto.ListaCompraDetalleDto;
import com.tesis.demo.dto.ListaCompraDto;
import com.tesis.demo.model.ListaCompra;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.repository.ItemListaRepository;
import com.tesis.demo.repository.ListaCompraRepository;
import com.tesis.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListaCompraServiceImpl implements ListaCompraService {

    private final ListaCompraRepository listaCompraRepository;
    private final UsuarioRepository usuarioRepository;
    private final ItemListaRepository itemListaRepository;
    private final HistorialPrecioService historialPrecioService;
    private final ItemListaService itemListaService;

    @Override
    @Transactional
    public ListaCompraDto crearLista(String userEmail, ListaCompraCreateDto dto) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        ListaCompra lista = new ListaCompra();
        lista.setNombreLista(dto.getNombreLista());
        lista.setFavorita(dto.isFavorita());
        lista.setUsuario(usuario);

        return toDto(listaCompraRepository.save(lista));
    }

    @Override
    public List<ListaCompraDetalleDto> listarMisListas(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return listaCompraRepository.findByUsuarioOrderByFavoritaDescFechaCreacionDesc(usuario)
                .stream().map(lista -> obtenerListaDetalle(lista.getId(), userEmail)).collect(Collectors.toList());
    }

    @Override
    public ListaCompraDto obtenerLista(Long id, String userEmail) {
        ListaCompra lista = getListaAndCheckOwner(id, userEmail);
        return toDto(lista);
    }

    @Override
    public ListaCompraDetalleDto obtenerListaDetalle(Long id, String userEmail) {
        ListaCompra lista = getListaAndCheckOwner(id, userEmail);
        List<ItemListaConPrecioDto> itemsConPrecio = itemListaService.listarItems(id, userEmail).stream()
                .map(itemDto -> {
                    ItemListaConPrecioDto itemConPrecio = new ItemListaConPrecioDto();
                    itemConPrecio.setId(itemDto.getId());
                    itemConPrecio.setProductoId(itemDto.getProductoId());
                    itemConPrecio.setProductoNombre(itemDto.getProductoNombre());
                    itemConPrecio.setMarca(itemDto.getMarca());
                    itemConPrecio.setCantidad(itemDto.getCantidad());

                    // Obtener el último precio del producto en cualquier supermercado
                    historialPrecioService.obtenerUltimoPorProductoMaestro(itemDto.getProductoId())
                            .ifPresent(hpDto -> {
                                itemConPrecio.setPrecioUnitario(hpDto.getPrecio());
                                itemConPrecio.setSupermercadoId(hpDto.getSupermercadoId());
                                itemConPrecio.setSupermercadoNombre(hpDto.getSupermercadoNombre());
                                itemConPrecio.setPrecioTotal(hpDto.getPrecio().multiply(BigDecimal.valueOf(itemDto.getCantidad())));
                            });
                    return itemConPrecio;
                }).collect(Collectors.toList());

        BigDecimal totalEstimado = itemsConPrecio.stream()
                .map(ItemListaConPrecioDto::getPrecioTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ListaCompraDetalleDto(
                lista.getId(),
                lista.getNombreLista(),
                lista.getFechaCreacion(),
                lista.isFavorita(),
                itemsConPrecio,
                totalEstimado
        );
    }

    @Override
    @Transactional
    public ListaCompraDto actualizarLista(Long id, String userEmail, ListaCompraCreateDto dto) {
        ListaCompra lista = getListaAndCheckOwner(id, userEmail);
        lista.setNombreLista(dto.getNombreLista());
        lista.setFavorita(dto.isFavorita());
        return toDto(listaCompraRepository.save(lista));
    }

    @Override
    @Transactional
    public void eliminarLista(Long id, String userEmail) {
        ListaCompra lista = getListaAndCheckOwner(id, userEmail);
        itemListaRepository.deleteByListaCompraId(lista.getId());
        listaCompraRepository.delete(lista);
    }

    @Override
    @Transactional
    public ListaCompraDto toggleFavorita(Long id, String userEmail) {
        ListaCompra lista = getListaAndCheckOwner(id, userEmail);
        lista.setFavorita(!lista.isFavorita());
        return toDto(listaCompraRepository.save(lista));
    }

    private ListaCompra getListaAndCheckOwner(Long id, String email) {
        ListaCompra lista = listaCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lista no encontrada"));
        if (!lista.getUsuario().getEmail().equals(email)) {
            throw new RuntimeException("No tiene permisos sobre esta lista");
        }
        return lista;
    }

    private ListaCompraDto toDto(ListaCompra lista) {
        return new ListaCompraDto(
                lista.getId(),
                lista.getNombreLista(),
                lista.getFechaCreacion(),
                lista.isFavorita()
        );
    }
}
