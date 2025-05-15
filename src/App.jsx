import { useEffect } from 'react';
import { useBirthday } from './context/BirthdayContext';
import Header from './components/Header';
import BirthdayForm from './components/BirthdayForm';
import BirthdayList from './components/BirthdayList';
import UpcomingBirthdays from './components/UpcomingBirthdays';
import MonthlyHighlight from './components/MonthlyHighlight';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

function App() {
  const { getTodaysBirthdays, getCurrentMonthBirthdays, getNextMonthBirthdays, people } = useBirthday();
  
  
  // Effect to check for today's birthdays and show notifications
  useEffect(() => {
    // Update date information to ensure correct data display
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    console.log(`Current date: ${currentDate}, Current month: ${currentMonth + 1}, Current year: ${currentYear}`);
    
    // Check for birthdays today and show notifications
    const todaysBirthdays = getTodaysBirthdays();
    const currentMonthBdays = getCurrentMonthBirthdays();
    const nextMonthBdays = getNextMonthBirthdays();
    
    console.log(`Today's birthdays: ${todaysBirthdays.length}`);
    console.log(`Current month birthdays: ${currentMonthBdays.length}`);
    console.log(`Next month birthdays: ${nextMonthBdays.length}`);
    
    // Show toast notifications for today's birthdays
    todaysBirthdays.forEach(person => {
      toast.info(`🎂 Сегодня день рождения ${person.name}!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    });
  }, [getTodaysBirthdays, getCurrentMonthBirthdays, getNextMonthBirthdays]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2">
            <div className="mb-8">
              <BirthdayForm />
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                {people.length > 0 ? 'Все дни рождения' : 'Дни рождения не добавлены'}
              </h2>
              <BirthdayList />
            </div>
          </div>
          
          <div className="space-y-8">
            <UpcomingBirthdays />
            <MonthlyHighlight />
          </div>
        </motion.div>
      </main>
      
      <footer className="py-6 bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Приложение для дней рождения &copy; {format(new Date(), 'yyyy')}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;