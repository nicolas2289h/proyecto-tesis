package com.tesis.demo.controller;

import com.tesis.demo.dto.ApiResponse;
import com.tesis.demo.dto.ItemListaCreateDto;
import com.tesis.demo.dto.ItemListaDto;
import com.tesis.demo.service.ItemListaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/listas/{listaId}/items")
@RequiredArgsConstructor
public class ItemListaController {

    private final ItemListaService itemListaService;

    @PostMapping
    public ResponseEntity<ApiResponse<ItemListaDto>> agregarItem(@PathVariable Long listaId,
                                                                 @Valid @RequestBody ItemListaCreateDto dto,
                                                                 Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Item agregado a la lista",
                        itemListaService.agregarItem(listaId, principal.getName(), dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemListaDto>>> listarItems(@PathVariable Long listaId,
                                                                       Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(itemListaService.listarItems(listaId, principal.getName())));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemListaDto>> obtenerItem(@PathVariable Long listaId,
                                                                 @PathVariable Long itemId,
                                                                 Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(itemListaService.obtenerItem(listaId, itemId, principal.getName())));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemListaDto>> actualizarItem(@PathVariable Long listaId,
                                                                    @PathVariable Long itemId,
                                                                    @Valid @RequestBody ItemListaCreateDto dto,
                                                                    Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Item actualizado",
                itemListaService.actualizarItem(listaId, itemId, principal.getName(), dto)));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> eliminarItem(@PathVariable Long listaId,
                                                          @PathVariable Long itemId,
                                                          Principal principal) {
        itemListaService.eliminarItem(listaId, itemId, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Item eliminado", null));
    }
}
