from pymongo import MongoClient
from typing import Dict, List, Any, Tuple
from .base import DatabaseAdapter
import time


class MongoDBAdapter(DatabaseAdapter):
    
    def connect(self) -> None:
        """Establish MongoDB connection"""
        try:
            # Check if it's Atlas connection
            if self.config.get('mongodb_connection_type') == 'atlas':
                # MongoDB Atlas format - Atlas hosts typically contain 'mongodb.net'
                connection_string = f"mongodb+srv://{self.config['username']}:{self.config['password']}@{self.config['host']}/{self.config['database']}?retryWrites=true&w=majority"
            else:
                # Standard MongoDB format
                connection_string = f"mongodb://{self.config['username']}:{self.config['password']}@{self.config['host']}:{self.config['port']}/{self.config['database']}"
            
            print(f"Connection string being used: {connection_string[:20]}...")  # Debug - shows protocol
            
            self.connection = MongoClient(
                connection_string,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000
            )
            # Force connection to check if it's valid
            self.connection.server_info()
        except Exception as e:
            error_str = str(e)
            if "Authentication failed" in error_str:
                raise Exception("Authentication failed: Invalid username or password")
            elif "ServerSelectionTimeoutError" in error_str or "getaddrinfo failed" in error_str:
                if self.config.get('mongodb_connection_type') == 'atlas':
                    raise Exception(f"Connection failed: Cannot connect to MongoDB Atlas. Please check: 1) Your cluster address is correct, 2) Your IP is whitelisted in Atlas, 3) Your network allows outbound connections to Atlas")
                else:
                    raise Exception(f"Connection failed: Cannot connect to MongoDB at {self.config['host']}:{self.config['port']}")
            else:
                raise Exception(f"Connection error: {error_str}")
    
    def disconnect(self) -> None:
        """Close MongoDB connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def test_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """Test MongoDB connection"""
        try:
            start_time = time.time()
            self.connect()
            
            # Run ping command
            db = self.connection[self.config['database']]
            result = db.command('ping')
            
            # Get server info
            server_info = self.connection.server_info()
            
            response_time = int((time.time() - start_time) * 1000)
            
            return True, "Connection successful", {
                "version": server_info.get('version', 'Unknown'),
                "gitVersion": server_info.get('gitVersion', ''),
                "response_time_ms": response_time
            }
        except Exception as e:
            return False, str(e), {}
        finally:
            self.disconnect()
    
    def get_schema(self) -> Dict[str, Any]:
        """Get MongoDB schema information (collections and sample docs)"""
        schema_info = {"collections": {}}
        
        try:
            self.connect()
            db = self.connection[self.config['database']]
            
            # Get all collections
            collections = db.list_collection_names()
            
            for collection_name in collections:
                collection = db[collection_name]
                
                # Get collection stats
                stats = db.command("collStats", collection_name)
                
                # Get a sample document to infer schema
                sample_doc = collection.find_one()
                
                schema_info['collections'][collection_name] = {
                    "type": "COLLECTION",
                    "count": stats.get('count', 0),
                    "size": stats.get('size', 0),
                    "avgObjSize": stats.get('avgObjSize', 0),
                    "fields": []
                }
                
                # Infer fields from sample document
                if sample_doc:
                    fields = self._extract_fields(sample_doc)
                    schema_info['collections'][collection_name]['fields'] = fields
            
            schema_info['summary'] = {
                'total_collections': len(collections),
                'database_name': self.config['database']
            }
            
            return schema_info
        finally:
            self.disconnect()
    
    def _extract_fields(self, doc: Dict, prefix: str = "") -> List[Dict]:
        """Extract field information from a document"""
        fields = []
        for key, value in doc.items():
            field_path = f"{prefix}.{key}" if prefix else key
            field_info = {
                "name": field_path,
                "type": type(value).__name__,
                "sample_value": str(value)[:50] if not isinstance(value, (dict, list)) else None
            }
            
            if isinstance(value, dict):
                field_info["type"] = "object"
                # Recursively extract nested fields
                nested_fields = self._extract_fields(value, field_path)
                fields.extend(nested_fields)
            elif isinstance(value, list) and len(value) > 0:
                field_info["type"] = f"array[{type(value[0]).__name__}]"
            
            fields.append(field_info)
        return fields
    
    def execute_query(self, query: str, params: List[Any] = None) -> Any:
        """Execute MongoDB command"""
        try:
            self.connect()
            db = self.connection[self.config['database']]
            # For MongoDB, we expect query to be a dict command
            if isinstance(query, str):
                import json
                query = json.loads(query)
            return db.command(query)
        finally:
            self.disconnect()
    
    def get_test_query(self) -> str:
        """MongoDB test command"""
        return '{"ping": 1}'