import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { differenceInDays, isToday, isSameMonth, parseISO, format, addYears, getMonth, getDate } from 'date-fns';
import { STORAGE_KEY, saveData, loadData, initStorageSync, initStorageListener } from '../utils/storage';
import { 
  saveDataToServer, 
  fetchDataFromServer, 
  startPeriodicSync, 
  checkSyncStatus 
} from '../utils/syncService';

const BirthdayContext = createContext();

export const useBirthday = () => useContext(BirthdayContext);

export const BirthdayProvider = ({ children }) => {
  // Используем useRef для отслеживания синхронизации
  const syncChannel = useRef(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);
  const stopSyncRef = useRef(null);
  const [serverSyncActive, setServerSyncActive] = useState(false);
  
  const [people, setPeople] = useState(() => {
    try {
      // Initial data with all birthdays
      const initialPeople = [
        { id: '1', name: 'Багина Ирина Сергеевна', birthdate: '2000-05-07' },
        { id: '2', name: 'Бухарин Игнатий Леонидович', birthdate: '2000-06-18' },
        { id: '3', name: 'Воронов Кирилл Сергеевич', birthdate: '2000-01-13' },
        { id: '4', name: 'Герасимов Алексей Юрьевич', birthdate: '2000-01-15' },
        { id: '5', name: 'Графов Максим Сергеевич', birthdate: '2000-04-06' },
        { id: '6', name: 'Давыдова Нина Викторовна', birthdate: '2000-09-23' },
        { id: '7', name: 'Забоев Дмитрий Васильевич', birthdate: '2000-12-08' },
        { id: '8', name: 'Загваздин Александр Владимирович', birthdate: '2000-09-30' },
        { id: '9', name: 'Зуров Сергей Александрович', birthdate: '2000-11-03' },
        { id: '10', name: 'Иванов Андрей Владимирович', birthdate: '2000-02-19' },
        { id: '11', name: 'Коваленко Денис Евгеньевич', birthdate: '2000-01-12' },
        { id: '12', name: 'Ковальчук Валентин Васильевич', birthdate: '2000-12-03' },
        { id: '13', name: 'Кудинов Алексей Вячеславович', birthdate: '2000-04-28' },
        { id: '14', name: 'Курдяцев Евгений Александрович', birthdate: '2000-01-04' },
        { id: '15', name: 'Лушников Александр Сергеевич', birthdate: '2000-01-22' },
        { id: '16', name: 'Михайлов Михаил Владимирович', birthdate: '2000-12-23' },
        { id: '17', name: 'Михайлова Анна Александровна', birthdate: '2000-09-18' },
        { id: '18', name: 'Моисеев Александр Сергеевич', birthdate: '2000-06-24' },
        { id: '19', name: 'Назарова Евгения Вячеславовна', birthdate: '2000-01-08' },
        { id: '20', name: 'Николаев Михаил Николаевич', birthdate: '2000-10-24' },
        { id: '21', name: 'Новосельцев Дмитрий Павлович', birthdate: '2000-12-03' },
        { id: '22', name: 'Романов Кирилл Александрович', birthdate: '2000-12-05' },
        { id: '23', name: 'Светачева Наталья Викторовна', birthdate: '2000-12-14' },
        { id: '24', name: 'Синеокая Валерия Андреевна', birthdate: '2000-04-22' },
        { id: '25', name: 'Соловьев Игорь Владимирович', birthdate: '2000-03-03' },
        { id: '26', name: 'Сурагин Илья Анатольевич', birthdate: '2000-09-29' },
        { id: '27', name: 'Тоноян Артур Арсенович', birthdate: '2000-05-14' },
        { id: '28', name: 'Торопов Евгений Владимирович', birthdate: '2000-06-01' },
        { id: '29', name: 'Фахрутдинова Заира Сраждиновна', birthdate: '2000-08-26' },
        { id: '30', name: 'Филистов-Заборовский Максим Валерьевич', birthdate: '2000-09-17' },
        { id: '31', name: 'Черкалина Екатерина Николаевна', birthdate: '2000-11-18' },
        { id: '32', name: 'Шеханов Дмитрий Игоревич', birthdate: '2000-11-01' },
        { id: '33', name: 'Щетинин Ярослав Алексеевич', birthdate: '2000-06-06' },
        { id: '34', name: 'Яременко Алексей Васильевич', birthdate: '2000-03-30' }
      ];
      
      // Загружаем данные из локального хранилища
      const savedPeople = loadData();
      console.log('Loading data:', savedPeople ? 'Data found locally' : 'Using initial data');
      
      // Возвращаем данные из хранилища или исходные данные
      return savedPeople || initialPeople;
    } catch (error) {
      console.error('Error loading data:', error);
      return [];
    }
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // Проверка статуса сервера синхронизации и инициализация
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const status = await checkSyncStatus();
        console.log('Server sync status check:', status);
        
        setServerSyncActive(status.active);
        
        // Если сервер активен, начинаем синхронизацию
        if (status.active) {
          if (stopSyncRef.current) {
            stopSyncRef.current(); // Останавливаем предыдущую синхронизацию
          }
          
          // Запускаем периодическую синхронизацию
          stopSyncRef.current = startPeriodicSync((data) => {
            console.log('Received updated data from server:', data.length);
            setPeople(sortByUpcomingBirthdays(data));
          });
          
          // Отправляем текущие данные на сервер
          const result = await saveDataToServer(people);
          console.log('Initial data save result:', result);
        }
      } catch (error) {
        console.error('Error checking server status:', error);
        setServerSyncActive(false);
      }
    };
    
    // Проверяем статус сервера
    checkServerStatus();
    
    return () => {
      // Остановка синхронизации при размонтировании
      if (stopSyncRef.current) {
        stopSyncRef.current();
      }
    };
  }, []);

  // Инициализация синхронизации между вкладками/доменами
  useEffect(() => {
    // Инициализируем канал синхронизации для локального хранилища
    syncChannel.current = initStorageSync();
    
    // Устанавливаем слушатель изменений хранилища
    const unsubscribe = initStorageListener(() => {
      try {
        // Загружаем актуальные данные
        const updatedData = loadData();
        if (updatedData) {
          console.log('Reloading data from storage after change event');
          setPeople(prev => {
            // Проверяем, действительно ли данные изменились
            if (JSON.stringify(prev) !== JSON.stringify(updatedData)) {
              return sortByUpcomingBirthdays(updatedData);
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error during data reload:', error);
      }
    });
    
    // Функция для синхронизации при фокусе на окне
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking for updates');
        
        // Проверяем сервер при возвращении на вкладку
        if (serverSyncActive) {
          fetchDataFromServer().then(result => {
            if (result.updated) {
              console.log('Received updated data on visibility change:', result.data.length);
              setPeople(sortByUpcomingBirthdays(result.data));
            }
          }).catch(error => {
            console.error('Error fetching data on visibility change:', error);
          });
        } else {
          // Для локальной синхронизации
          const updatedData = loadData();
          if (updatedData) {
            setPeople(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(updatedData)) {
                return sortByUpcomingBirthdays(updatedData);
              }
              return prev;
            });
          }
        }
      }
    };
    
    // Слушаем изменения видимости страницы
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      // Очищаем ресурсы при размонтировании
      if (syncChannel.current) {
        syncChannel.current.close();
      }
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [serverSyncActive]);

  // Сохраняем в хранилище при изменении данных
  useEffect(() => {
    // Предотвращаем сохранение при первом рендере и циклическое сохранение
    if (isInitialized.current && !isSaving.current) {
      try {
        isSaving.current = true;
        console.log('Saving data, item count:', people.length);
        
        // Сохранение локально
        saveData(people);
        
        // Сохранение на сервере, если он активен
        if (serverSyncActive) {
          saveDataToServer(people)
            .then(result => {
              console.log('Server save result:', result);
            })
            .catch(error => {
              console.error('Error saving to server:', error);
            });
        }
        
        // Сбрасываем флаг после завершения сохранения
        setTimeout(() => {
          isSaving.current = false;
        }, 100);
      } catch (error) {
        console.error('Error saving data:', error);
        isSaving.current = false;
      }
    } else {
      isInitialized.current = true;
    }
  }, [people, serverSyncActive]);

  // Функция для принудительного сохранения текущего состояния
  const forceSave = useCallback(() => {
    try {
      console.log('Forced save, item count:', people.length);
      
      // Сохранение локально
      saveData(people);
      
      // Сохранение на сервере, если он активен
      if (serverSyncActive) {
        saveDataToServer(people)
          .then(result => {
            console.log('Forced server save result:', result);
          })
          .catch(error => {
            console.error('Error during forced server save:', error);
          });
      }
      
      return true;
    } catch (error) {
      console.error('Error force saving:', error);
      return false;
    }
  }, [people, serverSyncActive]);

  // Сохраняем данные при закрытии окна/вкладки
  useEffect(() => {
    const handleBeforeUnload = () => {
      forceSave();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [forceSave]);

  // Add a new person with birthday
  const addPerson = useCallback((person) => {
    setPeople(prevPeople => {
      const newPerson = { 
        ...person, 
        id: Date.now().toString() 
      };
      
      // Сначала создаем новый массив
      const newPeople = [...prevPeople, newPerson];
      const sortedPeople = sortByUpcomingBirthdays(newPeople);
      
      // Принудительно сохраняем после добавления
      isSaving.current = true;
      setTimeout(() => {
        // Сохранение локально
        saveData(sortedPeople);
        
        // Сохранение на сервере, если он активен
        if (serverSyncActive) {
          saveDataToServer(sortedPeople)
            .then(result => {
              console.log('Server save result after adding person:', result);
            })
            .catch(error => {
              console.error('Error saving to server after adding person:', error);
            });
        }
        
        console.log('Saved after adding new person');
        
        // Сбрасываем флаг после сохранения
        setTimeout(() => {
          isSaving.current = false;
        }, 100);
      }, 0);
      
      return sortedPeople;
    });
  }, [serverSyncActive]);

  // Edit an existing person
  const editPerson = useCallback((id, updatedPerson) => {
    setPeople(prevPeople => {
      const newPeople = prevPeople.map(person => 
        person.id === id ? { ...person, ...updatedPerson } : person
      );
      
      const sortedPeople = sortByUpcomingBirthdays(newPeople);
      
      // Сохраняем после редактирования
      isSaving.current = true;
      setTimeout(() => {
        // Сохранение локально
        saveData(sortedPeople);
        
        // Сохранение на сервере, если он активен
        if (serverSyncActive) {
          saveDataToServer(sortedPeople)
            .then(result => {
              console.log('Server save result after editing:', result);
            })
            .catch(error => {
              console.error('Error saving to server after editing:', error);
            });
        }
        
        console.log('Saved after editing person');
        
        // Сбрасываем флаг после сохранения
        setTimeout(() => {
          isSaving.current = false;
        }, 100);
      }, 0);
      
      return sortedPeople;
    });
  }, [serverSyncActive]);

  // Delete a person
  const deletePerson = useCallback((id) => {
    setPeople(prevPeople => {
      const newPeople = prevPeople.filter(person => person.id !== id);
      
      // Сохраняем после удаления
      isSaving.current = true;
      setTimeout(() => {
        // Сохранение локально
        saveData(newPeople);
        
        // Сохранение на сервере, если он активен
        if (serverSyncActive) {
          saveDataToServer(newPeople)
            .then(result => {
              console.log('Server save result after deletion:', result);
            })
            .catch(error => {
              console.error('Error saving to server after deletion:', error);
            });
        }
        
        console.log('Saved after deleting person');
        
        // Сбрасываем флаг после сохранения
        setTimeout(() => {
          isSaving.current = false;
        }, 100);
      }, 0);
      
      return newPeople;
    });
  }, [serverSyncActive]);

  // Get days until next birthday for a person
  const getDaysUntilBirthday = useCallback((birthdate) => {
    const today = new Date();
    const birthdateObj = parseISO(birthdate);
    
    // Set birthday for this year
    const birthdayThisYear = new Date(
      today.getFullYear(),
      birthdateObj.getMonth(),
      birthdateObj.getDate()
    );
    
    // If birthday already passed this year, calculate for next year
    if (birthdayThisYear < today) {
      const birthdayNextYear = addYears(birthdayThisYear, 1);
      return differenceInDays(birthdayNextYear, today);
    }
    
    return differenceInDays(birthdayThisYear, today);
  }, []);

  // Sort people by upcoming birthdays
  const sortByUpcomingBirthdays = (peopleArray) => {
    return [...peopleArray].sort((a, b) => {
      const aDays = getDaysUntilBirthday(a.birthdate);
      const bDays = getDaysUntilBirthday(b.birthdate);
      return aDays - bDays;
    });
  };

  // Get people with birthdays today
  const getTodaysBirthdays = useCallback(() => {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth();
    
    return people.filter(person => {
      const birthdate = parseISO(person.birthdate);
      return birthdate.getDate() === currentDate && 
             birthdate.getMonth() === currentMonth;
    });
  }, [people]);

  // Get people with birthdays in the current month
  const getCurrentMonthBirthdays = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    return people.filter(person => {
      const birthdate = parseISO(person.birthdate);
      return birthdate.getMonth() === currentMonth;
    }).sort((a, b) => {
      const dateA = parseISO(a.birthdate);
      const dateB = parseISO(b.birthdate);
      return dateA.getDate() - dateB.getDate();
    });
  }, [people]);

  // Get people with birthdays in the next month
  const getNextMonthBirthdays = useCallback(() => {
    const today = new Date();
    const nextMonth = (today.getMonth() + 1) % 12; // Handles December to January transition
    
    return people.filter(person => {
      const birthdate = parseISO(person.birthdate);
      return birthdate.getMonth() === nextMonth;
    }).sort((a, b) => {
      const dateA = parseISO(a.birthdate);
      const dateB = parseISO(b.birthdate);
      return dateA.getDate() - dateB.getDate();
    });
  }, [people]);

  // Get people with upcoming birthdays (within 3 days)
  const getUpcomingBirthdays = useCallback(() => {
    const today = new Date();
    
    return people
      .map(person => {
        const birthdate = parseISO(person.birthdate);
        const birthdayThisYear = new Date(
          today.getFullYear(),
          birthdate.getMonth(),
          birthdate.getDate()
        );
        
        // If birthday already passed this year, calculate for next year
        if (birthdayThisYear < today) {
          const birthdayNextYear = addYears(birthdayThisYear, 1);
          const daysUntil = differenceInDays(birthdayNextYear, today);
          return { ...person, daysUntil };
        }
        
        const daysUntil = differenceInDays(birthdayThisYear, today);
        return { ...person, daysUntil };
      })
      .filter(person => person.daysUntil <= 3)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [people]);

  // Generate notifications for upcoming birthdays
  const getBirthdayNotifications = useCallback(() => {
    return getUpcomingBirthdays();
  }, [getUpcomingBirthdays]);

  // Filter people based on search term
  const getFilteredPeople = useCallback(() => {
    if (!searchTerm.trim()) return people;
    
    return people.filter(person => 
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      format(parseISO(person.birthdate), 'MMMM d').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [people, searchTerm]);

  const value = {
    people,
    addPerson,
    editPerson,
    deletePerson,
    searchTerm,
    setSearchTerm,
    getFilteredPeople,
    getTodaysBirthdays,
    getCurrentMonthBirthdays,
    getNextMonthBirthdays,
    getUpcomingBirthdays,
    getDaysUntilBirthday,
    getBirthdayNotifications,
    forceSave,
    serverSyncActive
  };

  return (
    <BirthdayContext.Provider value={value}>
      {children}
    </BirthdayContext.Provider>
  );
};