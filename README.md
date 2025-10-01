# Documentação de API com Swagger em NestJS

Notas de aula sobre documentação de API com Swagger em projetos NestJS.

## Sumário

- [Parte 1: Introdução ao Swagger](#parte-1-introdução-ao-swagger)
  - [O que é Swagger?](#o-que-é-swagger)
  - [Por que usar Swagger?](#por-que-usar-swagger)
  - [Conceitos principais](#conceitos-principais)
- [Parte 2: Implementação Prática](#parte-2-implementação-prática)
  - [1. Configuração inicial do Swagger](#1-configuração-inicial-do-swagger)
  - [2. Documentando a rota raiz](#2-documentando-a-rota-raiz)
  - [3. Documentando as rotas de tarefas](#3-documentando-as-rotas-de-tarefas)
  - [4. Documentando DTOs](#4-documentando-dtos)
  - [5. Testando a documentação](#5-testando-a-documentação)

---

## Parte 1: Introdução ao Swagger

### O que é Swagger?

Swagger (agora conhecido como OpenAPI Specification) é um conjunto de ferramentas para:
- **Projetar** APIs RESTful
- **Documentar** endpoints, parâmetros, respostas e modelos de dados
- **Testar** APIs diretamente através de uma interface web interativa

O Swagger gera automaticamente uma documentação visual e interativa da sua API, permitindo que desenvolvedores:
- Entendam rapidamente como usar a API
- Testem endpoints sem precisar de ferramentas externas como Postman
- Vejam exemplos de requisições e respostas

### Por que usar Swagger?

1. **Documentação automática**: A documentação é gerada a partir do código, reduzindo inconsistências
2. **Interface interativa**: Permite testar endpoints diretamente no navegador
3. **Padrão da indústria**: OpenAPI é amplamente adotado e reconhecido
4. **Facilita integração**: Outras equipes podem consumir sua API mais facilmente
5. **Sempre atualizada**: Como está vinculada ao código, a documentação acompanha as mudanças

### Conceitos principais

- **OpenAPI Specification (OAS)**: O padrão que define a estrutura da documentação
- **Swagger UI**: Interface visual para explorar e testar a API
- **Decorators**: No NestJS, usamos decorators para adicionar metadados aos endpoints
- **Schemas**: Definições dos modelos de dados (DTOs, entidades)
- **Tags**: Agrupam endpoints relacionados na documentação
- **Responses**: Definem os possíveis retornos de cada endpoint

---

## Parte 2: Implementação Prática

### 1. Configuração inicial do Swagger

Primeiro, certifique-se de que o pacote `@nestjs/swagger` está instalado:

```bash
npm install @nestjs/swagger swagger-ui-express
```

No arquivo `src/main.ts`, configure o Swagger após criar a aplicação:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Habilitar validação global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Tarefas')
    .setDescription('API para gerenciamento de tarefas (todos) da turma de Infoweb 2025')
    .setVersion('1.0.0')
    .addTag('root', 'Endpoints da raiz da aplicação')
    .addTag('tasks', 'Operações CRUD de tarefas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API rodando na porta ${port}`);
  console.log(`Documentação Swagger disponível em http://localhost:${port}/api`);
}
bootstrap();
```

**Explicação:**
- `DocumentBuilder`: Cria a configuração básica da documentação
- `setTitle()`: Define o título que aparece no topo da documentação
- `setDescription()`: Adiciona uma descrição geral da API
- `setVersion()`: Especifica a versão da API
- `addTag()`: Cria tags para organizar os endpoints
- `SwaggerModule.setup('api', ...)`: Define que a documentação estará disponível em `/api`

### 2. Documentando a rota raiz

O `AppController` possui um endpoint simples que retorna informações da API. Vamos documentá-lo:

**Arquivo: `src/app.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Obter informações da API' })
  @ApiResponse({
    status: 200,
    description: 'Retorna informações básicas da API',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'online' },
        version: { type: 'string', example: '1.0.0' },
        description: { 
          type: 'string', 
          example: 'Esta é API de tarefas (todos) da turma de Infoweb 2025.' 
        },
      },
    },
  })
  getInfo() {
    return this.appService.getInfo();
  }
}
```

**Explicação dos decorators:**
- `@ApiTags('root')`: Agrupa este controller sob a tag "root" na documentação
- `@ApiOperation()`: Adiciona uma descrição curta do que o endpoint faz
- `@ApiResponse()`: Define a estrutura da resposta, incluindo status code, descrição e schema

### 3. Documentando as rotas de tarefas

O `TasksController` possui operações CRUD completas. Vamos documentar cada endpoint:

**Arquivo: `src/tasks/tasks.controller.ts`**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './task.entity';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as tarefas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas retornada com sucesso',
    type: [Task],
  })
  findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma tarefa por ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID da tarefa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarefa encontrada',
    type: Task,
  })
  @ApiResponse({
    status: 404,
    description: 'Tarefa não encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma nova tarefa' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'Tarefa criada com sucesso',
    type: Task,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar uma tarefa' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID da tarefa a ser atualizada',
    example: 1,
  })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({
    status: 200,
    description: 'Tarefa atualizada com sucesso',
    type: Task,
  })
  @ApiResponse({
    status: 404,
    description: 'Tarefa não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar uma tarefa' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID da tarefa a ser deletada',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Tarefa deletada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarefa não encontrada',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tasksService.remove(id);
  }
}
```

**Explicação dos novos decorators:**
- `@ApiParam()`: Documenta parâmetros da URL (como `:id`)
- `@ApiBody()`: Especifica o DTO usado no corpo da requisição
- `type: [Task]`: Indica que o retorno é um array de Task
- `type: Task`: Indica que o retorno é um objeto Task

### 4. Documentando DTOs

Os DTOs (Data Transfer Objects) definem a estrutura dos dados enviados e recebidos. Vamos adicionar documentação:

**Arquivo: `src/tasks/dto/create-task.dto.ts`**

```typescript
import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task.entity';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Estudar NestJS',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada da tarefa',
    example: 'Aprender sobre documentação de APIs com Swagger',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Status atual da tarefa',
    enum: TaskStatus,
    example: TaskStatus.ABERTO,
    required: false,
    default: TaskStatus.ABERTO,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
```

**Arquivo: `src/tasks/dto/update-task.dto.ts`**

```typescript
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task.entity';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Estudar NestJS - Atualizado',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descrição detalhada da tarefa',
    example: 'Aprender sobre documentação de APIs com Swagger - Revisado',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Status atual da tarefa',
    enum: TaskStatus,
    example: TaskStatus.FAZENDO,
    required: false,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
```

**Arquivo: `src/tasks/task.entity.ts`**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum TaskStatus {
  ABERTO = 'aberto',
  FAZENDO = 'fazendo',
  FINALIZADO = 'finalizado',
}

@Entity()
export class Task {
  @ApiProperty({
    description: 'ID único da tarefa',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Título da tarefa',
    example: 'Estudar NestJS',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada da tarefa',
    example: 'Aprender sobre documentação de APIs com Swagger',
  })
  @Column()
  description: string;

  @ApiProperty({
    description: 'Status atual da tarefa',
    enum: TaskStatus,
    example: TaskStatus.ABERTO,
  })
  @Column({
    type: 'text',
    enum: TaskStatus,
    default: TaskStatus.ABERTO,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Data de criação da tarefa',
    example: '2025-01-15T10:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização da tarefa',
    example: '2025-01-15T14:30:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Explicação:**
- `@ApiProperty()`: Documenta cada propriedade da classe
- `description`: Explica o propósito do campo
- `example`: Fornece um valor de exemplo
- `enum`: Para campos com valores pré-definidos
- `required`: Indica se o campo é obrigatório (false = opcional)
- `default`: Valor padrão se não for fornecido

### 5. Testando a documentação

Após implementar todas as anotações:

1. **Inicie a aplicação:**
   ```bash
   npm run start:dev
   ```

2. **Acesse a documentação:**
   Abra seu navegador em: `http://localhost:3000/api`

3. **Explore a interface Swagger UI:**
   - Você verá todos os endpoints organizados por tags
   - Clique em cada endpoint para ver detalhes
   - Use o botão "Try it out" para testar diretamente

4. **Testando um endpoint:**
   - Clique em `POST /tasks`
   - Clique em "Try it out"
   - Edite o JSON de exemplo
   - Clique em "Execute"
   - Veja a resposta abaixo

**Resultado esperado:**
- Documentação visual e interativa
- Todos os endpoints listados com suas descrições
- Modelos de dados (schemas) documentados
- Exemplos de requisições e respostas
- Interface para testar a API sem ferramentas externas

---

## Comandos úteis

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run start:dev

# Executar testes
npm test

# Executar testes E2E
npm run test:e2e

# Build do projeto
npm run build
```

## Recursos adicionais

- [Documentação oficial do NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

**Desenvolvido para a turma de Infoweb 2025** 🚀
