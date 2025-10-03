import psycopg2
import psycopg2.extras
from typing import Dict, List, Any, Tuple
from .base import DatabaseAdapter


class PostgreSQLAdapter(DatabaseAdapter):
    
    def connect(self) -> None:
        """Establish PostgreSQL connection"""
        try:
            self.connection = psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                database=self.config['database'],
                user=self.config['username'],
                password=self.config['password'],
                connect_timeout=10,
                options=f"-c search_path={self.config.get('schema', 'public')}" if self.config.get('schema') else ""
            )
        except psycopg2.OperationalError as e:
            if "password authentication failed" in str(e):
                raise Exception("Authentication failed: Invalid username or password")
            elif "could not connect to server" in str(e):
                raise Exception("Connection failed: Host unreachable or incorrect host/port")
            elif "database" in str(e) and "does not exist" in str(e):
                raise Exception(f"Database '{self.config['database']}' does not exist")
            else:
                raise Exception(f"Connection error: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error: {str(e)}")
    
    def disconnect(self) -> None:
        """Close PostgreSQL connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def test_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """Test PostgreSQL connection"""
        try:
            self.connect()
            with self.connection.cursor() as cursor:
                # Test query
                cursor.execute("SELECT 1")
                cursor.fetchone()
                
                # Get server info
                cursor.execute("SELECT version()")
                version = cursor.fetchone()[0]
                
                cursor.execute("SELECT current_database()")
                current_db = cursor.fetchone()[0]
                
                server_info = {
                    "version": version,
                    "current_database": current_db,
                    "server_encoding": self.connection.encoding,
                }
                
            return True, "Connection successful", server_info
        except Exception as e:
            return False, str(e), {}
        finally:
            self.disconnect()
    
    def get_schema(self) -> Dict[str, Any]:
        """Get PostgreSQL schema information"""
        schema_info = {"tables": {}}
        
        try:
            self.connect()
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                # Get all tables in the schema
                schema_name = self.config.get('schema', 'public')
                
                cursor.execute("""
                    SELECT 
                        table_name,
                        table_type
                    FROM information_schema.tables
                    WHERE table_schema = %s
                    AND table_type IN ('BASE TABLE', 'VIEW')
                    ORDER BY table_name
                """, (schema_name,))
                
                tables = cursor.fetchall()
                
                for table in tables:
                    table_name = table['table_name']
                    schema_info['tables'][table_name] = {
                        "type": table['table_type'],
                        "columns": []
                    }
                    
                    # Get columns for each table
                    cursor.execute("""
                        SELECT 
                            c.column_name,
                            c.data_type,
                            c.character_maximum_length,
                            c.numeric_precision,
                            c.numeric_scale,
                            c.is_nullable,
                            c.column_default,
                            tc.constraint_type
                        FROM information_schema.columns c
                        LEFT JOIN information_schema.key_column_usage kcu
                            ON c.table_schema = kcu.table_schema 
                            AND c.table_name = kcu.table_name 
                            AND c.column_name = kcu.column_name
                        LEFT JOIN information_schema.table_constraints tc
                            ON kcu.constraint_name = tc.constraint_name
                            AND kcu.table_schema = tc.table_schema
                            AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
                        WHERE c.table_schema = %s AND c.table_name = %s
                        ORDER BY c.ordinal_position
                    """, (schema_name, table_name))
                    
                    columns = cursor.fetchall()
                    
                    for col in columns:
                        column_info = {
                            "name": col['column_name'],
                            "type": col['data_type'],
                            "nullable": col['is_nullable'] == 'YES',
                            "default": col['column_default'],
                            "constraints": []
                        }
                        
                        # Add length/precision info
                        if col['character_maximum_length']:
                            column_info['length'] = col['character_maximum_length']
                        elif col['numeric_precision']:
                            column_info['precision'] = col['numeric_precision']
                            if col['numeric_scale']:
                                column_info['scale'] = col['numeric_scale']
                        
                        # Add constraint info
                        if col['constraint_type'] == 'PRIMARY KEY':
                            column_info['constraints'].append('PRIMARY KEY')
                        elif col['constraint_type'] == 'FOREIGN KEY':
                            column_info['constraints'].append('FOREIGN KEY')
                        
                        schema_info['tables'][table_name]['columns'].append(column_info)
                
                # Get total counts
                schema_info['summary'] = {
                    'total_tables': len(tables),
                    'schema_name': schema_name
                }
                
            return schema_info
        finally:
            self.disconnect()
    
    def execute_query(self, query: str, params: List[Any] = None) -> Any:
        """Execute a query and return results"""
        try:
            self.connect()
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                if cursor.description:
                    return cursor.fetchall()
                return cursor.rowcount
        finally:
            self.disconnect()
    
    def get_test_query(self) -> str:
        """PostgreSQL test query"""
        return "SELECT 1"