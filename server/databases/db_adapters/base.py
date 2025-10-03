from abc import ABC, abstractmethod
from typing import Dict, List, Any, Tuple


class DatabaseAdapter(ABC):
    """Base class for all database adapters"""
    
    def __init__(self, connection_config: Dict[str, Any]):
        self.config = connection_config
        self.connection = None
    
    @abstractmethod
    def connect(self) -> None:
        """Establish database connection"""
        pass
    
    @abstractmethod
    def disconnect(self) -> None:
        """Close database connection"""
        pass
    
    @abstractmethod
    def test_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Test database connection
        Returns: (success: bool, message: str, server_info: dict)
        """
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """
        Get database schema information
        Returns: Dictionary with tables/collections and their structure
        """
        pass
    
    @abstractmethod
    def execute_query(self, query: str, params: List[Any] = None) -> Any:
        """Execute a query and return results"""
        pass
    
    def get_test_query(self) -> str:
        """Get database-specific test query"""
        return "SELECT 1"