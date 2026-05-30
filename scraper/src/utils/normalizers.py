import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

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

    # Eliminar espacios en blanco alrededor
    cleaned = price_str.strip()

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
