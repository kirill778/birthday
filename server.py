from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import time
import logging

# Настраиваем логирование
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='dist')
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})  # Разрешаем CORS для API

# Файл для хранения данных
DATA_FILE = 'birthday_data.json'

# Переменная для отслеживания последнего обновления
last_update = {
    'timestamp': int(time.time() * 1000),
    'data': []
}

# Загружаем начальные данные, если файл существует
if os.path.exists(DATA_FILE):
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            last_update['data'] = data
            logger.info(f"Loaded {len(data)} records from {DATA_FILE}")
    except Exception as e:
        logger.error(f"Error loading data: {e}")
else:
    logger.info(f"Data file {DATA_FILE} not found, starting with empty data set")

# Middleware для логирования запросов
@app.before_request
def log_request_info():
    logger.info(f"Request: {request.method} {request.path} {request.remote_addr}")
    if request.method == 'POST' and request.is_json:
        logger.info(f"Request JSON body size: {len(str(request.json))} bytes")

# API для получения данных
@app.route('/api/sync/get', methods=['GET'])
def get_data():
    client_timestamp = request.args.get('timestamp', '0')
    try:
        client_timestamp = int(client_timestamp)
    except:
        client_timestamp = 0
    
    logger.info(f"Data request with timestamp {client_timestamp} (server timestamp: {last_update['timestamp']})")
    
    # Если у клиента устаревшие данные, отправляем новые
    if client_timestamp < last_update['timestamp']:
        logger.info(f"Sending updated data to client ({len(last_update['data'])} records)")
        return jsonify({
            'timestamp': last_update['timestamp'],
            'data': last_update['data'],
            'status': 'updated'
        })
    
    # Если у клиента актуальные данные
    logger.info("Client data is current, no update required")
    return jsonify({
        'timestamp': last_update['timestamp'],
        'status': 'current'
    })

# API для сохранения данных
@app.route('/api/sync/save', methods=['POST'])
def save_data():
    try:
        content = request.json
        
        if not content or 'data' not in content:
            logger.error("Save request without data")
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400
            
        client_timestamp = content.get('timestamp', int(time.time() * 1000))
        data = content['data']
        
        logger.info(f"Save request with timestamp {client_timestamp} and {len(data)} records")
        
        # Проверяем, что данные клиента новее наших
        if client_timestamp > last_update['timestamp']:
            # Обновляем данные
            last_update['timestamp'] = client_timestamp
            last_update['data'] = data
            
            # Сохраняем в файл
            try:
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                logger.info(f"Successfully saved {len(data)} records to {DATA_FILE}")
            except Exception as e:
                logger.error(f"Error writing to file: {e}")
                return jsonify({'status': 'error', 'message': f'Error writing to file: {str(e)}'}), 500
                
            return jsonify({
                'status': 'success',
                'timestamp': last_update['timestamp'],
                'message': f"Saved {len(data)} records"
            })
        else:
            logger.info(f"Client data is outdated (client: {client_timestamp}, server: {last_update['timestamp']})")
            return jsonify({
                'status': 'outdated',
                'message': 'Client data is outdated',
                'timestamp': last_update['timestamp']
            })
    except Exception as e:
        logger.error(f"Error saving data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Проверка состояния синхронизации
@app.route('/api/sync/status', methods=['GET'])
def sync_status():
    logger.info(f"Status request received, reporting {len(last_update['data'])} records")
    return jsonify({
        'timestamp': last_update['timestamp'],
        'records': len(last_update['data']),
        'status': 'active'
    })

# Тестовый маршрут для проверки работы API
@app.route('/api/sync/ping', methods=['GET'])
def ping():
    logger.info("Ping request received")
    return jsonify({
        'status': 'ok',
        'timestamp': int(time.time() * 1000),
        'message': 'API server is running'
    })

# Маршрут для чистки данных (для отладки)
@app.route('/api/sync/reset', methods=['POST'])
def reset_data():
    if request.remote_addr == '127.0.0.1':  # Только с локального хоста
        global last_update
        last_update = {
            'timestamp': int(time.time() * 1000),
            'data': []
        }
        
        if os.path.exists(DATA_FILE):
            try:
                os.remove(DATA_FILE)
                logger.info(f"Removed data file {DATA_FILE}")
            except Exception as e:
                logger.error(f"Error removing data file: {e}")
        
        logger.info("Reset data store")
        return jsonify({'status': 'success', 'message': 'Data store reset'})
    else:
        logger.warning(f"Unauthorized reset attempt from {request.remote_addr}")
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

# Обслуживание статических файлов из папки dist (для production)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    logger.info(f"Starting server on http://0.0.0.0:5000")
    logger.info(f"Current data status: {len(last_update['data'])} records")
    
    # Вывод доступных IP адресов
    import socket
    try:
        hostname = socket.gethostname()
        logger.info(f"Hostname: {hostname}")
        
        ip_list = socket.gethostbyname_ex(hostname)[2]
        logger.info(f"Available IP addresses: {', '.join(ip_list)}")
        
        for ip in ip_list:
            logger.info(f"Server accessible at: http://{ip}:5000")
    except Exception as e:
        logger.error(f"Could not determine IP addresses: {e}")
    
    app.run(host='0.0.0.0', port=5000, debug=True) 