import { useState, useEffect } from 'react';
import { FaBirthdayCake, FaSearch } from 'react-icons/fa';
import { useBirthday } from '../context/BirthdayContext';
import { motion } from 'framer-motion';

const Header = () => {
  const { searchTerm, setSearchTerm } = useBirthday();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <header 
      className={`sticky top-0 z-10 transition-all duration-300 ${
        scrolled 
          ? 'bg-white shadow-md py-2' 
          : 'bg-gradient-to-r from-primary-500 to-secondary-500 py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <motion.div 
          className="flex items-center mb-4 md:mb-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaBirthdayCake className={`text-2xl mr-2 ${scrolled ? 'text-primary-500' : 'text-white'}`} />
          <h1 className={`text-2xl font-bold ${scrolled ? 'text-gray-800' : 'text-white'}`}>
            Дни рождения сотрудников
          </h1>
        </motion.div>
        
        <motion.div 
          className="w-full md:w-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск дней рождения..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;