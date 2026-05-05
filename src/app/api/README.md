# API Modules

This app uses one dynamic Next.js route folder for all sidebar module APIs:

- `src/app/api/[module]/route.js`
- `src/app/api/[module]/[id]/route.js`
- `src/app/api/[module]/import/route.js`
- `src/app/api/[module]/export/route.js`
- `src/app/api/[module]/pdf/route.js`

Supported module names:

- `customers`
- `workers`
- `vehicles`
- `invoices`
- `quotations`
- `tows`
- `notifications`

CRUD endpoints:

- `GET /api/{module}`
- `POST /api/{module}`
- `GET /api/{module}/{id}`
- `PUT /api/{module}/{id}`
- `DELETE /api/{module}/{id}`

File endpoints:

- `POST /api/{module}/import`
- `GET /api/{module}/export`
- `GET /api/{module}/pdf`

Storage is MongoDB through `src/lib/mongodb.js` and `src/lib/store.js`.
