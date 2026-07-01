import { BaseRepository } from '../base/BaseRepository';
import { IContainerRepository } from './interfaces/IContainerRepository';
import { Container, CreateContainerData, UpdateContainerData } from '../../models/trip';
import * as fs from 'fs';
import * as path from 'path';

export class ContainerRepository extends BaseRepository implements IContainerRepository {
  private getAllContainersQuery: string;
  private getContainerByIdQuery: string;
  private getContainerByNumberQuery: string;
  private createContainerQuery: string;
  private updateContainerQuery: string;
  private deleteContainerQuery: string;

  constructor() {
    super();
    this.getAllContainersQuery = fs.readFileSync(
      path.join(__dirname, 'queries/getAllContainers.sql'),
      'utf8'
    );
    this.getContainerByIdQuery = fs.readFileSync(
      path.join(__dirname, 'queries/getContainerById.sql'),
      'utf8'
    );
    this.getContainerByNumberQuery = fs.readFileSync(
      path.join(__dirname, 'queries/getContainerByNumber.sql'),
      'utf8'
    );
    this.createContainerQuery = fs.readFileSync(
      path.join(__dirname, 'queries/createContainer.sql'),
      'utf8'
    );
    this.updateContainerQuery = fs.readFileSync(
      path.join(__dirname, 'queries/updateContainer.sql'),
      'utf8'
    );
    this.deleteContainerQuery = fs.readFileSync(
      path.join(__dirname, 'queries/deleteContainer.sql'),
      'utf8'
    );
  }

  async getAllContainers(companyId: string): Promise<Container[]> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('companyId', sql.UniqueIdentifier, companyId);

      const result = await request.query(this.getAllContainersQuery);
      return result.recordset;
    } catch (error) {
      console.error('Error in getAllContainers:', error);
      throw new Error('Failed to fetch containers');
    }
  }

  async getContainerById(id: string, companyId: string): Promise<Container | null> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('id', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);

      const result = await request.query(this.getContainerByIdQuery);
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Error in getContainerById:', error);
      throw new Error('Failed to fetch container');
    }
  }

  async getContainerByNumber(containerNumber: string, companyId: string): Promise<Container | null> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('containerNumber', sql.NVarChar, containerNumber);
      request.input('companyId', sql.UniqueIdentifier, companyId);

      const result = await request.query(this.getContainerByNumberQuery);
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Error in getContainerByNumber:', error);
      throw new Error('Failed to fetch container');
    }
  }

  async createContainer(containerData: CreateContainerData, companyId: string): Promise<Container> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('companyId', sql.UniqueIdentifier, companyId);
      request.input('containerNumber', sql.NVarChar, containerData.container_number);
      request.input('containerType', sql.NVarChar, containerData.container_type);
      request.input('sizeFt', sql.Int, containerData.size_ft);

      const result = await request.query(this.createContainerQuery);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in createContainer:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }

  async updateContainer(id: string, updateData: UpdateContainerData, companyId: string): Promise<Container> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('id', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);
      request.input('containerNumber', sql.NVarChar, updateData.container_number);
      request.input('containerType', sql.NVarChar, updateData.container_type);
      request.input('sizeFt', sql.Int, updateData.size_ft);
      request.input('isActive', sql.Bit, updateData.is_active);

      const result = await request.query(this.updateContainerQuery);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in updateContainer:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }

  async deleteContainer(id: string, companyId: string): Promise<void> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('id', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);

      await request.query(this.deleteContainerQuery);
    } catch (error) {
      console.error('Error in deleteContainer:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }
}
