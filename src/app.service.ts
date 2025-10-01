import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getInfo() {
    return { 
      status: 'online', 
      version: '1.0.0', 
      description: 'Esta é API de tarefas (todos) da turma de Infoweb 2025.'
    };
  }
}
