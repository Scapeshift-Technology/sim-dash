import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentParty } from '@/store/slices/authSlice';
import { EntityConfig, EntityData } from '../types';

interface UseEntityCRUDProps<T = EntityData> {
  config: EntityConfig<T>;
}

interface UseEntityCRUDReturn<T = EntityData> {
  fetchEntities: () => Promise<T[]>;
  createEntity: (data: Partial<T>) => Promise<void>;
  updateEntity: (id: string | number, data: Partial<T>) => Promise<void>;
  deleteEntity: (id: string | number) => Promise<void>;
}

export const useEntityCRUD = <T = EntityData>({ 
  config 
}: UseEntityCRUDProps<T>): UseEntityCRUDReturn<T> => {
  const currentParty = useSelector(selectCurrentParty);

  const buildSqlQuery = useCallback((
    functionName: string, 
    params: Record<string, any> = {},
    selectColumns?: string[]
  ): string => {
    // Always include @Party parameter from current user context
    const allParams = {
      Party: currentParty,
      ...params
    };

    // Build parameter string for SQL execution
    const paramString = Object.entries(allParams)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        // Handle different value types for SQL
        if (typeof value === 'string') {
          // Escape single quotes in strings
          const escapedValue = value.replace(/'/g, "''");
          return `@${key} = '${escapedValue}'`;
        } else if (typeof value === 'number') {
          return `@${key} = ${value}`;
        } else if (typeof value === 'boolean') {
          return `@${key} = ${value ? 1 : 0}`;
        } else if (value && Object.prototype.toString.call(value) === '[object Date]') {
          // Check if it's a Date object using Object.prototype.toString
          return `@${key} = '${(value as Date).toISOString()}'`;
        } else {
          // Convert to string as fallback
          return `@${key} = '${String(value)}'`;
        }
      })
      .join(', ');

    // Determine if it's a function call or stored procedure
    if (functionName.includes('_tr') || functionName.includes('EXEC')) {
      // Stored procedure
      return paramString 
        ? `EXEC ${functionName} ${paramString}`
        : `EXEC ${functionName}`;
    } else {
      // Table-valued function with explicit column selection
      const columnList = selectColumns ? selectColumns.join(', ') : '*';
      
      return paramString 
        ? `SELECT ${columnList} FROM ${functionName}(${Object.values(allParams).map(value => {
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`;
            }
            return value;
          }).join(', ')})`
        : `SELECT ${columnList} FROM ${functionName}()`;
    }
  }, [currentParty]);

  const executeSql = useCallback(async (query: string) => {
    if (!window.electronAPI?.executeSqlQuery) {
      throw new Error('SQL execution API is not available.');
    }
    
    try {
      const result = await window.electronAPI.executeSqlQuery(query);
      return result;
    } catch (error: any) {
      console.error(`SQL Error for query: ${query}`, error);
      throw new Error(error.message || 'Database operation failed');
    }
  }, []);

  const transformData = useCallback((rawData: any[], fetchColumns?: EntityConfig['database']['fetchColumns']): T[] => {
    if (!fetchColumns) {
      return rawData;
    }

    return rawData.map(row => {
      let transformedRow = { ...row };

      // Trim CHAR columns if specified
      if (fetchColumns.trimCharColumns) {
        fetchColumns.trimCharColumns.forEach(column => {
          if (transformedRow[column] && typeof transformedRow[column] === 'string') {
            transformedRow[column] = transformedRow[column].trim();
          }
        });
      }

      // Apply column transformations if specified
      if (fetchColumns.transformColumns) {
        Object.entries(fetchColumns.transformColumns).forEach(([column, transformation]) => {
          if (typeof transformation === 'string') {
            // Simple value assignment
            transformedRow[column] = transformation;
          } else if (typeof transformation === 'function') {
            // Function transformation
            transformedRow[column] = transformation(transformedRow[column]);
          }
        });
      }

      return transformedRow;
    });
  }, []);

  const fetchEntities = useCallback(async (): Promise<T[]> => {
    if (!config.database.fetchFunction) {
      throw new Error('Fetch function not configured');
    }

    const selectColumns = config.database.fetchColumns?.select;
    const query = buildSqlQuery(config.database.fetchFunction, {}, selectColumns);
    const result = await executeSql(query);
    
    const rawData = result.recordset || [];
    return transformData(rawData, config.database.fetchColumns);
  }, [config.database.fetchFunction, config.database.fetchColumns, buildSqlQuery, executeSql, transformData]);

  const createEntity = useCallback(async (data: Partial<T>): Promise<void> => {
    if (!config.database.addFunction) {
      throw new Error('Add function not configured');
    }

    // Remove any undefined values and prepare data for SQL
    const cleanData = Object.entries(data)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {});

    const query = buildSqlQuery(config.database.addFunction, cleanData);
    await executeSql(query);
  }, [config.database.addFunction, buildSqlQuery, executeSql]);

  const updateEntity = useCallback(async (
    id: string | number, 
    data: Partial<T>
  ): Promise<void> => {
    if (!config.database.updateFunction) {
      throw new Error('Update function not configured');
    }

    // Include the primary key in the update data
    const updateData = {
      ...data,
      [config.primaryKey]: id
    };

    // Remove any undefined values
    const cleanData = Object.entries(updateData)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {});

    const query = buildSqlQuery(config.database.updateFunction, cleanData);
    await executeSql(query);
  }, [config.database.updateFunction, config.primaryKey, buildSqlQuery, executeSql]);

  const deleteEntity = useCallback(async (id: string | number): Promise<void> => {
    if (!config.database.deleteFunction) {
      throw new Error('Delete function not configured');
    }

    const deleteData = {
      [config.primaryKey]: id
    };

    const query = buildSqlQuery(config.database.deleteFunction, deleteData);
    await executeSql(query);
  }, [config.database.deleteFunction, config.primaryKey, buildSqlQuery, executeSql]);

  return {
    fetchEntities,
    createEntity,
    updateEntity,
    deleteEntity
  };
}; 