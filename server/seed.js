const mongoose = require('mongoose');
const { connectDB, closeDB } = require('./config/db');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Theatre = require('./models/Theatre');
const Screen = require('./models/Screen');
const Show = require('./models/Show');
const Booking = require('./models/Booking');
const SeatHold = require('./models/SeatHold');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const { generateBookingReference, calculateBookingPricing } = require('./utils/helpers');

// Helper to generate a realistic cinema seating layout
const generateScreenLayout = (rowsCount = 8, seatsPerRow = 12) => {
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
  const rows = [];

  for (let r = 0; r < rowsCount; r++) {
    const rowLabel = rowLabels[r];
    let category = 'Gold';
    let basePricePaise = 24000; // Rs 240

    if (r < 2) {
      category = 'Silver';
      basePricePaise = 18000; // Rs 180
    } else if (r >= rowsCount - 2) {
      category = 'Platinum';
      basePricePaise = 34000; // Rs 340
    }

    const seats = [];
    for (let c = 1; c <= seatsPerRow; c++) {
      // Create aisle gap at col 4 and 9
      seats.push({
        seatNumber: `${rowLabel}${c}`,
        col: c,
        type: (r === 0 && (c === 1 || c === seatsPerRow)) ? 'wheelchair' : 'standard',
        isActive: true
      });
    }

    rows.push({
      rowLabel,
      category,
      basePricePaise,
      seats
    });
  }

  return rows;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting iMovies Seed Process...');

    // 1. Clean existing collections for repeatable clean state
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Theatre.deleteMany({});
    await Screen.deleteMany({});
    await Show.deleteMany({});
    await Booking.deleteMany({});
    await SeatHold.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    console.log('🧹 Cleaned existing database records.');

    // 2. Create Users (Pass plaintext password; User pre('save') hook handles hashing)
    const adminUser = await User.create({
      name: 'Cinema Administrator',
      email: 'admin@imovies.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210',
      city: 'Mumbai',
      status: 'active'
    });

    const demoUser = await User.create({
      name: 'Bhanu Sharma',
      email: 'user@imovies.com',
      password: 'User@123',
      role: 'user',
      phone: '+91 98111 22334',
      city: 'Mumbai',
      status: 'active'
    });

    const regularUser2 = await User.create({
      name: 'Ananya Verma',
      email: 'ananya@example.com',
      password: 'User@123',
      role: 'user',
      phone: '+91 99222 33445',
      city: 'Bengaluru',
      status: 'active'
    });

    console.log('👤 Created demo accounts (admin@imovies.com / Admin@123, user@imovies.com / User@123)');

    // 3. Create Curated Movie Dataset with high quality working poster and backdrop URLs
    const moviesData = [
      {
        title: 'Interstellar: Beyond Time',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        language: ['English', 'Hindi'],
        durationMinutes: 169,
        releaseDate: new Date('2026-10-15'),
        certification: 'UA',
        status: 'now_showing',
        rating: 8.9,
        voteCount: 2450,
        formats: ['2D', 'IMAX', '4DX'],
        director: 'Christopher Nolan',
        featured: true,
        cast: [
          { name: 'Matthew McConaughey', character: 'Cooper' },
          { name: 'Anne Hathaway', character: 'Brand' },
          { name: 'Jessica Chastain', character: 'Murph' }
        ]
      },
      {
        title: 'Shadows of Varanasi',
        description: 'An atmospheric neo-noir crime thriller set in the mystical ghats of Varanasi, where a retired detective uncovers an ancient conspiracy intertwining sacred rituals and high-stakes espionage.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1600&auto=format&fit=crop',
        genre: ['Thriller', 'Action', 'Mystery'],
        language: ['Hindi', 'Tamil', 'Telugu'],
        durationMinutes: 148,
        releaseDate: new Date('2026-10-20'),
        certification: 'UA',
        status: 'now_showing',
        rating: 8.6,
        voteCount: 1890,
        formats: ['2D', '3D', 'IMAX'],
        director: 'Anurag Kashyap',
        featured: true,
        cast: [
          { name: 'Manoj Bajpayee', character: 'Devraj Singh' },
          { name: 'Kay Kay Menon', character: 'Vishwajeet' },
          { name: 'Radhika Apte', character: 'Inspector Tara' }
        ]
      },
      {
        title: 'Cyberpunk Odyssey: Neo Tokyo',
        description: 'In the towering neon canyons of Neo Tokyo 2099, a renegade cyber-pilot and an AI android fight for freedom against a megacorporation controlling human consciousness.',
        posterUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop',
        genre: ['Sci-Fi', 'Action', 'Animation'],
        language: ['English', 'Japanese', 'Hindi'],
        durationMinutes: 132,
        releaseDate: new Date('2026-10-25'),
        certification: 'A',
        status: 'now_showing',
        rating: 8.4,
        voteCount: 940,
        formats: ['2D', '3D', 'IMAX', '4DX'],
        director: 'Shinichiro Watanabe',
        featured: true,
        cast: [
          { name: 'Ken Watanabe', character: 'Kaito' },
          { name: 'Rinko Kikuchi', character: 'Unit 7' }
        ]
      },
      {
        title: 'The Royal Monsoon',
        description: 'A heart-warming and sweeping romantic drama that bridges traditional Rajasthani royalty with modern London high-fashion amidst the spellbinding monsoon landscapes of Udaipur.',
        posterUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=1600&auto=format&fit=crop',
        genre: ['Romance', 'Drama'],
        language: ['Hindi', 'English'],
        durationMinutes: 142,
        releaseDate: new Date('2026-10-18'),
        certification: 'U',
        status: 'now_showing',
        rating: 8.1,
        voteCount: 1120,
        formats: ['2D'],
        director: 'Zoya Akhtar',
        featured: false,
        cast: [
          { name: 'Ranveer Singh', character: 'Rana Jai Singh' },
          { name: 'Alia Bhatt', character: 'Meera Kapoor' }
        ]
      },
      {
        title: 'Guardians of the Deep',
        description: 'A breathtaking underwater fantasy epic detailing an ancient civilization beneath the Indian Ocean fighting to protect their luminous coral kingdom from surface polluters.',
        posterUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=1600&auto=format&fit=crop',
        genre: ['Fantasy', 'Adventure', 'Family'],
        language: ['English', 'Hindi', 'Tamil'],
        durationMinutes: 125,
        releaseDate: new Date('2026-10-22'),
        certification: 'U',
        status: 'now_showing',
        rating: 8.3,
        voteCount: 780,
        formats: ['2D', '3D', 'IMAX'],
        director: 'James Cameron',
        featured: false,
        cast: [
          { name: 'Zoe Saldana', character: 'Marina' },
          { name: 'Sam Worthington', character: 'Dylan' }
        ]
      },
      {
        title: 'Project Genesis: Mars',
        description: 'The first crew of human astronauts to establish a permanent colony on Mars encounter an unexpected biological phenomenon beneath the Olympus Mons volcano.',
        posterUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
        genre: ['Sci-Fi', 'Thriller'],
        language: ['English', 'Hindi'],
        durationMinutes: 155,
        releaseDate: new Date('2026-11-20'),
        certification: 'UA',
        status: 'upcoming',
        rating: 0,
        voteCount: 0,
        formats: ['2D', 'IMAX'],
        director: 'Denis Villeneuve',
        featured: false,
        cast: [
          { name: 'Cillian Murphy', character: 'Dr. Aaron Ross' },
          { name: 'Florence Pugh', character: 'Commander Diaz' }
        ]
      },
      {
        title: 'Kalki: Dawn of Champions',
        description: 'Set in a post-apocalyptic future, a chosen hero must rally warriors across forgotten dimensions to safeguard the sacred flame of humanity.',
        posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
        genre: ['Action', 'Fantasy', 'Mythology'],
        language: ['Telugu', 'Hindi', 'Tamil', 'Kannada'],
        durationMinutes: 178,
        releaseDate: new Date('2026-11-28'),
        certification: 'UA',
        status: 'upcoming',
        rating: 0,
        voteCount: 0,
        formats: ['2D', '3D', 'IMAX'],
        director: 'Nag Ashwin',
        featured: false,
        cast: [
          { name: 'Prabhas', character: 'Bhairava' },
          { name: 'Amitabh Bachchan', character: 'Ashwatthama' },
          { name: 'Deepika Padukone', character: 'SUM-80' }
        ]
      }
    ];

    const movies = await Movie.insertMany(moviesData);
    console.log(`🎬 Created ${movies.length} movies.`);

    // 4. Create Theatres in Major Indian Cities
    const theatresData = [
      {
        name: 'PVR ICON: Phoenix Palladium',
        address: '462, Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400013',
        facilities: ['Dolby Atmos', '4DX', 'IMAX with Laser', 'Gourmet Menu', 'Valet Parking', 'Recliner Lounges']
      },
      {
        name: 'INOX Megaplex: Inorbit Mall',
        address: 'Link Road, Malad West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400064',
        facilities: ['Dolby Atmos', 'MX4D', 'Insignia Dining', 'Wheelchair Access', 'Parking']
      },
      {
        name: 'PVR Superplex: Mall of India',
        address: 'Sector 18, Noida',
        city: 'Delhi NCR',
        state: 'Uttar Pradesh',
        pincode: '201301',
        facilities: ['IMAX', '4DX', 'Gold Class', 'Dolby Atmos', 'Cafeteria']
      },
      {
        name: 'Cinepolis: Forum Shantiniketan',
        address: 'Whitefield Main Road, Hoodi',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560067',
        facilities: ['VIP Recliner', 'Dolby Atmos 7.1', 'RealD 3D', 'Curated Coffee Bar']
      },
      {
        name: 'AMB Cinemas: Gachibowli',
        address: 'Kothaguda, Kondapur',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500084',
        facilities: ['Laser Projection', 'Dolby Atmos', 'Super Lounges', 'Gourmet Food']
      }
    ];

    const theatres = await Theatre.insertMany(theatresData);
    console.log(`🏛️ Created ${theatres.length} theatres.`);

    // 5. Create Screens for each theatre
    const allScreens = [];
    for (const theatre of theatres) {
      // Screen 1: IMAX Audi
      const s1 = await Screen.create({
        theatre: theatre._id,
        name: 'Screen 1 — IMAX Laser',
        screenNumber: 1,
        formats: ['2D', '3D', 'IMAX'],
        soundSystem: 'Dolby Atmos 12.1 Immersive',
        rows: generateScreenLayout(8, 12)
      });
      allScreens.push(s1);

      // Screen 2: Prime Audi
      const s2 = await Screen.create({
        theatre: theatre._id,
        name: 'Screen 2 — Dolby Prime',
        screenNumber: 2,
        formats: ['2D', '3D'],
        soundSystem: 'Dolby Atmos 7.1',
        rows: generateScreenLayout(6, 10)
      });
      allScreens.push(s2);
    }
    console.log(`📺 Created ${allScreens.length} screens with realistic interactive seat layouts.`);

    // 6. Schedule Shows across Today, Tomorrow, and Day After Tomorrow
    const nowShowingMovies = movies.filter(m => m.status === 'now_showing');
    const showsToCreate = [];

    const slotHours = [
      { start: 10, end: 13, label: 'Morning' },
      { start: 14, end: 17, label: 'Matinee' },
      { start: 18, end: 21, label: 'Evening' },
      { start: 21, end: 24, label: 'Night' }
    ];

    const today = new Date();

    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + dayOffset);

      for (let sIdx = 0; sIdx < allScreens.length; sIdx++) {
        const screen = allScreens[sIdx];
        const movie = nowShowingMovies[(sIdx + dayOffset) % nowShowingMovies.length];

        for (const slot of slotHours) {
          const startTime = new Date(showDate);
          startTime.setHours(slot.start, 15, 0, 0);

          const endTime = new Date(showDate);
          endTime.setHours(slot.end, 0, 0, 0);

          // If show time is in the past, skip or offset
          if (startTime <= new Date()) {
            startTime.setHours(new Date().getHours() + 2);
            endTime.setHours(new Date().getHours() + 5);
          }

          const format = screen.formats.includes('IMAX') ? 'IMAX' : '2D';

          showsToCreate.push({
            movie: movie._id,
            theatre: screen.theatre,
            screen: screen._id,
            startTime,
            endTime,
            language: movie.language[0] || 'Hindi',
            format,
            pricing: {
              Silver: format === 'IMAX' ? 25000 : 18000,
              Gold: format === 'IMAX' ? 35000 : 24000,
              Platinum: format === 'IMAX' ? 48000 : 34000,
              VIP: format === 'IMAX' ? 65000 : 45000
            },
            status: 'open',
            totalSeats: screen.totalSeats,
            bookedSeatsCount: 0
          });
        }
      }
    }

    const createdShows = await Show.insertMany(showsToCreate);
    console.log(`⏰ Scheduled ${createdShows.length} movie showtimes across multiple dates and slots.`);

    // 7. Seed Sample Confirmed Bookings for realistic data & immediate analytics!
    if (createdShows.length > 0) {
      const sampleShow = createdShows[0];
      const sampleSeats = ['C5', 'C6'];
      const baseFare = 24000 * 2; // Rs 480.00
      const pricing = calculateBookingPricing(baseFare, 2);

      const bookingRef = generateBookingReference();

      const booking1 = await Booking.create({
        bookingReference: bookingRef,
        user: demoUser._id,
        show: sampleShow._id,
        seats: [
          { seatNumber: 'C5', row: 'C', category: 'Gold', pricePaise: 24000 },
          { seatNumber: 'C6', row: 'C', category: 'Gold', pricePaise: 24000 }
        ],
        seatNumbers: sampleSeats,
        pricing,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'mock',
        paymentTransactionReference: 'pay_mock_init_9981273',
        paymentOrderReference: 'order_mock_init_1182741'
      });

      // Update show occupancy
      await Show.findByIdAndUpdate(sampleShow._id, {
        $inc: { bookedSeatsCount: 2 }
      });

      // Record payment
      await Payment.create({
        booking: booking1._id,
        user: demoUser._id,
        provider: 'mock',
        orderId: 'order_mock_init_1182741',
        paymentId: 'pay_mock_init_9981273',
        amountPaise: pricing.totalAmountPaise,
        currency: 'INR',
        status: 'captured'
      });

      // Create notification
      await Notification.create({
        user: demoUser._id,
        type: 'booking_confirmed',
        title: 'Tickets Confirmed! 🎟️',
        message: `Your booking (${bookingRef}) for seats C5, C6 is confirmed! Enjoy your movie.`,
        relatedBooking: booking1._id
      });

      console.log(`🎫 Pre-seeded confirmed sample booking ${bookingRef} for user ${demoUser.email}`);
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    throw error;
  }
};

const runStandaloneSeed = async () => {
  try {
    await connectDB();
    await seedDatabase();
  } catch (err) {
    process.exit(1);
  } finally {
    await closeDB();
    process.exit(0);
  }
};

if (require.main === module) {
  runStandaloneSeed();
}

module.exports = seedDatabase;
