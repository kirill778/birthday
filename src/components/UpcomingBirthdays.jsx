import { useBirthday } from '../context/BirthdayContext';
import { format, parseISO } from 'date-fns';
import { FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';

const UpcomingBirthdays = () => {
  const { getUpcomingBirthdays } = useBirthday();
  const upcomingBirthdays = getUpcomingBirthdays();
  
  // For debugging
  console.log('Upcoming birthdays:', upcomingBirthdays.map(p => ({
    name: p.name, 
    date: format(parseISO(p.birthdate), 'MM/dd'),
    daysUntil: p.daysUntil
  })));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-lg shadow-md p-6 border-t-4 border-warning-500"
    >
      <div className="flex items-center mb-4">
        <FaBell className="text-warning-500 mr-2 text-xl" />
        <h2 className="text-xl font-semibold text-gray-800">Ближайшие дни рождения</h2>
      </div>
      
      {upcomingBirthdays.length === 0 ? (
        <p className="text-gray-600">Нет дней рождения в ближайшие 3 дня.</p>
      ) : (
        <ul className="space-y-3">
          {upcomingBirthdays.map(person => {
            const birthdateObj = parseISO(person.birthdate);
            const day = birthdateObj.getDate();
            const monthIndex = birthdateObj.getMonth();
            
            // Array of month names in Russian
            const monthNames = [
              'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 
              'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
            ];
            
            const formattedDate = `${day} ${monthNames[monthIndex]}`;
            
            return (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-md border-l-4 ${
                  person.daysUntil === 0 
                    ? 'border-success-500 bg-success-50' 
                    : 'border-warning-500 bg-warning-50'
                }`}
              >
                <div className="font-medium">{person.name}</div>
                <div className="text-sm flex justify-between">
                  <span className="text-gray-600">{formattedDate}</span>
                  <span className={`font-medium ${
                    person.daysUntil === 0 
                      ? 'text-success-600' 
                      : 'text-warning-600'
                  }`}>
                    {person.daysUntil === 0 
                      ? 'Сегодня! 🎉' 
                      : `Через ${person.daysUntil} ${getDayText(person.daysUntil)}`
                    }
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
};

// Helper function to get correct day form in Russian
const getDayText = (days) => {
  if (days >= 11 && days <= 19) return 'дней';
  
  const lastDigit = days % 10;
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
};

export default UpcomingBirthdays;