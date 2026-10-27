import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { connectDB, closeDB } from '../config/db';
import seedDatabase from '../seed';
import Show from '../models/Show';

let userToken = '';
let adminToken = '';
let sampleMovieId = '';
let sampleShowId = '';
let holdToken = '';
let createdBookingId = '';

beforeAll(async () => {
  await connectDB();
  // Ensure fresh seed
  await seedDatabase();

  // Log in as admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@imovies.com', password: 'Admin@123' });
  adminToken = adminRes.body.token;

  // Log in as demo user
  const userRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'user@imovies.com', password: 'User@123' });
  userToken = userRes.body.token;
}, 30000);

afterAll(async () => {
  await closeDB();
});

describe('1. Authentication & Role Authorization', () => {
  it('should register a new user successfully with role "user"', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test New User',
        email: `test_${Date.now()}@example.com`,
        password: 'Password@123',
        city: 'Mumbai'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('user');
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Bhanu',
        email: 'user@imovies.com',
        password: 'Password@123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@imovies.com',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow access to /api/v1/auth/me with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('user@imovies.com');
  });

  it('should block regular user from admin-only routes', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin user to access /api/v1/admin/stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalMovies).toBeGreaterThan(0);
  });
});

describe('2. Movie Discovery & Showtime Filtering', () => {
  it('should return list of movies with pagination and genres', async () => {
    const res = await request(app).get('/api/v1/movies?status=now_showing');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    sampleMovieId = res.body.data[0]._id;
  });

  it('should filter movies by search query', async () => {
    const res = await request(app).get('/api/v1/movies?search=Interstellar');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toContain('Interstellar');
  });

  it('should retrieve movie details with distinct cities', async () => {
    const res = await request(app).get(`/api/v1/movies/${sampleMovieId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBeDefined();
    expect(res.body.data.availableCities).toBeDefined();
  });

  it('should fetch shows for movie and retrieve seat layout', async () => {
    const res = await request(app).get(`/api/v1/shows?movie=${sampleMovieId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Pick a show scheduled for tomorrow or > 12 hours out to safely test eligible cancellation
    const futureShow = res.body.data.find(
      s => new Date(s.startTime).getTime() - Date.now() > 6 * 60 * 60 * 1000
    ) || res.body.data[0];

    sampleShowId = futureShow._id;

    // Get seat layout
    const seatRes = await request(app).get(`/api/v1/shows/${sampleShowId}/seats`);
    expect(seatRes.status).toBe(200);
    expect(seatRes.body.data.layout.length).toBeGreaterThan(0);
  });
});

describe('3. Seat Hold, Booking & Concurrency Integrity', () => {
  it('should successfully create a temporary seat hold', async () => {
    const res = await request(app)
      .post(`/api/v1/shows/${sampleShowId}/holds`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatNumbers: ['D3', 'D4'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.holdToken).toBeDefined();
    expect(res.body.data.seats).toEqual(['D3', 'D4']);

    holdToken = res.body.data.holdToken;
  });

  it('should prevent another user from holding the same seats (concurrency protection)', async () => {
    // Create another user
    const otherUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Concurrent User',
        email: `concurrent_${Date.now()}@example.com`,
        password: 'Password@123'
      });
    const otherToken = otherUserRes.body.token;

    // Attempt to hold D3 which is already held
    const res = await request(app)
      .post(`/api/v1/shows/${sampleShowId}/holds`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ seatNumbers: ['D3'] });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('currently held');
  });

  it('should initiate a pending booking using the valid hold', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showId: sampleShowId,
        seatNumbers: ['D3', 'D4'],
        holdToken
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingReference).toBeDefined();
    expect(res.body.data.bookingStatus).toBe('pending');
    expect(res.body.data.pricing.totalAmountPaise).toBeGreaterThan(0);

    createdBookingId = res.body.data._id;
  });
});

describe('4. Payment Order Creation & Verification', () => {
  let orderId = '';

  it('should create a payment order for the booking', async () => {
    const res = await request(app)
      .post('/api/v1/payments/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId: createdBookingId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBeDefined();

    orderId = res.body.data.orderId;
  });

  it('should verify payment and finalize booking atomically', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookingId: createdBookingId,
        orderId,
        paymentId: `pay_mock_test_${Date.now()}`,
        signature: 'mock_valid_signature'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingStatus).toBe('confirmed');
    expect(res.body.data.paymentStatus).toBe('paid');
  });

  it('should show the confirmed booking in the user\'s booking history', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some(b => b._id === createdBookingId)).toBe(true);
  });
});

describe('5. Cancellations & Refund Rules', () => {
  it('should cancel the eligible booking and calculate refund', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Plan changed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingStatus).toBe('cancelled');
    expect(res.body.data.paymentStatus).toBe('refunded');
    expect(res.body.refundAmountPaise).toBeGreaterThan(0);
  });

  it('should reject duplicate cancellation of already cancelled booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Try again' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
