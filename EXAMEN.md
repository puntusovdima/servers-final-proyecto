# EXAMEN — Reto F8: Swagger, modelo DeliveryNote y discriminatedUnion

## Preguntas socráticas

### 1. `populate('workers')` — qué ocurre y qué campos exponer

Cuando se llama a `populate('workers')` en el listado de albaranes, Mongoose sustituye cada ObjectId del array `workers` por el documento completo del modelo `User` referenciado. Sin restricción, esto expone campos sensibles como `password` (aunque esté hasheado), `refreshToken`, `verificationCode` y `verificationAttempts`.

Para filtrar solo los campos seguros se usa el segundo argumento de `populate`:

```js
.populate('workers', 'name lastName email role')
```

Así solo se exponen `name`, `lastName`, `email` y `role` — suficiente para identificar al trabajador en el albarán sin comprometer su seguridad. Los campos `password`, `refreshToken` y `verificationCode` nunca deben salir de la capa de persistencia.

---

### 2. `.refine()` vs `z.discriminatedUnion` — mensajes de error

Con `.refine()` (implementación anterior), al enviar `{ format: 'material' }` sin el campo `material`, el error generado es un único mensaje genérico asociado al path `format`:

```
"Material is required for material format, and Hours is required for hours format"
```

No indica qué campo concreto falta ni en qué path del objeto.

Con `z.discriminatedUnion('format', [...])`, Zod selecciona el sub-schema `materialNoteSchema` en función del valor del discriminador `format: 'material'`, y luego valida ese schema en profundidad. El error resultante es específico del campo:

```
"material: Material is required for material format"
```

El consumidor de la API sabe exactamente qué campo corregir. Esto es especialmente valioso en integraciones donde el cliente procesa errores programáticamente o muestra mensajes de validación al usuario final.

---

### 3. Índices compuestos para el listado de albaranes

La query de listado siempre filtra por `company` y opcionalmente por `project`, `client`, `signed` o rangos de `workDate`. El índice más útil es:

```js
deliveryNoteSchema.index({ company: 1, workDate: -1 });
deliveryNoteSchema.index({ company: 1, project: 1, workDate: -1 });
```

El orden importa porque MongoDB solo puede aprovechar un índice compuesto si la query incluye un prefijo continuo de sus campos de izquierda a derecha. Como **todas** las queries incluyen `company`, debe ir primero; de lo contrario el índice no se usaría en queries sin `project`. `workDate` va al final porque se usa para ordenar (`.sort()`), no como filtro de igualdad, y un índice que cubre el sort evita un paso extra de ordenación en memoria (`SORT` en el plan de ejecución). Añadir `project` como segundo campo cubre el caso de uso más frecuente (listado por proyecto) con un solo índice.

---

### 4. Documentar 400 (Zod) y 409 (regla de negocio) con Swagger

Ambos errores comparten la misma forma de respuesta: `{ status: 'error', message: '...' }`, por lo que **no necesitan schemas separados**. La diferencia está en el contenido del mensaje, no en la estructura. La estrategia correcta es usar el schema `Error` compartido (ya definido en `components/schemas`) para ambos códigos HTTP, pero añadir `examples` distintos en cada respuesta para comunicar la semántica al desarrollador:

```yaml
responses:
  400:
    description: Validation error (Zod)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
        examples:
          missingField:
            value: { status: 'error', message: 'material: Material is required for material format' }
  409:
    description: Business rule conflict
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
        examples:
          duplicateCif:
            value: { status: 'error', message: 'A client with this CIF already exists in your company' }
```

Schemas separados solo tendrían sentido si la forma del cuerpo fuera distinta (por ejemplo, si el 400 incluyera un array de errores de validación mientras el 409 devolviera solo un string).

---

### 5. Token JWT válido pero usuario borrado — qué ocurre

El middleware actual (`src/middleware/auth.middleware.js`) maneja correctamente ambos casos:

1. **Usuario completamente eliminado de la BD** (`User.findById()` devuelve `null`): se devuelve **401** con mensaje "The user belonging to this token no longer exists." Correcto — el token es técnicamente válido (firma OK, no expirado) pero la identidad ya no existe, por lo que no se puede autenticar.

2. **Usuario con soft-delete** (`currentUser.deleted === true`): se devuelve **403** con mensaje "This account has been deactivated." Correcto — el usuario existe pero su cuenta está desactivada, lo cual es una prohibición de acceso, no una falta de autenticación.

La distinción 401 vs 403 es semánticamente correcta: 401 = "no sé quién eres", 403 = "sé quién eres pero no tienes permiso". El único riesgo potencial es de rendimiento: cada request autenticada hace una query a MongoDB para buscar el usuario. Para mitigarlo se podría añadir un campo `iat` (issued-at) al payload del JWT y compararlo con el `updatedAt` del usuario, aunque eso añade complejidad que el proyecto actual no requiere.

---

## Proceso — Cambios realizados y uso de IA

### Cambios técnicos

**1. Campo `workers` en el modelo DeliveryNote** (`src/models/DeliveryNote.js`):
Se añadió el campo `workers: [{ type: Schema.Types.ObjectId, ref: 'User' }]` entre los campos `hours` y `description`. Mongoose lo maneja como un array de referencias — vacío por defecto, no requerido.

**2. Refactorización del validator** (`src/validators/deliveryNote.validator.js`):
Se reemplazó `baseDeliveryNoteSchema.refine(...)` por `z.discriminatedUnion('format', [materialNoteSchema, hoursNoteSchema])`. Cada sub-schema usa `z.literal('material')` / `z.literal('hours')` como discriminador, lo que permite a Zod seleccionar el schema correcto y producir errores de campo precisos. Se añadió `workers` como campo opcional en ambos sub-schemas.

**3. Anotaciones @swagger** (12 endpoints en 3 ficheros de routes):
- `src/routes/user.routes.js`: register, login, refresh, GET /, PUT /validation, DELETE /
- `src/routes/client.routes.js`: POST /, GET /, GET /archived, GET /:id, DELETE /:id
- `src/routes/deliveryNote.routes.js`: POST /, GET /, GET /:id, PATCH /:id/sign, GET /pdf/:id

Todos los endpoints usan `$ref` para los schemas definidos en `components/schemas`. Se añadieron schemas nuevos a `src/config/swagger.js`: `User`, `AuthResponse`, `ValidationError`, `ConflictError`. El schema `DeliveryNote` se actualizó para incluir `workers`.

**4. Test de validación** (`tests/deliveryNote.validator.test.js`):
Cuatro tests que verifican el comportamiento del discriminatedUnion: `format:material` sin `material` → 400, `format:material` con `material` → 201, `format:hours` sin `hours` → 400, `format:hours` con `workers` → 201.

### Uso de IA (Claude Code)

Claude Code generó las anotaciones @swagger a partir de la estructura de routes, controllers y schemas existentes. Se revisó cada anotación para verificar:
- Que los `$ref` apuntan a schemas reales definidos en `components/schemas`
- Que los `parameters` (path y query) coinciden con lo que el controller realmente lee de `req.params` y `req.query`
- Que los códigos de respuesta (400, 401, 404, 409) coinciden con los `AppError` lanzados en el controller
- Que el requestBody del endpoint PATCH /:id/sign usa `multipart/form-data` correctamente

El validator con `z.discriminatedUnion` fue generado por IA y revisado manualmente para comprobar que los campos comunes (`project`, `client`, `description`, `workDate`) están en ambos sub-schemas y que `workers` es opcional en los dos. El schema `materialNoteSchema` no requiere `workers` porque los albaranes de material no asignan trabajadores.
