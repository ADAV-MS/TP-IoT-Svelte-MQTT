const mqtt = require('mqtt');
const WebSocket = require('ws');
const http = require('http');

// MQTT broker
const mqttClient = mqtt.connect('mqtt://captain.dev0.pandor.cloud:1884');

// WebSocket server port 8080
const server = http.createServer();
const wss = new WebSocket.Server({ server: server });

wss.on('connection', function connection(ws) {
  console.log('WebSocket client connecté');
  
  ws.on('close', () => {
    console.log('WebSocket client déconnecté');
  });
});

// MQTT connect & subscribe
mqttClient.on('connect', function () {
  console.log('MQTT connecté captain.dev0.pandor.cloud:1884');
  mqttClient.subscribe('classroom/+/telemetry', function (err) {
    if (!err) {
      console.log('Abonné "classroom/+/telemetry"');
    } else {
      console.error('Subscribe error:', err);
    }
  });
});

// Forward MQTT → WebSocket
mqttClient.on('message', function (topic, message) {
  const payload = message.toString();
  console.log('MQTT "' + topic + '": ' + payload);
  
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        topic: topic,
        payload: payload,
        timestamp: new Date().toISOString()
      }));
    }
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT error:', err);
});

server.listen(8080, function() {
  console.log('Bridge prêt');
  console.log('MQTT: captain.dev0.pandor.cloud:1884');
  console.log('WS: ws://localhost:8080');
  console.log('Front: cd ../front && npm run dev');
});
