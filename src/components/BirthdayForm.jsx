import { useState, useEffect } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { format } from 'date-fns';
import { FaUserPlus, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { COMMON_SYNC_KEY } from '../utils/storage';

const BirthdayForm = () => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { addPerson, forceSave, serverSyncActive } = useBirthday();
  
  const clearForm = () => {
    setName('');
    setBirthdate('');
    setNotes('');
    setErrorMessage('');
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !birthdate || isSubmitting) return;
    
    // Очищаем предыдущие ошибки
    setErrorMessage('');
    
    // Устанавливаем флаг отправки формы
    setIsSubmitting(true);
    
    const today = new Date();
    const selectedDate = new Date(birthdate);
    
    // Ensure we don't store future years for birthdays
    let adjustedBirthdate = birthdate;
    if (selectedDate > today) {
      adjustedBirthdate = format(
        new Date(
          today.getFullYear() - 1,
          selectedDate.getMonth(),
          selectedDate.getDate()
        ),
        'yyyy-MM-dd'
      );
    }
    
    try {
      // Создаем новый счетчик сохранений
      const saveId = Date.now();
      setSaveCount(saveId);
      
      // Добавляем человека
      addPerson({
        name: name.trim(),
        birthdate: adjustedBirthdate,
        notes: notes.trim()
      });
      
      // Многократное сохранение для обеспечения надежной синхронизации
      const multiSave = () => {
        // Принудительно сохраняем данные в localStorage несколько раз
        let saveAttempts = 0;
        
        const attemptSave = () => {
          if (saveAttempts >= 3) {
            console.log("Все попытки сохранения выполнены");
            
            // Чистим форму
            clearForm();
            setShowForm(false);
            
            // Сбрасываем флаг отправки
            setIsSubmitting(false);
            return;
          }
          
          saveAttempts++;
          console.log(`Попытка сохранения ${saveAttempts}/3`);
          
          // Сохраняем данные
          const success = forceSave();
          
          if (!success) {
            setErrorMessage('Ошибка при сохранении. Попробуем еще раз...');
          } else if (saveAttempts === 3) {
            setErrorMessage('');
          }
          
          // Обновляем метку времени в общем ключе синхронизации
          if (!serverSyncActive) {
            try {
              const syncDataStr = localStorage.getItem(COMMON_SYNC_KEY);
              if (syncDataStr) {
                const syncData = JSON.parse(syncDataStr);
                syncData.timestamp = Date.now(); // Обновляем метку
                localStorage.setItem(COMMON_SYNC_KEY, JSON.stringify(syncData));
                console.log("Обновлена общая метка синхронизации");
              }
            } catch (e) {
              console.error("Ошибка при обновлении общей метки:", e);
            }
          }
          
          // Планируем следующую попытку
          setTimeout(attemptSave, 500);
        };
        
        // Запускаем цепочку попыток сохранения
        attemptSave();
      };
      
      // Запускаем многократное сохранение с небольшой задержкой
      setTimeout(multiSave, 100);
      
    } catch (error) {
      console.error("Error adding person:", error);
      setIsSubmitting(false);
      setErrorMessage("Возникла ошибка при добавлении. Пожалуйста, попробуйте еще раз.");
    }
  };
  
  // Сбрасываем флаг отправки, если форма закрывается
  useEffect(() => {
    if (!showForm) {
      setIsSubmitting(false);
      clearForm();
    }
  }, [showForm]);
  
  // Эффект для отслеживания успешного сохранения
  useEffect(() => {
    if (saveCount > 0) {
      // Установка флага сохранения в localStorage для других вкладок/IP
      try {
        localStorage.setItem('birthdayPeople_lastSave', saveCount.toString());
      } catch (e) {
        console.error("Ошибка при установке флага сохранения:", e);
      }
    }
  }, [saveCount]);
  
  const formVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Добавить день рождения
        </h2>
        <button
          className={`px-4 py-2 rounded-full font-medium transition-all flex items-center ${
            showForm 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
          onClick={() => setShowForm(!showForm)}
          disabled={isSubmitting}
        >
          <FaUserPlus className="mr-2" />
          {showForm ? 'Отмена' : 'Добавить'}
        </button>
      </div>
      
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate={showForm ? "visible" : "hidden"}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1" 
                htmlFor="name"
              >
                ФИО
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите полное имя"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1" 
                htmlFor="birthdate"
              >
                Дата рождения
              </label>
              <input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1" 
              htmlFor="notes"
            >
              Заметки (необязательно)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Добавьте заметки, идеи подарков и т.д."
              rows="3"
              disabled={isSubmitting}
            />
          </div>
          
          {errorMessage && (
            <div className="text-error-500 text-sm p-2 bg-error-50 rounded-md">
              {errorMessage}
            </div>
          )}
          
          <div className="text-right">
            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
              type="submit"
              className={`px-6 py-2 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary-500 hover:bg-primary-600'
              } text-white rounded-md font-medium transition-colors flex items-center justify-center`}
              disabled={isSubmitting}
            >
              {isSubmitting && <FaSpinner className="animate-spin mr-2" />}
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </motion.button>
          </div>
          
          {serverSyncActive && (
            <div className="text-center text-xs text-gray-500 mt-2">
              Синхронизация с сервером активна
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default BirthdayForm;