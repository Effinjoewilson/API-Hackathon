from typing import Dict, Any, List
from .postgres import PostgreSQLAdapter
from .mysql import MySQLAdapter
from .mongodb import MongoDBAdapter
from .base import DatabaseAdapter


class DatabaseAdapterFactory:
    """Factory to create database adapters based on type"""
    
    _adapters = {
        'postgresql': PostgreSQLAdapter,
        'mysql': MySQLAdapter,
        'mongodb': MongoDBAdapter,
    }
    
    @classmethod
    def create_adapter(cls, db_type: str, config: Dict[str, Any]) -> DatabaseAdapter:
        """
        Create a database adapter instance
        
        Args:
            db_type: Type of database (postgresql, mysql, mongodb, etc.)
            config: Connection configuration dictionary
            
        Returns:
            DatabaseAdapter instance
            
        Raises:
            ValueError: If database type is not supported
        """
        if db_type not in cls._adapters:
            raise ValueError(f"Unsupported database type: {db_type}")
        
        adapter_class = cls._adapters[db_type]
        return adapter_class(config)
    
    @classmethod
    def get_supported_types(cls) -> List[str]:
        """Get list of supported database types"""
        return list(cls._adapters.keys())