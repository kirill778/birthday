import { useEffect, useState } from 'react';
import Header from './components/Header';
import BirthdayForm from './components/BirthdayForm';
import BirthdayList from './components/BirthdayList';
import UpcomingBirthdays from './components/UpcomingBirthdays';
import MonthlyHighlight from './components/MonthlyHighlight';
import { BirthdayProvider, useBirthday } from './context/BirthdayContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { COMMON_SYNC_KEY } from './utils/storage';

// Компонент для дополнительной синхронизации должен быть внутри контекста
const SyncHelper = () => {
  const { forceSave } = useBirthday();
  
  // При монтировании и размонтировании компонента принудительно сохраняем данные
  useEffect(() => {
    console.log('SyncHelper mounted - forcing initial sync');
    // Делаем принудительное сохранение данных через короткие промежутки времени
    const initialSync = setTimeout(() => {
      forceSave();
      console.log('Initial sync completed');
    }, 500);
    
    // Регулярная синхронизация
    const regularSync = setInterval(() => {
      forceSave();
      console.log('Regular sync completed');
    }, 5000);
    
    // Также сохраняем при изменении видимости вкладки
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        forceSave();
        console.log('Visibility sync');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearTimeout(initialSync);
      clearInterval(regularSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      
      // При размонтировании тоже сохраняем
      forceSave();
      console.log('SyncHelper unmounted - final sync');
    };
  }, [forceSave]);
  
  // Этот компонент не рендерит никакого UI
  return null;
};

// Компонент для синхронизации между разными IP адресами
const CrossIPSync = () => {
  const { forceSave } = useBirthday();
  const [lastSyncTime, setLastSyncTime] = useState(0);
  
  // Эффект для отслеживания изменений в общем ключе синхронизации
  useEffect(() => {
    // Функция проверки изменений в общем ключе синхронизации
    const checkCommonSync = () => {
      try {
        const syncDataStr = localStorage.getItem(COMMON_SYNC_KEY);
        if (syncDataStr) {
          const syncData = JSON.parse(syncDataStr);
          if (syncData.timestamp > lastSyncTime) {
            console.log('CrossIPSync: Detected changes in common sync key');
            setLastSyncTime(syncData.timestamp);
            forceSave();
          }
        }
      } catch (e) {
        console.error('CrossIPSync: Error checking common sync key', e);
      }
    };
    
    // Проверяем сразу при монтировании
    checkCommonSync();
    
    // Настраиваем интервал для регулярной проверки
    const interval = setInterval(checkCommonSync, 2000);
    
    // Слушаем изменения в localStorage
    const handleStorageChange = (e) => {
      if (e.key === COMMON_SYNC_KEY || e.key === null) {
        console.log('CrossIPSync: Common sync key changed');
        checkCommonSync();
      }
    };
    
    // Дополнительная проверка при фокусе окна
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('CrossIPSync: Visibility changed to visible');
        setTimeout(checkCommonSync, 500);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibility);
    
    // Очистка ресурсов
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [lastSyncTime, forceSave]);
  
  // Компонент без UI
  return null;
};

// Основной компонент приложения с контекстом и компонентами
const AppContent = () => {
  useEffect(() => {
    document.title = 'Дни рождения сотрудников';
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="md:flex md:gap-8">
          <div className="md:w-2/3">
            <BirthdayForm />
            <div className="mt-8">
              <BirthdayList />
            </div>
          </div>
          <div className="md:w-1/3 mb-8 md:mb-0">
            <MonthlyHighlight />
            <div className="mt-8">
              <UpcomingBirthdays />
            </div>
          </div>
        </div>
      </div>
      <SyncHelper />
      <CrossIPSync />
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

function App() {
  return (
    <BirthdayProvider>
      <AppContent />
    </BirthdayProvider>
  );
}

export default App;