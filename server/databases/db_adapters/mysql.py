import pymysql
from typing import Dict, List, Any, Tuple
from .base import DatabaseAdapter


class MySQLAdapter(DatabaseAdapter):
    
    def connect(self) -> None:
        """Establish MySQL connection"""
        try:
            self.connection = pymysql.connect(
                host=self.config['host'],
                port=self.config['port'],
                database=self.config['database'],
                user=self.config['username'],
                password=self.config['password'],
                connect_timeout=10,
                cursorclass=pymysql.cursors.DictCursor
            )
        except pymysql.err.OperationalError as e:
            error_code = e.args[0]
            if error_code == 1045:
                raise Exception("Authentication failed: Access denied (invalid username/password)")
            elif error_code == 2003:
                raise Exception(f"Connection failed: Cannot connect to host '{self.config['host']}'")
            elif error_code == 1049:
                raise Exception(f"Database '{self.config['database']}' does not exist")
            else:
                raise Exception(f"Connection error: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error: {str(e)}")
    
    def disconnect(self) -> None:
        """Close MySQL connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def test_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """Test MySQL connection"""
        try:
            self.connect()
            with self.connection.cursor() as cursor:
                # Test query
                cursor.execute("SELECT 1")
                cursor.fetchone()
                
                # Get server info
                cursor.execute("SELECT VERSION() as version")
                version = cursor.fetchone()['version']
                
                cursor.execute("SELECT DATABASE() as db")
                current_db = cursor.fetchone()['db']

                cursor.execute("SHOW VARIABLES LIKE 'character_set_server'")
                charset = cursor.fetchone()['Value']
                
                server_info = {
                    "version": version,
                    "current_database": current_db,
                    "character_set": charset,
                }
                
            return True, "Connection successful", server_info
        except Exception as e:
            return False, str(e), {}
        finally:
            self.disconnect()
    
    def get_schema(self) -> Dict[str, Any]:
        """Get MySQL schema information"""
        schema_info = {"tables": {}}
        
        try:
            self.connect()
            with self.connection.cursor() as cursor:
                # Get all tables
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                table_key = f"Tables_in_{self.config['database']}"
                
                for table_row in tables:
                    table_name = table_row[table_key]
                    schema_info['tables'][table_name] = {
                        "type": "TABLE",
                        "columns": []
                    }
                    
                    # Get columns for each table
                    cursor.execute(f"DESCRIBE `{table_name}`")
                    columns = cursor.fetchall()
                    
                    for col in columns:
                        column_info = {
                            "name": col['Field'],
                            "type": col['Type'],
                            "nullable": col['Null'] == 'YES',
                            "default": col['Default'],
                            "constraints": []
                        }
                        
                        # Parse type for length/precision
                        if '(' in col['Type'] and ')' in col['Type']:
                            base_type = col['Type'][:col['Type'].index('(')]
                            params = col['Type'][col['Type'].index('(')+1:col['Type'].index(')')]
                            column_info['type'] = base_type
                            if ',' in params:
                                precision, scale = params.split(',')
                                column_info['precision'] = int(precision)
                                column_info['scale'] = int(scale)
                            else:
                                column_info['length'] = int(params)
                        
                        # Add constraint info
                        if col['Key'] == 'PRI':
                            column_info['constraints'].append('PRIMARY KEY')
                        elif col['Key'] == 'MUL':
                            column_info['constraints'].append('FOREIGN KEY')
                        elif col['Key'] == 'UNI':
                            column_info['constraints'].append('UNIQUE')
                        
                        if col['Extra']:
                            column_info['extra'] = col['Extra']
                        
                        schema_info['tables'][table_name]['columns'].append(column_info)
                
                # Get summary
                schema_info['summary'] = {
                    'total_tables': len(tables),
                    'database_name': self.config['database']
                }
                
            return schema_info
        finally:
            self.disconnect()
    
    def execute_query(self, query: str, params: List[Any] = None) -> Any:
        """Execute a query and return results"""
        try:
            self.connect()
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                if query.strip().upper().startswith('SELECT'):
                    return cursor.fetchall()
                self.connection.commit()
                return cursor.rowcount
        finally:
            self.disconnect()
    
    def get_test_query(self) -> str:
        """MySQL test query"""
        return "SELECT 1"                