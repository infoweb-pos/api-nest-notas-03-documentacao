import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getInfo', () => {
    it('deve retornar informações da API com status, version e description', () => {
      const result = appController.getInfo();
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result.status).toBe('online');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toBe('Esta é API de tarefas (todos) da turma de Infoweb 2025.');
    });
  });
});