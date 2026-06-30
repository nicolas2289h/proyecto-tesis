import re
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Mapa de normalización de unidades de peso/volumen
# ──────────────────────────────────────────────────────────────────────────────
_UNIT_MAP: Dict[str, str] = {
    "g": "g", "gr": "g", "grs": "g", "gramo": "g", "gramos": "g",
    "kg": "kg", "kgs": "kg", "kilo": "kg", "kilos": "kg",
    "kilogramo": "kg", "kilogramos": "kg",
    "ml": "ml", "cc": "ml",
    "l": "l", "lt": "l", "litro": "l", "litros": "l",
}

# Patrón para extraer cantidad + unidad de cualquier texto de producto
# Soporta: "500g", "500 gr", "x 500 gramos", "1,5 kg", "750ml", "1 litro"
_PESO_PATTERN = re.compile(
    r"(?:x\s*)?(\d+(?:[.,]\d+)?)\s*"
    r"(g|gr|grs|gramos?|kg|kgs?|kilos?|kilogramos?|ml|cc|l|lt|litros?)",
    re.IGNORECASE
)


def parse_weight(text: str) -> Dict[str, Optional[object]]:
    """
    Extrae el peso/volumen de un texto crudo de producto de supermercado.

    Pre-normaliza la cantidad y la unidad para que el backend reciba
    campos atómicos limpios en el DTO de ingesta masiva.

    Args:
        text: Texto completo del producto (ej: "Fideos Spaghetti Lucchetti x 500 gramos").

    Returns:
        Dict con:
            - ``peso_valor`` (float | None): Valor numérico del peso.
            - ``peso_unidad`` (str | None): Unidad normalizada ("g", "kg", "ml", "l").

    Examples:
        >>> parse_weight("Arroz Cañuelas 1kg")
        {'peso_valor': 1.0, 'peso_unidad': 'kg'}
        >>> parse_weight("Fideos x 500 gramos")
        {'peso_valor': 500.0, 'peso_unidad': 'g'}
        >>> parse_weight("Aceite 1,5 l")
        {'peso_valor': 1.5, 'peso_unidad': 'l'}
    """
    if not text:
        return {"peso_valor": None, "peso_unidad": None}

    match = _PESO_PATTERN.search(text)
    if not match:
        return {"peso_valor": None, "peso_unidad": None}

    valor_str = match.group(1).replace(",", ".")
    unidad_raw = match.group(2).lower().strip()

    try:
        peso_valor = float(valor_str)
    except ValueError:
        logger.warning(f"No se pudo convertir el valor de peso '{valor_str}' a float.")
        return {"peso_valor": None, "peso_unidad": None}

    peso_unidad = _UNIT_MAP.get(unidad_raw, unidad_raw)

    return {"peso_valor": peso_valor, "peso_unidad": peso_unidad}

def clean_price(price_str: Optional[str]) -> Optional[float]:
    """
    Normaliza una cadena de texto que representa un precio y la convierte en float.
    Soporta formatos comunes de divisas latinoamericanas y globales, como:
    - "$ 14.590" -> 14590.0 (Chile/CLP)
    - "12.340,50" -> 12340.5
    - "1,234.56" -> 1234.56
    - "$1.490.-" -> 1490.0

    Args:
        price_str: Cadena de texto del precio.

    Returns:
        float: El precio limpio o None si no se pudo parsear o si es inválido.
    """
    if not price_str:
        return None

    # Tomar solo la primera línea: algunos supermercados devuelven precio actual + precio tachado
    # juntos en el mismo bloque de texto (ej: "$ 973,59\n$ 1.216,99"). Solo nos interesa el primero.
    cleaned = price_str.strip().splitlines()[0].strip()

    # Normalizar espacios (incluyendo &nbsp; = \u00a0 que VTEX usa en sus precios)
    cleaned = cleaned.replace('\u00a0', ' ')

    # Quitar símbolos monetarios comunes y terminaciones raras como ".-"
    cleaned = re.sub(r'[\$\s\-\.]*$', '', cleaned) # remueve fin de linea como ".-" o "."
    cleaned = re.sub(r'^[\$\s]+', '', cleaned)     # remueve prefijos de divisas o espacios

    if not cleaned:
        return None

    try:
        # Detectar el separador decimal y de miles
        # Si tiene puntos y comas (ej. 12.340,50 o 12,340.50)
        has_comma = ',' in cleaned
        has_dot = '.' in cleaned

        if has_comma and has_dot:
            # Encontrar las posiciones del último punto y última coma
            last_comma = cleaned.rindex(',')
            last_dot = cleaned.rindex('.')
            if last_comma > last_dot:
                # Coma es el decimal (ej: 12.340,50)
                cleaned = cleaned.replace('.', '').replace(',', '.')
            else:
                # Punto es el decimal (ej: 12,340.50)
                cleaned = cleaned.replace(',', '')
        elif has_comma:
            # Solo tiene comas. Podría ser separador decimal (ej: 14590,50)
            # o de miles (ej: 14,590 si es formato anglosajón sin decimales).
            # Si hay una coma seguida de exactamente 2 dígitos al final, es decimal.
            parts = cleaned.split(',')
            if len(parts) == 2 and len(parts[1]) <= 2:
                cleaned = cleaned.replace(',', '.')
            else:
                # Asumimos miles (ej: 14,590 -> 14590)
                cleaned = cleaned.replace(',', '')
        elif has_dot:
            # Solo tiene puntos. Para CLP (pesos chilenos) usualmente es miles (ej: 14.590).
            # Si hay un punto seguido de exactamente 2 dígitos al final, es decimal (ej: 14.99).
            parts = cleaned.split('.')
            if len(parts) == 2 and len(parts[1]) <= 2:
                # Es decimal (ej: 14.99)
                pass
            else:
                # Es miles o formato de miles sin decimales (ej: 14.590 -> 14590)
                cleaned = cleaned.replace('.', '')

        # Dejar solo caracteres numéricos y el punto decimal
        cleaned = re.sub(r'[^\d\.]', '', cleaned)
        
        if not cleaned:
            return None

        price_value = float(cleaned)
        return price_value

    except ValueError as e:
        logger.warning(f"No se pudo convertir el precio '{price_str}' a decimal: {e}")
        return None

def clean_stock(stock_str: Optional[str]) -> bool:
    """
    Normaliza el estado de stock a un booleano (disponible o no).

    Args:
        stock_str: Cadena que indica el stock (ej: "Disponible", "Agotado", "Sin Stock").

    Returns:
        bool: True si hay disponibilidad física/online, False en caso contrario.
    """
    if not stock_str:
        # Por defecto, asumimos True para no descartar productos a menos que estemos seguros de que está agotado.
        return True

    normalized = stock_str.strip().lower()

    # Términos explícitos de indisponibilidad
    out_of_stock_terms = [
        "agotado",
        "sin stock",
        "no disponible",
        "fuera de stock",
        "sin unidades",
        "próximamente",
        "retirado",
        "no disponible temporalmente"
    ]

    for term in out_of_stock_terms:
        if term in normalized:
            return False

    return True
