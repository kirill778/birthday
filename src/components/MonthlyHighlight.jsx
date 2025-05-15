import { useBirthday } from '../context/BirthdayContext';
import { format, parseISO } from 'date-fns';
import { FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MonthlyHighlight = () => {
  const { getCurrentMonthBirthdays, getNextMonthBirthdays } = useBirthday();
  const currentMonthBirthdays = getCurrentMonthBirthdays();
  const nextMonthBirthdays = getNextMonthBirthdays();
  
  // Get current and next month names
  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const nextMonthIndex = (currentMonthIndex + 1) % 12;
  
  // Array of month names in Russian
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const currentMonth = monthNames[currentMonthIndex];
  const nextMonth = monthNames[nextMonthIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-lg shadow-md p-6 border-t-4 border-accent-500"
    >
      {/* Current Month */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <FaCalendarAlt className="text-accent-500 mr-2 text-xl" />
          <h2 className="text-xl font-semibold text-gray-800">Дни рождения в {currentMonth}</h2>
        </div>
        
        {currentMonthBirthdays.length === 0 ? (
          <p className="text-gray-600">Нет дней рождения в этом месяце.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {currentMonthBirthdays.map(person => {
              const birthdateObj = parseISO(person.birthdate);
              const day = birthdateObj.getDate();
              const isToday = day === today.getDate();
              
              return (
                <motion.li
                  key={person.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`py-3 ${isToday ? 'font-semibold' : ''}`}
                >
                  <div className="flex justify-between">
                    <span className="text-gray-800">{person.name}</span>
                    <span className={`${
                      isToday 
                        ? 'text-success-600 font-bold' 
                        : 'text-accent-600'
                    }`}>
                      {day}
                      {isToday && ' (Сегодня!)'}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
      
      {/* Next Month */}
      <div>
        <div className="flex items-center mb-4">
          <FaCalendarAlt className="text-accent-500 mr-2 text-xl" />
          <h2 className="text-xl font-semibold text-gray-800">Дни рождения в {nextMonth}</h2>
        </div>
        
        {nextMonthBirthdays.length === 0 ? (
          <p className="text-gray-600">Нет дней рождения в следующем месяце.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {nextMonthBirthdays.map(person => {
              const birthdateObj = parseISO(person.birthdate);
              const day = birthdateObj.getDate();
              
              return (
                <motion.li
                  key={person.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="py-3"
                >
                  <div className="flex justify-between">
                    <span className="text-gray-800">{person.name}</span>
                    <span className="text-accent-600">
                      {day}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export default MonthlyHighlight;