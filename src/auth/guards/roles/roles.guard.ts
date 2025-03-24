import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/enums/user.enum';

// TODO: Check if the below functions are correct and required
interface RequestUser {
  role: Role;
  // Add other user properties as needed
}

interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Role[]>('roles', context.getHandler());

    if (!roles) {
      return true; // If no roles specified, allow access
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: User not authenticated');
    }

    // Check if the user's role is one of the allowed roles
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Access denied: Insufficient role');
    }

    return true;
  }
}
