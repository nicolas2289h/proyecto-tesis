package com.tesis.demo.service;

import com.tesis.demo.dto.IngestaResultadoDto;
import com.tesis.demo.dto.ItemIngestaDto;

import java.util.List;

/**
 * Servicio encargado de orquestar la ingesta masiva de productos
 * descubiertos por el scraper.
 */
public interface IngestaService {

    /**
     * Procesa una lista de ítems descubiertos en los supermercados.
     * Aplica la normalización inteligente, detecta duplicados lógicos,
     * inserta nuevos productos en el catálogo maestro si es necesario,
     * vincula las URLs al ProductoTienda y registra el historial de precios.
     *
     * @param items Lista de productos crudos extraídos de las tiendas.
     * @return Resumen estadístico de la operación.
     */
    IngestaResultadoDto procesarIngestaMasiva(List<ItemIngestaDto> items);
}
