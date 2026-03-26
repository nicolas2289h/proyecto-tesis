package com.tesis.demo.service;

import com.tesis.demo.dto.ListaCompraCreateDto;
import com.tesis.demo.dto.ListaCompraDto;
import com.tesis.demo.model.ListaCompra;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.repository.ListaCompraRepository;
import com.tesis.demo.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListaCompraServiceImpl implements ListaCompraService {

    private final ListaCompraRepository listaCompraRepository;
    private final UsuarioRepository usuarioRepository;

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
    public List<ListaCompraDto> listarMisListas(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return listaCompraRepository.findByUsuarioOrderByFavoritaDescFechaCreacionDesc(usuario)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public ListaCompraDto obtenerLista(Long id, String userEmail) {
        ListaCompra lista = getListaAndCheckOwner(id, userEmail);
        return toDto(lista);
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
