package com.tesis.demo.service;

import com.tesis.demo.dto.*;
import com.tesis.demo.model.ItemLista;
import com.tesis.demo.model.ListaCompra;
import com.tesis.demo.model.Producto;
import com.tesis.demo.model.ProductoTienda;
import com.tesis.demo.repository.ProductoRepository;
import com.tesis.demo.repository.ProductoTiendaRepository;
import com.tesis.demo.repository.SupermercadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OptimizacionServiceImpl implements OptimizacionService {

    private final ListaCompraService listaCompraService;
    private final ItemListaService itemListaService;
    private final HistorialPrecioService historialPrecioService;
    private final ProductoRepository productoRepository;
    private final ProductoTiendaRepository productoTiendaRepository;
    private final SupermercadoRepository supermercadoRepository;

    @Override
    @Transactional(readOnly = true)
    public OptimizacionCompraDto generarCircuitoOptimo(Long listaId, String userEmail) {
        // 1. Validar propiedad de la lista y obtener sus detalles
        ListaCompraDto listaCompra = listaCompraService.obtenerLista(listaId, userEmail);
        List<ItemListaDto> itemsLista = itemListaService.listarItems(listaId, userEmail);

        if (itemsLista.isEmpty()) {
            throw new RuntimeException("La lista de compras está vacía. No se puede optimizar.");
        }

        Map<Long, List<PrecioPorTienda>> preciosPorProductoMaestro = new HashMap<>();
        List<ProductoOptimoDto> productosSinPrecio = new ArrayList<>();
        BigDecimal totalMasCaro = BigDecimal.ZERO;

        // 2. Recopilar todos los precios disponibles para cada producto maestro
        for (ItemListaDto item : itemsLista) {
            Producto productoMaestro = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto maestro no encontrado: " + item.getProductoId()));

            List<ProductoTienda> productosTienda = productoTiendaRepository.findByProductoId(productoMaestro.getId());

            List<PrecioPorTienda> preciosDisponibles = new ArrayList<>();
            List<BigDecimal> preciosParaProducto = new ArrayList<>();

            for (ProductoTienda pt : productosTienda) {
                try {
                    HistorialPrecioDto hpDto = historialPrecioService.obtenerUltimoPorProductoTienda(pt.getId());
                    preciosDisponibles.add(new PrecioPorTienda(pt.getSupermercado().getId(), pt.getSupermercado().getNombre(), hpDto.getPrecio()));
                    preciosParaProducto.add(hpDto.getPrecio());
                } catch (RuntimeException e) {
                    // No hay precio para este ProductoTienda, se ignora
                }
            }

            if (preciosDisponibles.isEmpty()) {
                productosSinPrecio.add(new ProductoOptimoDto(
                        item.getProductoId(),
                        item.getProductoNombre(),
                        item.getMarca(),
                        item.getCantidad(),
                        null,
                        null,
                        "Sin stock/precio disponible"
                ));
            } else {
                preciosPorProductoMaestro.put(item.getProductoId(), preciosDisponibles);
                // Para calcular el totalMasCaro, necesitamos el precio más alto de este producto
                // multiplicado por la cantidad del item.
                BigDecimal precioMasAltoParaProducto = preciosParaProducto.stream()
                        .max(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);
                totalMasCaro = totalMasCaro.add(precioMasAltoParaProducto.multiply(BigDecimal.valueOf(item.getCantidad())));
            }
        }

        // 3. Algoritmo de selección del circuito óptimo (greedy con heurística)
        Map<Long, TiendaOptimaDto> hojaDeRutaMap = new HashMap<>(); // Key: Supermercado ID
        BigDecimal totalOptimo = BigDecimal.ZERO;

        for (ItemListaDto item : itemsLista) {
            if (preciosPorProductoMaestro.containsKey(item.getProductoId())) {
                List<PrecioPorTienda> precios = preciosPorProductoMaestro.get(item.getProductoId());

                // Encontrar el mejor precio para el producto actual
                Optional<PrecioPorTienda> mejorPrecioOpt = precios.stream()
                        .min(Comparator.comparing(PrecioPorTienda::getPrecio));

                if (mejorPrecioOpt.isPresent()) {
                    final PrecioPorTienda initialMejorPrecio = mejorPrecioOpt.get();
                    PrecioPorTienda mejorPrecioSeleccionado = initialMejorPrecio;

                    // Heurística: Si hay empate, priorizar tiendas ya en la hoja de ruta
                    List<PrecioPorTienda> preciosEmpatados = precios.stream()
                            .filter(p -> p.getPrecio().compareTo(initialMejorPrecio.getPrecio()) == 0)
                            .collect(Collectors.toList());

                    if (preciosEmpatados.size() > 1) {
                        Optional<PrecioPorTienda> tiendaExistenteOpt = preciosEmpatados.stream()
                                .filter(p -> hojaDeRutaMap.containsKey(p.getSupermercadoId()))
                                .findFirst();
                        if (tiendaExistenteOpt.isPresent()) {
                            mejorPrecioSeleccionado = tiendaExistenteOpt.get();
                        }
                    }

                    // Capturar el valor final de mejorPrecioSeleccionado para usarlo en la lambda
                    final PrecioPorTienda finalMejorPrecio = mejorPrecioSeleccionado;

                    // Añadir el producto a la hoja de ruta
                    TiendaOptimaDto tiendaOptima = hojaDeRutaMap.computeIfAbsent(finalMejorPrecio.getSupermercadoId(), k -> {
                        return new TiendaOptimaDto(finalMejorPrecio.getSupermercadoId(), finalMejorPrecio.getSupermercadoNombre(), new ArrayList<>(), BigDecimal.ZERO);
                    });

                    BigDecimal subtotalProducto = finalMejorPrecio.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad()));
                    tiendaOptima.getProductos().add(new ProductoOptimoDto(
                            item.getProductoId(),
                            item.getProductoNombre(),
                            item.getMarca(),
                            item.getCantidad(),
                            finalMejorPrecio.getPrecio(),
                            subtotalProducto,
                            null
                    ));
                    tiendaOptima.setSubtotalTienda(tiendaOptima.getSubtotalTienda().add(subtotalProducto));
                    totalOptimo = totalOptimo.add(subtotalProducto);

                } else {
                    // Esto no debería ocurrir si preciosPorProductoMaestro.containsKey(item.getProductoId()) es true
                    productosSinPrecio.add(new ProductoOptimoDto(
                            item.getProductoId(),
                            item.getProductoNombre(),
                            item.getMarca(),
                            item.getCantidad(),
                            null,
                            null,
                            "Sin stock/precio disponible (error interno)"
                    ));
                }
            }
        }

        // 4. Calcular ahorro total
        BigDecimal totalAhorrado = totalMasCaro.subtract(totalOptimo).setScale(2, RoundingMode.HALF_UP);

        return new OptimizacionCompraDto(
                listaId,
                listaCompra.getNombreLista(),
                totalOptimo.setScale(2, RoundingMode.HALF_UP),
                totalMasCaro.setScale(2, RoundingMode.HALF_UP),
                totalAhorrado,
                new ArrayList<>(hojaDeRutaMap.values()),
                productosSinPrecio
        );
    }

    // Clase auxiliar para manejar precios por tienda internamente
    private static class PrecioPorTienda {
        Long supermercadoId;
        String supermercadoNombre;
        BigDecimal precio;

        public PrecioPorTienda(Long supermercadoId, String supermercadoNombre, BigDecimal precio) {
            this.supermercadoId = supermercadoId;
            this.supermercadoNombre = supermercadoNombre;
            this.precio = precio;
        }

        public Long getSupermercadoId() {
            return supermercadoId;
        }

        public String getSupermercadoNombre() {
            return supermercadoNombre;
        }

        public BigDecimal getPrecio() {
            return precio;
        }
    }
}
