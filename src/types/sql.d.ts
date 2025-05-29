export interface ConnectionPool {
  request(): {
    query(query: string): Promise<{ recordset: any[] }>;
    input(name: string, type?: any, value?: any): any;
    output(name: string, type: any, value?: any): any;
    execute(procedure: string): Promise<{ recordset: any[]; recordsets: any[][]; output: any; returnValue: any }>;
  };
  close(): Promise<void>;
} 