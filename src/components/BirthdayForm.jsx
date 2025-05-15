import { useState } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { format } from 'date-fns';
import { FaUserPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';

const BirthdayForm = () => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const { addPerson } = useBirthday();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !birthdate) return;
    
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
    
    addPerson({
      name: name.trim(),
      birthdate: adjustedBirthdate,
      notes: notes.trim()
    });
    
    // Reset form
    setName('');
    setBirthdate('');
    setNotes('');
    setShowForm(false);
  };
  
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
            />
          </div>
          
          <div className="text-right">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-2 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors"
            >
              Сохранить
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default BirthdayForm;