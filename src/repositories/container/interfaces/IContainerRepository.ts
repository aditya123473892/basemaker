import { Container, CreateContainerData, UpdateContainerData } from '../../../models/trip';

export interface IContainerRepository {
  getAllContainers(companyId: string): Promise<Container[]>;
  getContainerById(id: string, companyId: string): Promise<Container | null>;
  getContainerByNumber(containerNumber: string, companyId: string): Promise<Container | null>;
  createContainer(containerData: CreateContainerData, companyId: string): Promise<Container>;
  updateContainer(id: string, updateData: UpdateContainerData, companyId: string): Promise<Container>;
  deleteContainer(id: string, companyId: string): Promise<void>;
}
