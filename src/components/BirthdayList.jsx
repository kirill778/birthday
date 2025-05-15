import { useBirthday } from '../context/BirthdayContext';
import BirthdayCard from './BirthdayCard';
import { motion, AnimatePresence } from 'framer-motion';

const BirthdayList = () => {
  const { getFilteredPeople, searchTerm } = useBirthday();
  const filteredPeople = getFilteredPeople();

  // Card container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div>
      {filteredPeople.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md p-8 text-center"
        >
          {searchTerm ? (
            <p className="text-gray-600">No birthdays found matching "{searchTerm}"</p>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">No birthdays added yet. Add your first one!</p>
              <div className="flex justify-center">
                <img 
                  src="https://images.pexels.com/photos/2072181/pexels-photo-2072181.jpeg?auto=compress&cs=tinysrgb&w=600" 
                  alt="Birthday celebration" 
                  className="rounded-lg max-w-md max-h-60 object-cover"
                />
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {filteredPeople.map(person => (
              <BirthdayCard key={person.id} person={person} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default BirthdayList;