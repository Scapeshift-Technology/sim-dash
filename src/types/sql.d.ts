export interface ConnectionPool {
  request(): {
    query(query: string): Promise<{ recordset: any[] }>;
  };
  close(): Promise<void>;
} 