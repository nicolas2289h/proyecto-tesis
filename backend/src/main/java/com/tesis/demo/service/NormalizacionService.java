package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoNormalizadoDto;
import com.tesis.demo.model.Producto;

/**
 * Servicio centralizado de normalización inteligente.
 * Responsable de:
 * 1. Parsear el texto crudo de tienda con Regex para extraer campos atómicos.
 * 2. Comparar candidatos existentes usando el algoritmo Jaro-Winkler.
 */
public interface NormalizacionService {

    /**
     * Parsea el texto crudo de una tarjeta de producto de supermercado
     * y extrae los campos atómicos normalizados.
     *
     * @param textoCrudo       Texto tal como aparece en la web (ej: "Fideos Spaghetti Lucchetti x 500 gramos")
     * @param palabraClave     Término genérico de búsqueda (ej: "fideo") usado como ancla del nombreGenerico
     * @return ProductoNormalizadoDto con los campos extraídos
     */
    ProductoNormalizadoDto normalizar(String textoCrudo, String palabraClave);

    /**
     * Calcula la similitud Jaro-Winkler entre dos strings.
     * Retorna un valor entre 0.0 (sin similitud) y 1.0 (idénticos).
     *
     * @param s1 Primer string
     * @param s2 Segundo string
     * @return Similitud normalizada [0.0 - 1.0]
     */
    double jaroWinklerSimilarity(String s1, String s2);

    /**
     * Determina si un producto candidato de la BD es suficientemente similar
     * al producto normalizado recibido como para considerarlos el mismo.
     * Aplica Jaro-Winkler sobre marca y varianteEspecifica, y comparación
     * exacta sobre pesoValor/pesoUnidad.
     *
     * @param candidato  Producto existente en la BD
     * @param normalizado Producto normalizado recién extraído por el scraper
     * @param umbral     Umbral mínimo de similitud (recomendado: 0.92)
     * @return true si se considera el mismo producto
     */
    boolean esSimilar(Producto candidato, ProductoNormalizadoDto normalizado, double umbral);

    /**
     * Valida si el texto crudo del título del producto devuelto por el supermercado
     * es compatible con la palabra clave buscada (evitando falsos positivos).
     *
     * @param textoCrudo   Nombre del producto en la tienda (ej: "Caballa Puglisi en Aceite 380gr")
     * @param palabraClave Término buscado (ej: "sardinas")
     * @return true si es compatible, false de lo contrario
     */
    boolean esItemCompatible(String textoCrudo, String palabraClave);
}

