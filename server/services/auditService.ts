export interface AuditPayload {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  entityCode?: string;
  description: string;
  details?: Record<string, any>;
  previousState?: any;
  newState?: any;
}

export function createAuditLog(db: any, payload: AuditPayload): any {
  if (!db.auditLogs) {
    db.auditLogs = [];
  }

  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId: payload.userId || 'system',
    userName: payload.userName || 'Sistema',
    userRole: payload.userRole || 'system',
    action: payload.action,
    entity: payload.entity,
    entityId: payload.entityId || null,
    entityCode: payload.entityCode || null,
    description: payload.description,
    details: payload.details || {},
    previousState: payload.previousState || null,
    newState: payload.newState || null,
  };

  db.auditLogs.unshift(logEntry);

  // Mantém retenção histórica segura sem perdas críticas
  if (db.auditLogs.length > 5000) {
    db.auditLogs = db.auditLogs.slice(0, 5000);
  }

  return logEntry;
}
