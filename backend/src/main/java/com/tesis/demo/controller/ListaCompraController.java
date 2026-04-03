package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.ListaCompraCreateDto;
import com.tesis.demo.dto.ListaCompraDetalleDto;
import com.tesis.demo.dto.ListaCompraDto;
import com.tesis.demo.service.ListaCompraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/listas")
@RequiredArgsConstructor
public class ListaCompraController {

    private final ListaCompraService listaCompraService;

    @PostMapping
    public ResponseEntity<ApiResponse<ListaCompraDto>> crear(@Valid @RequestBody ListaCompraCreateDto dto, 
                                                            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Lista creada", 
                      listaCompraService.crearLista(principal.getName(), dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ListaCompraDetalleDto>>> listar(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), null, 
                listaCompraService.listarMisListas(principal.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ListaCompraDetalleDto>> obtener(@PathVariable Long id, 
                                                              Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), null, 
                listaCompraService.obtenerListaDetalle(id, principal.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ListaCompraDto>> actualizar(@PathVariable Long id, 
                                                                 @Valid @RequestBody ListaCompraCreateDto dto,
                                                                 Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Lista actualizada", 
                listaCompraService.actualizarLista(id, principal.getName(), dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id, 
                                                     Principal principal) {
        listaCompraService.eliminarLista(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Lista eliminada", null));
    }

    @PatchMapping("/{id}/favorita")
    public ResponseEntity<ApiResponse<ListaCompraDto>> toggleFavorita(@PathVariable Long id, 
                                                                     Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Preferencia actualizada", 
                listaCompraService.toggleFavorita(id, principal.getName())));
    }
}
