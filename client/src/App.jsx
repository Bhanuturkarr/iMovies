import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Providers
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { SocketProvider } from './context/SocketContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import BrowseMovies from './pages/public/BrowseMovies';
import MovieDetails from './pages/public/MovieDetails';
import Theatres from './pages/public/Theatres';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import About from './pages/public/About';

// Booking Flow Pages
import SelectSeats from './pages/booking/SelectSeats';
import BookingSummaryPage from './pages/booking/BookingSummaryPage';
import Checkout from './pages/booking/Checkout';
import Confirmation from './pages/booking/Confirmation';

// Account Pages
import UserDashboard from './pages/account/UserDashboard';
import Profile from './pages/account/Profile';

// Admin Layout & Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import MovieManagement from './pages/admin/MovieManagement';
import TheatreManagement from './pages/admin/TheatreManagement';
import ShowManagement from './pages/admin/ShowManagement';
import BookingManagement from './pages/admin/BookingManagement';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <SocketProvider>
            <div className="d-flex flex-column min-vh-100 bg-dark text-light">
              <Navbar />

              <main className="flex-grow-1">
                <Routes>
                  {/* Public Pages */}
                  <Route path="/" element={<Home />} />
                  <Route path="/movies" element={<BrowseMovies />} />
                  <Route path="/movies/:id" element={<MovieDetails />} />
                  <Route path="/theatres" element={<Theatres />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/about" element={<About />} />

                  {/* Seat Selection & Booking Journey */}
                  <Route path="/shows/:id/seats" element={<SelectSeats />} />
                  <Route
                    path="/booking/summary"
                    element={
                      <ProtectedRoute>
                        <BookingSummaryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout/:bookingId"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/confirmation/:bookingId"
                    element={
                      <ProtectedRoute>
                        <Confirmation />
                      </ProtectedRoute>
                    }
                  />

                  {/* User Account */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Admin Portal */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="movies" element={<MovieManagement />} />
                    <Route path="theatres" element={<TheatreManagement />} />
                    <Route path="shows" element={<ShowManagement />} />
                    <Route path="bookings" element={<BookingManagement />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="reports" element={<Reports />} />
                  </Route>

                  {/* Catch-all Redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <Footer />

              <ToastContainer
                position="bottom-right"
                autoClose={3500}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </div>
          </SocketProvider>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
