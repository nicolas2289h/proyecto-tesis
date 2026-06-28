package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoNormalizadoDto;
import com.tesis.demo.model.Producto;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Implementación del servicio de Normalización Inteligente.
 *
 * <p><b>Estrategia de Parseo de Peso (Regex)</b>: Captura patrones como
 * "500g", "500 gr", "500 gramos", "x 500 Gr", "1kg", "1 kilo", "500ml",
 * "1 litro", "750cc" y los normaliza a (pesoValor, pesoUnidad).</p>
 *
 * <p><b>Algoritmo Jaro-Winkler</b>: Implementado en Java puro, sin dependencias
 * externas. Especialmente efectivo para errores tipográficos en nombres cortos
 * como marcas comerciales (ej: "Lucchetti" vs "Luchetti").</p>
 */
@Service
public class NormalizacionServiceImpl implements NormalizacionService {

    // ─── Constantes de normalización de unidades ─────────────────────────────

    /** Umbral de similitud por defecto para unificación de productos. */
    public static final double UMBRAL_DEFAULT = 0.92;

    /**
     * Patrón Regex para extraer peso/volumen del texto crudo.
     * Captura grupo 1: valor numérico (ej: "500", "1.5", "1,5")
     * Captura grupo 2: unidad de medida (ej: "g", "gramos", "kg", "ml", "litro")
     * El prefijo "x" o "X" antes del número es opcional.
     */
    private static final Pattern PESO_PATTERN = Pattern.compile(
            "(?:x\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(g|gr|grs|gramos?|kg|kgs|kilos?|kilogramos?|ml|cc|lt|litros?)(?:\\b|\\s|$)|" +
            "(?:x\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(l)(?=\\s|$|[^a-zA-Z])",
            Pattern.CASE_INSENSITIVE
    );

    // ─── Normalización ───────────────────────────────────────────────────────

    @Override
    public ProductoNormalizadoDto normalizar(String textoCrudo, String palabraClave) {
        if (textoCrudo == null || textoCrudo.isBlank()) {
            return new ProductoNormalizadoDto(limpiarKeyword(palabraClave), null, null, null, null);
        }

        String textoOriginal = textoCrudo.trim();

        // 1. Pre-limpiar el texto crudo: eliminar elementos de UI que no son datos del producto
        // Ej: "Disponible", "Agregar", precios con '$', porcentajes de descuento
        String textoLimpio = textoOriginal
                .replaceAll("(?i)\\b(disponible|agregar|no\\s+disponible|agotado|oferta|descuento)\\b", " ")
                .replaceAll("\\$[\\s\\u00A0]*[\\d.,]+", " ")  // eliminar precios: "$ 823,99"
                .replaceAll("-?\\d+%", " ")                   // eliminar descuentos: "-20%"
                .replaceAll("\\s{2,}", " ")
                .trim();

        // 2. Extraer peso/volumen del texto limpio con regex
        Double pesoValor = null;
        String pesoUnidad = null;
        String textoSinPeso = textoLimpio;

        Matcher matcher = PESO_PATTERN.matcher(textoLimpio);
        if (matcher.find()) {
            // El patrón tiene dos alternativas: grupos 1,2 para unidades no ambiguas y grupos 3,4 para 'l'
            String valorStr = matcher.group(1) != null ? matcher.group(1) : matcher.group(3);
            String unidadStr = matcher.group(2) != null ? matcher.group(2) : matcher.group(4);
            if (valorStr != null) {
                try {
                    pesoValor = Double.parseDouble(valorStr.replace(',', '.'));
                } catch (NumberFormatException ignored) { /* valor inválido, ignorar */ }
            }
            if (unidadStr != null) {
                pesoUnidad = normalizarUnidad(unidadStr);
            }
            // Eliminar la parte del peso del texto para el procesamiento de marca/variante
            textoSinPeso = (textoLimpio.substring(0, matcher.start()) +
                            textoLimpio.substring(matcher.end())).trim();
        }

        // 2. Determinar nombre genérico (la palabraClave)
        String nombreGenerico = limpiarKeyword(palabraClave);

        // 3. Eliminar la palabraClave del texto para aislar marca y variante
        // Se hace sobre el texto sin peso y sin la keyword (insensitive)
        String textoRestante = textoSinPeso
                .replaceAll("(?i)\\b" + Pattern.quote(nombreGenerico) + "s?\\b", "")
                .replaceAll("\\s{2,}", " ")
                .trim();

        // 4. Extraer marca y variante del texto restante
        String[] partes = extraerMarcaYVariante(textoRestante, nombreGenerico);
        String marca = partes[0];
        String variante = partes[1];

        return new ProductoNormalizadoDto(
                nombreGenerico,
                marca.isEmpty() ? null : capitalizarPalabras(marca),
                variante.isEmpty() ? null : capitalizarPalabras(variante),
                pesoValor,
                pesoUnidad
        );
    }

    // ─── Jaro-Winkler (implementación pura Java) ─────────────────────────────

    @Override
    public double jaroWinklerSimilarity(String s1, String s2) {
        if (s1 == null && s2 == null) return 1.0;
        if (s1 == null || s2 == null) return 0.0;

        String a = normalizarParaComparacion(s1);
        String b = normalizarParaComparacion(s2);

        if (a.equals(b)) return 1.0;
        if (a.isEmpty() || b.isEmpty()) return 0.0;

        double jaroScore = calcularJaro(a, b);

        // Calcular prefijo común (máximo 4 caracteres)
        int prefixLen = 0;
        int maxPrefix = Math.min(4, Math.min(a.length(), b.length()));
        for (int i = 0; i < maxPrefix; i++) {
            if (a.charAt(i) == b.charAt(i)) {
                prefixLen++;
            } else {
                break;
            }
        }

        // Fórmula Jaro-Winkler: jaro + (p * prefixLen * (1 - jaro))
        // p = 0.1 (factor de escala estándar)
        return jaroScore + (0.1 * prefixLen * (1.0 - jaroScore));
    }

    @Override
    public boolean esSimilar(Producto candidato, ProductoNormalizadoDto normalizado, double umbral) {
        // Comparación de peso: si ambos tienen peso, deben coincidir exactamente
        if (candidato.getPesoValor() != null && normalizado.getPesoValor() != null) {
            if (!candidato.getPesoValor().equals(normalizado.getPesoValor())) return false;
        }
        if (candidato.getPesoUnidad() != null && normalizado.getPesoUnidad() != null) {
            if (!candidato.getPesoUnidad().equalsIgnoreCase(normalizado.getPesoUnidad())) return false;
        }

        // Similitud de marca
        double simMarca = jaroWinklerSimilarity(
                candidato.getMarca(),
                normalizado.getMarca()
        );
        if (simMarca < umbral) return false;

        // Similitud de variante específica
        double simVariante = jaroWinklerSimilarity(
                candidato.getVarianteEspecifica(),
                normalizado.getVarianteEspecifica()
        );
        return simVariante >= umbral;
    }

    @Override
    public boolean esItemCompatible(String textoCrudo, String palabraClave) {
        if (textoCrudo == null || palabraClave == null || textoCrudo.isBlank() || palabraClave.isBlank()) {
            return false;
        }

        // Normalizar a minúsculas y sin acentos
        String textoNorm = normalizarParaComparacion(textoCrudo);
        String palabraNorm = normalizarParaComparacion(palabraClave);

        // Obtener singular básico (ej. "sardinas" -> "sardina")
        String singularClave = palabraNorm.endsWith("s") && palabraNorm.length() > 1
                ? palabraNorm.substring(0, palabraNorm.length() - 1)
                : palabraNorm;

        // Filtro Positivo: ¿Contiene la palabra clave o su singular?
        boolean contieneClave = textoNorm.contains(singularClave) || textoNorm.contains(palabraNorm);

        // Flexibilidad para chocolatadas (aceptar "chocolate" + "leche" / "bebida" / "bda")
        if (palabraNorm.equals("chocolatada") && !contieneClave) {
            contieneClave = textoNorm.contains("chocolate") && 
                    (textoNorm.contains("leche") || textoNorm.contains("bebida") || textoNorm.contains("bda"));
        }

        if (!contieneClave) {
            return false;
        }

        // Filtro Negativo: Exclusiones específicas
        if (singularClave.equals("sardina")) {
            if (textoNorm.contains("atun") || textoNorm.contains("caballa") || 
                textoNorm.contains("anchoa") || textoNorm.contains("anchoita") || 
                textoNorm.contains("jurel") || textoNorm.contains("mejillon")) {
                return false;
            }
        }

        if (singularClave.equals("picadillo")) {
            if (textoNorm.contains("pate") || textoNorm.contains("foie")) {
                return false;
            }
        }

        return true;
    }


    // ─── Helpers privados ────────────────────────────────────────────────────

    /**
     * Calcula la distancia de Jaro entre dos strings normalizados.
     */
    private double calcularJaro(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();
        int matchDistance = Math.max(len1, len2) / 2 - 1;
        if (matchDistance < 0) matchDistance = 0;

        boolean[] s1Matches = new boolean[len1];
        boolean[] s2Matches = new boolean[len2];

        int matches = 0;
        int transpositions = 0;

        for (int i = 0; i < len1; i++) {
            int start = Math.max(0, i - matchDistance);
            int end = Math.min(i + matchDistance + 1, len2);
            for (int j = start; j < end; j++) {
                if (s2Matches[j] || s1.charAt(i) != s2.charAt(j)) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }

        if (matches == 0) return 0.0;

        int k = 0;
        for (int i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1.charAt(i) != s2.charAt(k)) transpositions++;
            k++;
        }

        return (((double) matches / len1) +
                ((double) matches / len2) +
                ((double) (matches - transpositions / 2) / matches)) / 3.0;
    }

    /**
     * Normaliza un string para comparación: minúsculas, sin acentos, sin caracteres especiales.
     */
    private String normalizarParaComparacion(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input.toLowerCase().trim(), Normalizer.Form.NFD);
        return normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                         .replaceAll("[^a-z0-9]", "");
    }

    /**
     * Normaliza la unidad de medida a un formato estándar.
     */
    private String normalizarUnidad(String unidadRaw) {
        if (unidadRaw == null) return null;
        String u = unidadRaw.toLowerCase().trim();
        if (u.matches("g|gr|grs|gramos?")) return "g";
        if (u.matches("kg|kgs|kilos?|kilogramos?")) return "kg";
        if (u.matches("ml|cc")) return "ml";
        if (u.matches("l|lt|litros?")) return "l";
        return u;
    }

    /**
     * Limpia la palabra clave buscada para usarla como nombre genérico normalizado.
     */
    private String limpiarKeyword(String keyword) {
        if (keyword == null) return "";
        // Capitalizar primera letra, el resto en minúsculas
        String k = keyword.trim().toLowerCase();
        if (k.isEmpty()) return k;
        return Character.toUpperCase(k.charAt(0)) + k.substring(1);
    }

    /**
     * Heurística para separar marca y variante del texto restante.
     * La primera "palabra token" se asume marca; el resto se asume variante.
     * Las marcas típicas son palabras cortas o compuestas conocidas.
     */
    private String[] extraerMarcaYVariante(String textoRestante, String nombreGenerico) {
        if (textoRestante == null || textoRestante.isBlank()) {
            return new String[]{"", ""};
        }

        // Tokenizar eliminando conectores comunes en español
        String limpio = textoRestante
                .replaceAll("(?i)\\b(de|del|la|el|las|los|por|para|con|sin|kg|g|ml|l)\\b", " ")
                .replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\\s]", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();

        String[] tokens = limpio.split("\\s+");
        List<String> marcaTokens = new ArrayList<>();
        List<String> varianteTokens = new ArrayList<>();

        // Heurística: primer token capitalizado que no sea la keyword → marca
        // El resto → variante
        boolean marcaEncontrada = false;
        for (String token : tokens) {
            if (token.isBlank()) continue;
            if (!marcaEncontrada &&
                Character.isUpperCase(token.charAt(0)) &&
                !token.equalsIgnoreCase(nombreGenerico)) {
                marcaTokens.add(token);
                marcaEncontrada = true;
            } else if (marcaEncontrada) {
                varianteTokens.add(token);
            }
        }

        // Si no se encontró marca por mayúsculas, tomar primer token como marca
        if (marcaTokens.isEmpty() && tokens.length > 0) {
            marcaTokens.add(tokens[0]);
            for (int i = 1; i < tokens.length; i++) {
                if (!tokens[i].isBlank()) varianteTokens.add(tokens[i]);
            }
        }

        return new String[]{
                String.join(" ", marcaTokens),
                String.join(" ", varianteTokens)
        };
    }

    /**
     * Capitaliza la primera letra de cada palabra.
     */
    private String capitalizarPalabras(String input) {
        if (input == null || input.isBlank()) return input;
        String[] words = input.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0)))
                  .append(word.substring(1).toLowerCase())
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }
}
