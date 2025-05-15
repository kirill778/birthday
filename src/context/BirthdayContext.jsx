import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { differenceInDays, isToday, isSameMonth, parseISO, format, addYears, getMonth, getDate } from 'date-fns';

const BirthdayContext = createContext();

export const useBirthday = () => useContext(BirthdayContext);

export const BirthdayProvider = ({ children }) => {
  const [people, setPeople] = useState(() => {
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
    
    const savedPeople = localStorage.getItem('birthdayPeople');
    return savedPeople ? JSON.parse(savedPeople) : initialPeople;
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // Save to localStorage whenever people changes
  useEffect(() => {
    localStorage.setItem('birthdayPeople', JSON.stringify(people));
  }, [people]);

  // Add a new person with birthday
  const addPerson = (person) => {
    setPeople(prevPeople => {
      const newPeople = [...prevPeople, { ...person, id: Date.now().toString() }];
      return sortByUpcomingBirthdays(newPeople);
    });
  };

  // Edit an existing person
  const editPerson = (id, updatedPerson) => {
    setPeople(prevPeople => {
      const newPeople = prevPeople.map(person => 
        person.id === id ? { ...person, ...updatedPerson } : person
      );
      return sortByUpcomingBirthdays(newPeople);
    });
  };

  // Delete a person
  const deletePerson = (id) => {
    setPeople(prevPeople => prevPeople.filter(person => person.id !== id));
  };

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
    getBirthdayNotifications
  };

  return (
    <BirthdayContext.Provider value={value}>
      {children}
    </BirthdayContext.Provider>
  );
};