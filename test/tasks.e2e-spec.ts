import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TaskStatus } from '../src/tasks/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let createdTaskId: number;

  beforeAll(async () => {
    // const orm = TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: process.env.DATABASE_HOST || 'localhost',
    //   port: parseInt(process.env.DATABASE_PORT || '5433'),
    //   username: process.env.DATABASE_USER || 'postgres',
    //   password: process.env.DATABASE_PASSWORD || 'postgres',
    //   database: process.env.DATABASE_NAME || 'test_database',
    //   entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    //   synchronize: true, // Apenas para testes
    //   dropSchema: true, // Limpa banco antes de cada execução
    // });
    //
    // const moduleFixture: TestingModule = await Test.createTestingModule({
    //   imports: [orm, AppModule],
    // }).compile();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar mesmas configurações do main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tasks (POST)', () => {
    it('deve criar uma nova tarefa', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: 'Tarefa de Teste E2E',
          description: 'Descrição da tarefa de teste',
          status: TaskStatus.ABERTO,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Tarefa de Teste E2E');
          expect(res.body.description).toBe('Descrição da tarefa de teste');
          expect(res.body.status).toBe(TaskStatus.ABERTO);
          createdTaskId = res.body.id; // Salvar ID para próximos testes
        });
    });

    it('deve retornar 400 para dados inválidos', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: '', // título vazio - inválido
          description: 'Descrição',
        })
        .expect(400);
    });

    it('deve retornar 400 para campos não permitidos', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: 'Tarefa',
          description: 'Descrição',
          campoInvalido: 'valor',
        })
        .expect(400);
    });
  });

  describe('/tasks (GET)', () => {
    it('deve retornar array de tarefas', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/tasks/:id (GET)', () => {
    it('deve retornar uma tarefa específica', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdTaskId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('status');
        });
    });

    it('deve retornar 404 para tarefa inexistente', () => {
      return request(app.getHttpServer()).get('/tasks/99999').expect(404);
    });

    it('deve retornar 400 para ID inválido', () => {
      return request(app.getHttpServer()).get('/tasks/abc').expect(400);
    });
  });

  describe('/tasks/:id (PUT)', () => {
    it('deve atualizar uma tarefa existente', () => {
      return request(app.getHttpServer())
        .put(`/tasks/${createdTaskId}`)
        .send({
          title: 'Tarefa Atualizada',
          description: 'Descrição atualizada',
          status: TaskStatus.FAZENDO,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdTaskId);
          expect(res.body.title).toBe('Tarefa Atualizada');
          expect(res.body.description).toBe('Descrição atualizada');
          expect(res.body.status).toBe(TaskStatus.FAZENDO);
        });
    });

    it('deve atualizar parcialmente uma tarefa', () => {
      return request(app.getHttpServer())
        .put(`/tasks/${createdTaskId}`)
        .send({
          status: TaskStatus.FINALIZADO,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(TaskStatus.FINALIZADO);
        });
    });

    it('deve retornar 404 para tarefa inexistente', () => {
      return request(app.getHttpServer())
        .put('/tasks/99999')
        .send({
          title: 'Título',
        })
        .expect(404);
    });
  });

  describe('/tasks/:id (DELETE)', () => {
    it('deve deletar uma tarefa existente', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .expect(204);
    });

    it('deve retornar 404 ao tentar deletar tarefa já deletada', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .expect(404);
    });
  });
});
