# iMovies — REST API & System Architecture Documentation

The **iMovies API** provides a RESTful interface for movie discovery, multi-city theatre listings, showtime scheduling, atomic seat reservation locking, and payment workflows.

- **Base URL:** `/api/v1`
- **Authentication:** Bearer JWT in `Authorization` header (`Authorization: Bearer <token>`)
- **Default Port:** `5000`

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a new customer (`name`, `email`, `password`, `phone`, `city`). Returns token and user. |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user with `email` and `password`. Returns signed JWT. |
| `POST` | `/api/v1/auth/logout` | Private | Clears session. |
| `GET` | `/api/v1/auth/me` | Private | Returns authenticated user's current profile. |
| `PATCH` | `/api/v1/auth/profile` | Private | Update name, phone, or preferred city. |
| `PATCH` | `/api/v1/auth/password` | Private | Change password with verification of old password. |

### Sample Login Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "67be391...",
    "name": "Bhanu Sharma",
    "email": "user@imovies.com",
    "role": "user",
    "city": "Mumbai"
  },
  "message": "Logged in successfully."
}
```

---

## 2. Movies Endpoints (`/api/v1/movies`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/movies` | Public | List movies with pagination, search, status (`now_showing`, `upcoming`), genre, language, formats, sorting. |
| `GET` | `/api/v1/movies/:id` | Public | Movie details, cast, crew, synopsis, and cities where currently showing. |
| `GET` | `/api/v1/movies/meta/filters` | Public | Distinct genres, languages, certifications, and formats for filter bars. |
| `POST` | `/api/v1/movies` | Admin | Create movie entry. |
| `PATCH` | `/api/v1/movies/:id` | Admin | Update movie entry. |
| `DELETE` | `/api/v1/movies/:id` | Admin | Safe deletion (archives status to `ended` if active bookings exist). |

---

## 3. Theatres & Screens (`/api/v1/theatres`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/theatres` | Public | List theatres, filterable by `city`. |
| `GET` | `/api/v1/theatres/meta/cities` | Public | Distinct cities where theatres operate. |
| `GET` | `/api/v1/theatres/:id` | Public | Theatre details and list of active screens. |
| `POST` | `/api/v1/theatres` | Admin | Add new theatre location. |
| `PATCH` | `/api/v1/theatres/:id` | Admin | Update theatre details. |
| `DELETE` | `/api/v1/theatres/:id` | Admin | Deactivate/remove theatre. |
| `GET` | `/api/v1/theatres/:id/screens` | Public | List screens and layouts for a theatre. |
| `POST` | `/api/v1/theatres/:id/screens` | Admin | Create screen with row & seat configurations. |

---

## 4. Showtimes & Real-time Seats (`/api/v1/shows`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/shows` | Public | Filter shows by `movie`, `theatre`, `city`, `date`, `format`. |
| `GET` | `/api/v1/shows/:id` | Public | Full show details, movie, theatre, and screen. |
| `GET` | `/api/v1/shows/:id/seats` | Public/User | Screen seat layout with calculated status: `available`, `held`, `booked`, `selected_by_me`. |
| `POST` | `/api/v1/shows` | Admin | Schedule showtime with screen collision detection. |
| `PATCH` | `/api/v1/shows/:id` | Admin | Update showtime. |
| `DELETE` | `/api/v1/shows/:id` | Admin | Delete / cancel show. |

---

## 5. Seat Holds & Bookings (`/api/v1/bookings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/shows/:id/holds` | Private | Atomically locks requested seats for 5 minutes. Broadcasts `seats:held` on Socket.IO. |
| `DELETE` | `/api/v1/shows/:id/holds/:token` | Private | Releases seat hold manually. Broadcasts `seats:released`. |
| `POST` | `/api/v1/bookings` | Private | Creates pending booking order from active hold session. Validates server prices. |
| `GET` | `/api/v1/bookings/my` | Private | Current user's booking history with pagination. |
| `GET` | `/api/v1/bookings/:id` | Private | Get single booking details or ticket pass by ID or Booking Reference. |
| `POST` | `/api/v1/bookings/:id/cancel` | Private | Cancel eligible booking (&gt; 2 hrs before showtime), calculate 85% refund, release seats. |

---

## 6. Payments (`/api/v1/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/order` | Private | Creates payment order in Razorpay (or deterministic Mock order). |
| `POST` | `/api/v1/payments/verify` | Private | Verifies cryptographic HMAC signature (or mock signature), finalizes ticket booking atomically, emits `seats:booked`. |
| `POST` | `/api/v1/payments/webhook` | Public | Idempotent webhook listener for asynchronous capture. |

---

## 7. Administrative Portal (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/stats` | Admin | Live metrics: Gross revenue, occupancy rate, total tickets sold, users, movies, upcoming shows. |
| `GET` | `/api/v1/admin/bookings` | Admin | Search & filter customer bookings by reference or status. |
| `GET` | `/api/v1/admin/users` | Admin | Registered user accounts management. |
| `PATCH` | `/api/v1/admin/users/:id/status` | Admin | Suspend or activate user account. |

---

## 8. Real-Time Socket.IO Protocol

Clients connect to the Socket.IO server at root port:
- Event `join:show`: `socket.emit('join:show', showId)` — Subscribes to real-time seat room for this show.
- Event `leave:show`: `socket.emit('leave:show', showId)` — Unsubscribes from room.
- Broadcast Event `seats:held`: `{ showId, seats, userId, expiresAt }`
- Broadcast Event `seats:released`: `{ showId, seats }`
- Broadcast Event `seats:booked`: `{ showId, seats }`
