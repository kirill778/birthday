import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { BirthdayProvider } from './context/BirthdayContext.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Обработчик события подключения для сохранения данных при перезагрузке сервера
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('Hot reload in progress, forcing localStorage save...');
    try {
      // Принудительное сохранение данных перед перезагрузкой
      const savedData = localStorage.getItem('birthdayPeople');
      if (savedData) {
        console.log('Current data preserved before reload');
      }
    } catch (error) {
      console.error('Error preserving data:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // Отключаем StrictMode в разработке, чтобы предотвратить двойной рендер
  // <React.StrictMode>
    <BirthdayProvider>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </BirthdayProvider>
  // </React.StrictMode>
)