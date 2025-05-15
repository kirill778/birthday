// Базовый URL для API синхронизации
// При разработке используем текущий домен или fallback на localhost
const getBaseUrl = () => {
  // Получаем домен текущего сайта
  const currentDomain = window.location.hostname;
  
  // Строим список возможных серверов для проверки, включая текущий домен и localhost
  const possibleBaseUrls = [
    `http://${currentDomain}:5000/api/sync`,  // Текущий домен, порт 5000
    'http://localhost:5000/api/sync',         // Localhost fallback
    '/api/sync'                               // Относительный путь (для production)
  ];
  
  // Возвращаем первый URL до проверки доступности
  return possibleBaseUrls[0];
};

let API_BASE_URL = getBaseUrl();
let lastConnectedUrl = null;

// Хранение метки времени последнего обновления
let lastSyncTimestamp = 0;
let isConnecting = false;
let connectionRetries = 0;
const MAX_RETRIES = 3;

// Функция для проверки соединения и выбора правильного URL
const checkConnection = async () => {
  if (isConnecting) return lastConnectedUrl;
  
  isConnecting = true;
  console.log('Checking connection to sync server...');
  
  // Получаем список возможных URL для проверки
  const currentDomain = window.location.hostname;
  const possibleBaseUrls = [
    `http://${currentDomain}:5000/api/sync`,
    'http://localhost:5000/api/sync',
    '/api/sync'
  ];
  
  for (const url of possibleBaseUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${url}/ping`, { 
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Connected to server at ${url}`);
        API_BASE_URL = url;
        lastConnectedUrl = url;
        isConnecting = false;
        connectionRetries = 0;
        return url;
      }
    } catch (error) {
      console.log(`Could not connect to ${url}: ${error.message}`);
    }
  }
  
  console.error('Could not connect to any sync server');
  isConnecting = false;
  lastConnectedUrl = null;
  return null;
};

// Функция для получения данных с сервера
export const fetchDataFromServer = async () => {
  try {
    // Проверяем соединение, если нет активного URL
    if (!lastConnectedUrl && connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      await checkConnection();
    }
    
    if (!lastConnectedUrl) {
      throw new Error('No active connection to sync server');
    }
    
    const response = await fetch(`${API_BASE_URL}/get?timestamp=${lastSyncTimestamp}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Sync status:', result.status);
    
    // Обновляем метку времени
    if (result.timestamp) {
      lastSyncTimestamp = result.timestamp;
    }
    
    // Если данные обновлены, возвращаем их
    if (result.status === 'updated' && result.data) {
      return {
        updated: true,
        data: result.data,
        timestamp: result.timestamp
      };
    }
    
    // Если данные не изменились
    return {
      updated: false,
      timestamp: result.timestamp
    };
  } catch (error) {
    console.error('Error fetching data from server:', error);
    lastConnectedUrl = null; // Сбрасываем URL при ошибке
    return {
      updated: false,
      error: error.message
    };
  }
};

// Функция для сохранения данных на сервере
export const saveDataToServer = async (data) => {
  try {
    // Проверяем соединение, если нет активного URL
    if (!lastConnectedUrl && connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      await checkConnection();
    }
    
    if (!lastConnectedUrl) {
      throw new Error('No active connection to sync server');
    }
    
    const timestamp = Date.now();
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        timestamp,
        data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Save result:', result);
    
    // Обновляем метку времени
    if (result.timestamp) {
      lastSyncTimestamp = result.timestamp;
    }
    
    // Если получили устаревшие данные или другую ошибку, повторяем запрос
    if (result.status === 'outdated') {
      console.log('Data was outdated, refreshing from server first');
      // Получаем актуальные данные сначала
      const freshData = await fetchDataFromServer();
      if (freshData.updated) {
        return {
          success: false,
          message: 'Data was outdated, please merge with latest',
          serverData: freshData.data,
          timestamp: freshData.timestamp
        };
      }
    }
    
    return {
      success: result.status === 'success',
      message: result.message,
      timestamp: result.timestamp
    };
  } catch (error) {
    console.error('Error saving data to server:', error);
    lastConnectedUrl = null; // Сбрасываем URL при ошибке
    return {
      success: false,
      error: error.message
    };
  }
};

// Функция для проверки статуса синхронизации
export const checkSyncStatus = async () => {
  try {
    // Проверяем соединение и выбираем лучший URL
    const activeUrl = await checkConnection();
    if (!activeUrl) {
      return {
        active: false,
        error: 'No server available'
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/status`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Server sync status:', result);
    
    return {
      active: result.status === 'active',
      timestamp: result.timestamp,
      records: result.records
    };
  } catch (error) {
    console.error('Error checking sync status:', error);
    return {
      active: false,
      error: error.message
    };
  }
};

// Функция для запуска периодической синхронизации
export const startPeriodicSync = (onDataUpdated) => {
  // Начинаем с проверки соединения
  checkConnection()
    .then(activeUrl => {
      console.log('Initial connection check:', activeUrl ? 'Connected' : 'Failed');
      
      if (activeUrl) {
        // Если соединение установлено, проверяем статус сервера
        return checkSyncStatus();
      }
      return { active: false };
    })
    .then(status => {
      console.log('Initial sync status check:', status.active ? 'Server active' : 'Server inactive');
      
      // Если сервер активен, запрашиваем первичные данные
      if (status.active) {
        return fetchDataFromServer();
      }
      return { updated: false };
    })
    .then(result => {
      if (result.updated && onDataUpdated) {
        onDataUpdated(result.data);
      }
    })
    .catch(error => console.error('Error during initial sync:', error));
  
  // Настраиваем интервал для периодической синхронизации
  const syncInterval = setInterval(async () => {
    try {
      // Если нет активного соединения, пробуем переподключиться
      if (!lastConnectedUrl && connectionRetries < MAX_RETRIES) {
        connectionRetries++;
        await checkConnection();
      }
      
      // Если есть активное соединение, получаем данные
      if (lastConnectedUrl) {
        const result = await fetchDataFromServer();
        if (result.updated && onDataUpdated) {
          onDataUpdated(result.data);
        }
      }
    } catch (error) {
      console.error('Error during periodic sync:', error);
    }
  }, 600000); // Проверка каждые 10 минут
  
  // Возвращаем функцию для остановки синхронизации
  return () => {
    clearInterval(syncInterval);
  };
}; 