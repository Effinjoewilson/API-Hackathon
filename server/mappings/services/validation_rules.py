# Centralized validation rules to be used by both frontend and backend
VALIDATION_RULES = {
    "type_compatibility": {
        "string": {
            "compatible_with": ["text", "varchar", "char", "string", "str"],
            "transformations_allowed": ["lowercase", "uppercase", "trim", "truncate_50", "truncate_255"],
        },
        "integer": {
            "compatible_with": ["int", "integer", "bigint", "smallint", "tinyint", "number"],
            "transformations_allowed": ["parse_int", "multiply", "divide", "add", "subtract"],
        },
        "float": {
            "compatible_with": ["float", "double", "decimal", "numeric", "real"],
            "transformations_allowed": ["parse_float", "multiply", "divide", "add", "subtract"],
        },
        "boolean": {
            "compatible_with": ["bool", "boolean", "bit"],
            "transformations_allowed": ["parse_bool", "boolean_to_bit"],
        },
        "date": {
            "compatible_with": ["date", "datetime", "timestamp"],
            "transformations_allowed": ["parse_date", "format_date_us", "format_date_iso"],
        },
        "object": {
            "compatible_with": ["json", "jsonb", "text"],
            "transformations_allowed": ["json_stringify", "json_parse"],
        },
    },
    "format_validators": {
        "email": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        "phone": r'^[\d\s\-\+\(\)]+$',
        "date": r'^\d{4}-\d{2}-\d{2}$',
        "url": r'^https?://',
    }
}

def export_validation_rules():
    """Export validation rules for frontend consumption"""
    return VALIDATION_RULES