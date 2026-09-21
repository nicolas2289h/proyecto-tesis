package com.tesis.demo.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SupermercadoNameNormalizer {

    private SupermercadoNameNormalizer() {
    }

    public static String normalize(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace("&", " ")
                .replace("_", " ")
                .replaceAll("[^a-z0-9]+", " ")
                .trim();

        return normalized.replaceAll("\\s+", " ");
    }

    public static String canonicalize(String value) {
        String normalized = normalize(value);
        if (normalized.startsWith("comodin")) {
            return "Comodín en Casa";
        }
        if (normalized.isBlank()) {
            return "";
        }
        return value == null ? "" : value.trim();
    }

    public static boolean areEquivalent(String left, String right) {
        String normalizedLeft = normalize(left);
        String normalizedRight = normalize(right);

        if (normalizedLeft.isBlank() || normalizedRight.isBlank()) {
            return false;
        }

        if (normalizedLeft.equals(normalizedRight)) {
            return true;
        }

        if (normalizedLeft.startsWith("comodin") && normalizedRight.startsWith("comodin")) {
            return true;
        }

        return false;
    }
}
