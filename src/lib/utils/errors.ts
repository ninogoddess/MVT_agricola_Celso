export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(public fields: { field: string; message: string }[]) {
    super('Error de validación', 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class TenantAccessError extends AppError {
  constructor() {
    super('Acceso denegado al recurso', 403, 'TENANT_ACCESS_DENIED');
    this.name = 'TenantAccessError';
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
    this.name = 'ResourceNotFoundError';
  }
}

export class CropParametersNotFoundError extends AppError {
  constructor() {
    super(
      'No hay parámetros agronómicos para esta especie/variedad',
      422,
      'CROP_PARAMETERS_NOT_FOUND'
    );
    this.name = 'CropParametersNotFoundError';
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ValidationError) {
    return {
      body: { error: error.message, code: error.code, fields: error.fields },
      status: error.statusCode,
    };
  }
  if (error instanceof AppError) {
    return {
      body: { error: error.message, code: error.code },
      status: error.statusCode,
    };
  }
  console.error('[UNHANDLED]', error);
  return {
    body: { error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
    status: 500,
  };
}
