import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useBirthday } from '../context/BirthdayContext';
import { FaEdit, FaTrash, FaBirthdayCake, FaTimes, FaSave } from 'react-icons/fa';
import { motion } from 'framer-motion';

const BirthdayCard = ({ person }) => {
  const { getDaysUntilBirthday, editPerson, deletePerson } = useBirthday();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);
  const [editBirthdate, setEditBirthdate] = useState(person.birthdate);
  const [editNotes, setEditNotes] = useState(person.notes || '');
  
  const daysUntil = getDaysUntilBirthday(person.birthdate);
  const isBirthdayToday = daysUntil === 0;
  
  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить день рождения ${person.name}?`)) {
      deletePerson(person.id);
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (!editName.trim() || !editBirthdate) return;
    
    editPerson(person.id, {
      name: editName.trim(),
      birthdate: editBirthdate,
      notes: editNotes.trim()
    });
    
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditName(person.name);
    setEditBirthdate(person.birthdate);
    setEditNotes(person.notes || '');
    setIsEditing(false);
  };
  
  // Calculate age
  const birthYear = parseISO(person.birthdate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  
  // Format birthdate - use Russian month names
  const day = parseISO(person.birthdate).getDate();
  const monthIndex = parseISO(person.birthdate).getMonth();
  const monthNames = [
    'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 
    'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
  ];
  const formattedBirthdate = `${day} ${monthNames[monthIndex]}`;
  
  // Generate status text in Russian
  let statusText = '';
  let statusColor = '';
  
  if (isBirthdayToday) {
    statusText = "Сегодня день рождения! 🎉";
    statusColor = 'text-success-600 font-bold';
  } else if (daysUntil <= 3) {
    statusText = `Через ${daysUntil} ${getDayText(daysUntil)}!`;
    statusColor = 'text-warning-600 font-semibold';
  } else {
    statusText = `Через ${daysUntil} ${getDayText(daysUntil)}`;
    statusColor = 'text-gray-600';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${
        isBirthdayToday 
          ? 'border-success-500' 
          : daysUntil <= 3 
            ? 'border-warning-500' 
            : 'border-primary-500'
      } relative`}
    >
      {/* Confetti animation for today's birthdays */}
      {isBirthdayToday && (
        <div className="confetti-container absolute inset-0 overflow-hidden pointer-events-none">
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1" 
              htmlFor={`edit-name-${person.id}`}
            >
              ФИО
            </label>
            <input
              id={`edit-name-${person.id}`}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Введите полное имя"
              required
            />
          </div>
          
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1" 
              htmlFor={`edit-birthdate-${person.id}`}
            >
              Дата рождения
            </label>
            <input
              id={`edit-birthdate-${person.id}`}
              type="date"
              value={editBirthdate}
              onChange={(e) => setEditBirthdate(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1" 
              htmlFor={`edit-notes-${person.id}`}
            >
              Заметки (необязательно)
            </label>
            <textarea
              id={`edit-notes-${person.id}`}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Добавьте заметки, идеи подарков и т.д."
              rows="2"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              <FaTimes className="mr-1" /> Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            >
              <FaSave className="mr-1" /> Сохранить
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-800">{person.name}</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="text-gray-500 hover:text-primary-500 transition-colors"
                aria-label="Редактировать"
              >
                <FaEdit />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-500 hover:text-error-500 transition-colors"
                aria-label="Удалить"
              >
                <FaTrash />
              </button>
            </div>
          </div>
          
          <div className="flex items-center mb-2 text-gray-600">
            <FaBirthdayCake className="mr-2 text-primary-500" />
            <span>{formattedBirthdate}</span>
          </div>
          
          <div className={`mb-1 ${statusColor}`}>
            {statusText}
          </div>
          
          {person.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-gray-700">
              <p>{person.notes}</p>
            </div>
          )}
        </>
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

export default BirthdayCard;