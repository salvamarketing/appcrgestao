import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Perfil '${req.user.role}' não possui permissão para esta operação.`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin', 'manager');
export const requireTechnicianOrAdmin = requireRole('admin', 'manager', 'employee', 'technician');
