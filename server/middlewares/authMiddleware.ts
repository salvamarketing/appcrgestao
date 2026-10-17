import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
  };
}

export function parseUserIdFromToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  const raw = token.replace("cr-token-", "");
  const lastDash = raw.lastIndexOf("-");
  return lastDash !== -1 ? raw.substring(0, lastDash) : raw;
}

export function requireAuth(readDatabaseFn: () => any) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Acesso não autorizado. Faça login novamente." });
    }

    const userId = parseUserIdFromToken(authHeader);
    if (!userId) {
      return res.status(401).json({ error: "Token de autenticação inválido." });
    }

    const db = readDatabaseFn();
    const user = db.users?.find((u: any) => u.id === userId);
    if (!user || user.active === false) {
      return res.status(401).json({ error: "Sessão inválida ou usuário inativo." });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    };

    next();
  };
}
