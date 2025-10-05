import pymssql
from typing import Dict, List, Any, Tuple
from .base import DatabaseAdapter


class MSSQLAdapter(DatabaseAdapter):
    
    def connect(self) -> None:
        """Establish SQL Server connection"""
        try:
            # Handle potential instance names in host (e.g., server\instance)
            server = self.config['host']
            
            # Basic connection parameters
            conn_params = {
                'server': server,
                'port': self.config['port'],
                'database': self.config['database'],
                'user': self.config['username'],
                'password': self.config['password'],
                'timeout': 10,
                'login_timeout': 10,
                'charset': 'UTF-8'
            }
            
            # Handle TLS/SSL
            if self.config.get('ssl_enabled'):
                conn_params['tds_version'] = '7.4'  # Use newer TDS version for better security
            
            self.connection = pymssql.connect(**conn_params)
            
        except pymssql.InterfaceError as e:
            error_str = str(e)
            if "Cannot connect to server" in error_str:
                raise Exception(f"Connection failed: Cannot connect to SQL Server at {self.config['host']}:{self.config['port']}")
            else:
                raise Exception(f"Interface error: {error_str}")
        except pymssql.DatabaseError as e:
            error_str = str(e)
            if "Login failed" in error_str:
                raise Exception("Authentication failed: Invalid username or password")
            elif "Cannot open database" in error_str:
                raise Exception(f"Database '{self.config['database']}' does not exist or access denied")
            else:
                raise Exception(f"Database error: {error_str}")
        except Exception as e:
            raise Exception(f"Unexpected error: {str(e)}")
    
    def disconnect(self) -> None:
        """Close SQL Server connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def test_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """Test SQL Server connection"""
        try:
            self.connect()
            cursor = self.connection.cursor()
            
            # Test query
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
            # Get server info
            cursor.execute("SELECT @@VERSION")
            version = cursor.fetchone()[0]
            
            cursor.execute("SELECT DB_NAME()")
            current_db = cursor.fetchone()[0]
            
            cursor.execute("SELECT SERVERPROPERTY('ProductLevel')")
            product_level = cursor.fetchone()[0]
            
            cursor.execute("SELECT SERVERPROPERTY('Edition')")
            edition = cursor.fetchone()[0]
            
            server_info = {
                "version": version.split('\n')[0] if isinstance(version, str) else str(version),
                "current_database": str(current_db) if current_db else '',
                "product_level": str(product_level) if product_level else '',
                "edition": str(edition) if edition else '',
            }
            
            # Ensure all values are JSON serializable
            for key, value in server_info.items():
                if isinstance(value, bytes):
                    server_info[key] = value.decode('utf-8', errors='ignore')
                elif not isinstance(value, (str, int, float, bool, list, dict, type(None))):
                    server_info[key] = str(value)
            
            return True, "Connection successful", server_info
        except Exception as e:
            return False, str(e), {}
        finally:
            self.disconnect()
    
    def get_schema(self) -> Dict[str, Any]:
        """Get SQL Server schema information"""
        schema_info = {"tables": {}}
        
        try:
            self.connect()
            cursor = self.connection.cursor()
            
            # Get schema name or use default
            schema_name = self.config.get('schema', 'dbo')
            
            # Get all tables and views
            cursor.execute("""
                SELECT 
                    TABLE_SCHEMA,
                    TABLE_NAME,
                    TABLE_TYPE
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                ORDER BY TABLE_NAME
            """, (schema_name,))
            
            tables = cursor.fetchall()
            
            for schema, table_name, table_type in tables:
                schema_info['tables'][table_name] = {
                    "type": table_type,
                    "columns": []
                }
                
                # Get columns for each table
                cursor.execute("""
                    SELECT 
                        c.COLUMN_NAME,
                        c.DATA_TYPE,
                        c.CHARACTER_MAXIMUM_LENGTH,
                        c.NUMERIC_PRECISION,
                        c.NUMERIC_SCALE,
                        c.IS_NULLABLE,
                        c.COLUMN_DEFAULT,
                        CASE 
                            WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PRIMARY KEY'
                            WHEN fk.COLUMN_NAME IS NOT NULL THEN 'FOREIGN KEY'
                            ELSE NULL
                        END as CONSTRAINT_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS c
                    LEFT JOIN (
                        SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
                        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                    ) pk ON c.TABLE_SCHEMA = pk.TABLE_SCHEMA 
                        AND c.TABLE_NAME = pk.TABLE_NAME 
                        AND c.COLUMN_NAME = pk.COLUMN_NAME
                    LEFT JOIN (
                        SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
                        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                        WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
                    ) fk ON c.TABLE_SCHEMA = fk.TABLE_SCHEMA 
                        AND c.TABLE_NAME = fk.TABLE_NAME 
                        AND c.COLUMN_NAME = fk.COLUMN_NAME
                    WHERE c.TABLE_SCHEMA = %s AND c.TABLE_NAME = %s
                    ORDER BY c.ORDINAL_POSITION
                """, (schema_name, table_name))
                
                columns = cursor.fetchall()
                
                for col in columns:
                    column_info = {
                        "name": col[0],
                        "type": col[1],
                        "nullable": col[5] == 'YES',
                        "default": col[6],
                        "constraints": []
                    }
                    
                    # Add length/precision info
                    if col[2]:  # CHARACTER_MAXIMUM_LENGTH
                        column_info['length'] = col[2]
                    elif col[3]:  # NUMERIC_PRECISION
                        column_info['precision'] = col[3]
                        if col[4]:  # NUMERIC_SCALE
                            column_info['scale'] = col[4]
                    
                    # Add constraint info
                    if col[7]:  # CONSTRAINT_TYPE
                        column_info['constraints'].append(col[7])
                    
                    schema_info['tables'][table_name]['columns'].append(column_info)
            
            # Add identity columns info
            cursor.execute("""
                SELECT 
                    OBJECT_SCHEMA_NAME(object_id) AS schema_name,
                    OBJECT_NAME(object_id) AS table_name,
                    name AS column_name
                FROM sys.identity_columns
                WHERE OBJECT_SCHEMA_NAME(object_id) = %s
            """, (schema_name,))
            
            identity_columns = cursor.fetchall()
            for schema, table, column in identity_columns:
                if table in schema_info['tables']:
                    for col_info in schema_info['tables'][table]['columns']:
                        if col_info['name'] == column:
                            if 'IDENTITY' not in col_info['constraints']:
                                col_info['constraints'].append('IDENTITY')
            
            # Get summary
            schema_info['summary'] = {
                'total_tables': len(tables),
                'schema_name': schema_name,
                'database_name': self.config['database']
            }
            
            cursor.close()
            return schema_info
        finally:
            self.disconnect()
    
    def execute_query(self, query: str, params: List[Any] = None) -> Any:
        """Execute a query and return results"""
        try:
            self.connect()
            cursor = self.connection.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            # Check if it's a SELECT query
            if query.strip().upper().startswith('SELECT'):
                columns = [column[0] for column in cursor.description]
                rows = cursor.fetchall()
                # Return as list of dicts for consistency
                return [dict(zip(columns, row)) for row in rows]
            else:
                self.connection.commit()
                return cursor.rowcount
                
        finally:
            if cursor:
                cursor.close()
            self.disconnect()
    
    def get_test_query(self) -> str:
        """SQL Server test query"""
        return "SELECT 1"