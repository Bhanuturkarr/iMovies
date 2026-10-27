import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem('imovies_city') || 'Mumbai'
  );

  const [activeHold, setActiveHold] = useState(() => {
    const saved = localStorage.getItem('imovies_active_hold');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (new Date(parsed.expiresAt) > new Date()) {
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  const [currentBooking, setCurrentBooking] = useState(null);

  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem('imovies_city', selectedCity);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (activeHold) {
      localStorage.setItem('imovies_active_hold', JSON.stringify(activeHold));
    } else {
      localStorage.removeItem('imovies_active_hold');
    }
  }, [activeHold]);

  const updateCity = (city) => {
    setSelectedCity(city);
  };

  const setHold = (holdData) => {
    setActiveHold(holdData);
  };

  const clearHold = () => {
    setActiveHold(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedCity,
        updateCity,
        activeHold,
        setHold,
        clearHold,
        currentBooking,
        setCurrentBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
