// Ключ для хранения данных в localStorage
export const STORAGE_KEY = 'birthdayPeople';
export const SYNC_ENDPOINT = '/api/sync';
export const COMMON_SYNC_KEY = 'birthdayPeople_sync_timestamp';

// Функция для получения URL для синхронизации (текущий путь без домена)
export const getStorageUrl = () => {
  return window.location.pathname + 'storage';
};

// Периодически проверяем наличие обновлений с других доменов
let syncInterval = null;

// Функция для генерации уникального идентификатора для текущей сессии
const getSessionId = () => {
  if (!window.sessionStorage.getItem('bday_session_id')) {
    window.sessionStorage.setItem('bday_session_id', Date.now().toString());
  }
  return window.sessionStorage.getItem('bday_session_id');
};

// Сохранение данных в localStorage и отправка уведомления другим вкладкам/доменам
export const saveData = (data) => {
  try {
    // Создаем уникальный идентификатор текущей записи
    const timestamp = Date.now();
    const sessionId = getSessionId();
    
    // Сохраняем локально
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Saved data to localStorage');
    
    // Сохраняем в sessionStorage для обмена между доменами
    const dataToSave = { 
      data, 
      timestamp,
      sessionId
    };
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    
    // Сохраняем временную метку последнего обновления
    // Эта метка будет общей для всех доменов и используется для синхронизации
    localStorage.setItem(STORAGE_KEY + '_lastUpdate', timestamp.toString());
    
    // Также сохраняем общую метку для всех доменов (ключевой компонент синхронизации)
    try {
      localStorage.setItem(COMMON_SYNC_KEY, JSON.stringify({
        timestamp,
        sessionId,
        domain: window.location.hostname || 'localhost'
      }));
    } catch (e) {
      console.error('Error saving common sync key:', e);
    }
    
    // Попытка использовать расширенные механизмы синхронизации
    try {
      // Создаем event для отображения на текущей странице
      const event = new CustomEvent('storage_updated', {
        detail: { 
          key: STORAGE_KEY, 
          timestamp,
          sessionId 
        }
      });
      window.dispatchEvent(event);
      
      // Используем BroadcastChannel для обмена между вкладками
      const broadcastChannel = new BroadcastChannel('birthday_sync');
      broadcastChannel.postMessage({
        type: 'STORAGE_UPDATE',
        key: STORAGE_KEY,
        timestamp,
        sessionId
      });
      
      console.log('Broadcast update sent to other tabs');
    } catch (e) {
      console.log('Advanced sync mechanisms not supported', e);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

// Загрузка данных из localStorage с попыткой синхронизации
export const loadData = () => {
  try {
    // Проверяем общий ключ синхронизации
    try {
      const commonSyncData = localStorage.getItem(COMMON_SYNC_KEY);
      if (commonSyncData) {
        const syncInfo = JSON.parse(commonSyncData);
        const lastUpdate = localStorage.getItem(STORAGE_KEY + '_lastUpdate') || '0';
        
        // Если общая метка времени новее нашей последней метки, 
        // значит у кого-то есть более новые данные
        if (syncInfo.timestamp > parseInt(lastUpdate, 10)) {
          console.log('Detected newer data from another domain:', syncInfo.domain);
          // Принудительно запускаем периодическую синхронизацию
          forceSyncCheck();
        }
      }
    } catch (e) {
      console.error('Error checking common sync key:', e);
    }
    
    // Проверяем sessionStorage для данных, которые могли быть обновлены из других доменов
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        // Если есть данные в sessionStorage, проверяем их актуальность
        const lastUpdateTime = localStorage.getItem(STORAGE_KEY + '_lastUpdate') || '0';
        
        // Если данные из sessionStorage свежее, используем их
        if (!lastUpdateTime || parsed.timestamp > parseInt(lastUpdateTime, 10)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
          localStorage.setItem(STORAGE_KEY + '_lastUpdate', parsed.timestamp.toString());
          console.log('Updated localStorage from sessionStorage');
          return parsed.data;
        }
      } catch (e) {
        console.error('Error parsing sessionStorage data:', e);
      }
    }
    
    // Если не удалось загрузить из sessionStorage, берем из localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

// Создаем слушатель BroadcastChannel для обновления между вкладками/доменами
export const initStorageSync = () => {
  try {
    const broadcastChannel = new BroadcastChannel('birthday_sync');
    
    // Слушаем обновления от других вкладок
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'STORAGE_UPDATE' && event.data.key === STORAGE_KEY) {
        console.log('Received storage update from another tab/domain');
        // Перезагружаем данные
        const sessionData = sessionStorage.getItem(STORAGE_KEY);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            const mySessionId = getSessionId();
            
            // Проверяем, что это не наше собственное обновление
            if (parsed.sessionId !== mySessionId) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
              localStorage.setItem(STORAGE_KEY + '_lastUpdate', parsed.timestamp.toString());
              console.log('Updated localStorage from broadcast event');
              
              // Обновляем общий ключ синхронизации
              localStorage.setItem(COMMON_SYNC_KEY, JSON.stringify({
                timestamp: parsed.timestamp,
                sessionId: parsed.sessionId,
                domain: window.location.hostname || 'localhost'
              }));
              
              // Триггерим перезагрузку данных
              window.dispatchEvent(new CustomEvent('storage_updated', {
                detail: { 
                  key: STORAGE_KEY, 
                  timestamp: parsed.timestamp,
                  sessionId: parsed.sessionId
                }
              }));
            } else {
              console.log('Ignoring our own broadcast event');
            }
          } catch (e) {
            console.error('Error processing broadcast update:', e);
          }
        }
      }
    };
    
    // Запускаем периодическую синхронизацию между IP-адресами
    startPeriodicSync();
    
    return broadcastChannel;
  } catch (e) {
    console.log('BroadcastChannel not supported in this browser, falling back to interval sync');
    // Если BroadcastChannel не поддерживается, все равно запускаем периодическую синхронизацию
    startPeriodicSync();
    return null;
  }
};

// Принудительно запускаем проверку синхронизации
const forceSyncCheck = () => {
  try {
    // Получаем ID текущей сессии
    const mySessionId = getSessionId();
    // Получаем общий ключ синхронизации
    const commonSyncData = localStorage.getItem(COMMON_SYNC_KEY);
    if (commonSyncData) {
      const syncInfo = JSON.parse(commonSyncData);
      const lastUpdate = localStorage.getItem(STORAGE_KEY + '_lastUpdate') || '0';
      
      // Если метка времени новее и не от нашей сессии
      if (syncInfo.timestamp > parseInt(lastUpdate, 10) && syncInfo.sessionId !== mySessionId) {
        // Создаем событие, чтобы обновить данные
        window.dispatchEvent(new CustomEvent('sync_needed', {
          detail: { timestamp: syncInfo.timestamp }
        }));
        console.log('Forced sync check triggered by newer data');
      }
    }
  } catch (e) {
    console.error('Error during forced sync check:', e);
  }
};

// Начинаем периодическую проверку обновлений между разными доменами/IP
const startPeriodicSync = () => {
  // Останавливаем предыдущий интервал, если он был
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Генерируем ID сессии, если его еще нет
  const mySessionId = getSessionId();
  
  // Слушатель для принудительной синхронизации
  const handleSyncNeeded = (event) => {
    // Перезагружаем данные из localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        // Пытаемся триггерить обновление контекста
        window.dispatchEvent(new Event('storage'));
        console.log('Triggered context update from sync_needed event');
      } catch (e) {
        console.error('Error triggering update after sync_needed event:', e);
      }
    }
  };
  
  // Добавляем слушатель для принудительной синхронизации
  window.addEventListener('sync_needed', handleSyncNeeded);
  
  // Проверяем обновления каждые 2 секунды
  syncInterval = setInterval(() => {
    try {
      // Получаем метку времени последнего обновления и текущие данные
      const lastUpdate = localStorage.getItem(STORAGE_KEY + '_lastUpdate') || '0';
      
      // Проверяем общий ключ синхронизации
      const commonSyncData = localStorage.getItem(COMMON_SYNC_KEY);
      if (commonSyncData) {
        try {
          const syncInfo = JSON.parse(commonSyncData);
          
          // Если общая метка времени новее нашей и не от нашей сессии
          if (syncInfo.timestamp > parseInt(lastUpdate, 10) && syncInfo.sessionId !== mySessionId) {
            console.log('Detected newer data via common sync key from:', syncInfo.domain);
            
            // Загружаем данные с другой вкладки/домена
            const localData = localStorage.getItem(STORAGE_KEY);
            
            // Если нашли локальные данные и у нас есть более новая метка времени
            if (localData) {
              console.log('Loading newer data from local storage');
              
              // Обновляем нашу метку времени
              localStorage.setItem(STORAGE_KEY + '_lastUpdate', syncInfo.timestamp.toString());
              
              // Триггерим обновление контекста
              window.dispatchEvent(new CustomEvent('storage_updated', {
                detail: { 
                  key: STORAGE_KEY, 
                  timestamp: syncInfo.timestamp,
                  sessionId: syncInfo.sessionId
                }
              }));
            }
          }
        } catch (e) {
          console.error('Error parsing common sync data:', e);
        }
      }
      
      // Если есть новые данные в sessionStorage, проверяем их
      const sessionData = sessionStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        
        // Если метка времени новее и это не наши собственные данные, обновляем локальные данные
        if (parsed.timestamp > parseInt(lastUpdate, 10) && parsed.sessionId !== mySessionId) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
          localStorage.setItem(STORAGE_KEY + '_lastUpdate', parsed.timestamp.toString());
          console.log('Updated localStorage during periodic sync');
          
          // Обновляем общий ключ синхронизации
          localStorage.setItem(COMMON_SYNC_KEY, JSON.stringify({
            timestamp: parsed.timestamp,
            sessionId: parsed.sessionId,
            domain: window.location.hostname || 'localhost'
          }));
          
          // Оповещаем об изменении данных
          window.dispatchEvent(new CustomEvent('storage_updated', {
            detail: { 
              key: STORAGE_KEY, 
              timestamp: parsed.timestamp,
              sessionId: parsed.sessionId
            }
          }));
        }
      }
    } catch (e) {
      console.error('Error during periodic sync:', e);
    }
  }, 1500);
  
  // Запускаем первую синхронизацию сразу
  setTimeout(() => {
    try {
      // Проверяем общий ключ синхронизации
      forceSyncCheck();
      
      // Также отправляем событие хранилища для обновления интерфейса
      const event = new Event('storage');
      window.dispatchEvent(event);
      console.log('Initial sync triggered');
    } catch (e) {
      console.error('Error during initial sync:', e);
    }
  }, 500);
  
  return () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    window.removeEventListener('sync_needed', handleSyncNeeded);
  };
};

// Создаем слушатель localStorage для совместимости с старыми браузерами
export const initStorageListener = (callback) => {
  // Слушатель события storage для совместимости между вкладками
  const handleStorageChange = (event) => {
    if ((event.key === STORAGE_KEY || event.key === COMMON_SYNC_KEY || event.key === null) && event.type === 'storage') {
      console.log('Storage changed via window event, reloading data');
      callback();
    }
  };
  
  // Слушатель нашего кастомного события для совместимости между доменами
  const handleCustomStorageEvent = (event) => {
    const mySessionId = getSessionId();
    if (event.detail?.key === STORAGE_KEY && event.detail?.sessionId !== mySessionId) {
      console.log('Storage changed via custom event, reloading data');
      callback();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('storage_updated', handleCustomStorageEvent);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('storage_updated', handleCustomStorageEvent);
    
    // Остановить периодическую синхронизацию
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };
}; 