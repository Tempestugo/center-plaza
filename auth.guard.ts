import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const adminSecret = process.env.ADMIN_SECRET || 'Admin-Secret-123';

    // Lógica simplificada conforme o projeto original
    if (authHeader === adminSecret || authHeader === 'Bearer admin-token') {
      request.user = { role: 'admin', id: 1 };
    } else {
      request.user = { role: 'guest', id: 0 };
    }
    
    return true;
  }
}