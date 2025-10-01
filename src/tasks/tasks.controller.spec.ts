import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { Repository } from 'typeorm';

describe('TasksService', () => {
  let service: TasksService;
  let repository: Repository<Task>;

  // Mock do repositório
  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  describe('findAll', () => {
    it('deve retornar um array de tarefas', async () => {
      // Arrange
      const expectedTasks = [
        { id: 1, title: 'Tarefa 1', description: 'Descrição 1' },
        { id: 2, title: 'Tarefa 2', description: 'Descrição 2' },
      ];
      mockRepository.find.mockResolvedValue(expectedTasks);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expectedTasks);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar uma tarefa pelo ID', async () => {
      // Arrange
      const taskId = 1;
      const expectedTask = {
        id: taskId,
        title: 'Tarefa 1',
        description: 'Descrição 1',
      };
      mockRepository.findOne.mockResolvedValue(expectedTask);

      // Act
      const result = await service.findOne(taskId);

      // Assert
      expect(result).toEqual(expectedTask);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      // Arrange
      const taskId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(taskId)).rejects.toThrow(
        `Tarefa com ID ${taskId} não encontrada`,
      );
    });
  });

  describe('create', () => {
    it('deve criar uma nova tarefa', async () => {
      // Arrange
      const createTaskDto = {
        title: 'Nova Tarefa',
        description: 'Descrição da tarefa',
      };
      const createdTask = {
        id: 1,
        ...createTaskDto,
        status: 'aberto',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdTask);
      mockRepository.save.mockResolvedValue(createdTask);

      // Act
      const result = await service.create(createTaskDto);

      // Assert
      expect(result).toEqual(createdTask);
      expect(mockRepository.create).toHaveBeenCalledWith(createTaskDto);
      expect(mockRepository.save).toHaveBeenCalledWith(createdTask);
    });
  });
});
