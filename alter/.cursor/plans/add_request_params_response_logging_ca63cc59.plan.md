---
name: Add Request Params Response Logging
overview: Extend the access log middleware to record request parameters (query, body) and response payloads for all API requests, with redaction of sensitive fields.
todos: []
isProject: false
---

# Add Request Params and Response to Access Logs

## Goal

Enhance [accessLog.js](e:\aiapp\alter\chat-server\middleware\accessLog.js) so each access log includes:

- Request: `query`, `body` (or path params where applicable)
- Response: JSON body sent to the client

## Sensitive Data

Redact from logs to avoid leaking credentials:

- `password`, `pass`, `token`, `authorization`, `access_token`, `refresh_token`
- Strip or mask these keys before logging

## Approach

### 1. Capture request params in middleware

In [accessLog.js](e:\aiapp\alter\chat-server\middleware\accessLog.js):

- `query`: `req.query` (GET params)
- `body`: sanitize `req.body` and drop sensitive keys

### 2. Capture response body

Intercept `res.json()` by wrapping it before the route handler runs. Save the payload to `res._logPayload` and read it in the `finish` handler.

### 3. Sanitize helper

Create `redactSensitive(obj)` that:

- Recursively removes or masks keys: `password`, `pass`, `token`, `authorization`, `access_token`, `refresh_token`
- Returns a safe copy for logging (mask as `"***"` if value exists, or omit)

## Files to Edit


| File                                                                          | Change                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [middleware/accessLog.js](e:\aiapp\alter\chat-server\middleware\accessLog.js) | Add request params capture, response body capture via `res.json` override, and sanitization |


## Implementation Sketch

```javascript
// Sensitive keys to redact
const SENSITIVE_KEYS = ['password', 'pass', 'token', 'authorization', 'access_token', 'refresh_token'];

function redactSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some(s => lower.includes(s))) out[key] = '***';
    else if (typeof out[key] === 'object') out[key] = redactSensitive(out[key]);
  }
  return out;
}

// In accessLogMiddleware:
// 1. Capture query + body (redacted)
const requestParams = { query: req.query, body: redactSensitive(req.body) };

// 2. Wrap res.json
const origJson = res.json.bind(res);
res.json = function (payload) {
  res._logPayload = redactSensitive(payload);
  return origJson(payload);
};

// 3. In res.on('finish'):
logAccess({
  requestId, userId, ip, method, path, latency, status,
  requestParams,
  response: res._logPayload,
});
```

## Notes

- Place accessLogMiddleware after `express.json()` so `req.body` is parsed
- For empty body/query, log `{}` or omit to keep logs clean
- Response capture only works for routes using `res.json()`; `res.send()` would need similar handling if used

