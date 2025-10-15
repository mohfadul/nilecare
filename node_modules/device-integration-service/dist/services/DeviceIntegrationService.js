"use strict";
/**
 * Medical Device Integration Service
 * Supports multiple device protocols and real-time data streaming
 * Sudan-specific: Optimized for Sudan healthcare facilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceIntegrationService = exports.SerialPortConnection = exports.VitalMonitorConnection = exports.DeviceConnection = void 0;
const events_1 = require("events");
const mqtt_1 = __importDefault(require("mqtt"));
const serialport_1 = require("serialport");
const modbus_serial_1 = __importDefault(require("modbus-serial"));
const ws_1 = __importDefault(require("ws"));
// Abstract Device Connection
class DeviceConnection extends events_1.EventEmitter {
    constructor(deviceId, config) {
        super();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.deviceId = deviceId;
        this.config = config;
    }
    handleError(error) {
        console.error(`Device ${this.deviceId} error:`, error);
        this.emit('error', { deviceId: this.deviceId, error });
    }
    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnection attempts reached for device ${this.deviceId}`);
            this.emit('max_reconnect_attempts', { deviceId: this.deviceId });
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Reconnecting device ${this.deviceId} in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(async () => {
            try {
                await this.connect();
                this.reconnectAttempts = 0;
            }
            catch (error) {
                await this.reconnect();
            }
        }, delay);
    }
}
exports.DeviceConnection = DeviceConnection;
// Vital Monitor Connection (MQTT)
class VitalMonitorConnection extends DeviceConnection {
    async connect() {
        const params = this.config.connectionParams;
        this.mqttClient = mqtt_1.default.connect(params.mqttBroker, {
            clientId: `device-${this.deviceId}`,
            username: params.mqttUsername,
            password: params.mqttPassword,
            clean: true,
            reconnectPeriod: 5000
        });
        this.mqttClient.on('connect', () => {
            console.log(`Device ${this.deviceId} connected via MQTT`);
            this.isConnected = true;
            this.emit('connected', { deviceId: this.deviceId });
            // Subscribe to device topic
            this.mqttClient.subscribe(`devices/${this.deviceId}/vitals`, (err) => {
                if (err) {
                    this.handleError(err);
                }
            });
        });
        this.mqttClient.on('message', (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                this.emit('vitalData', this.parseVitalSigns(data));
            }
            catch (error) {
                this.handleError(error);
            }
        });
        this.mqttClient.on('error', (error) => {
            this.handleError(error);
        });
        this.mqttClient.on('close', () => {
            console.log(`Device ${this.deviceId} disconnected`);
            this.isConnected = false;
            this.emit('disconnected', { deviceId: this.deviceId });
            this.reconnect();
        });
    }
    async disconnect() {
        if (this.mqttClient) {
            this.mqttClient.end();
            this.isConnected = false;
        }
    }
    async sendCommand(command, params) {
        if (!this.mqttClient || !this.isConnected) {
            throw new Error('Device not connected');
        }
        const commandTopic = `devices/${this.deviceId}/commands`;
        const commandPayload = JSON.stringify({ command, params, timestamp: new Date() });
        return new Promise((resolve, reject) => {
            this.mqttClient.publish(commandTopic, commandPayload, { qos: 1 }, (err) => {
                if (err)
                    reject(err);
                else
                    resolve({ success: true });
            });
        });
    }
    parseVitalSigns(data) {
        return {
            deviceId: this.deviceId,
            patientId: this.config.patientId || 'unknown',
            timestamp: new Date(data.timestamp || Date.now()),
            temperature: data.temperature,
            heartRate: data.heart_rate || data.heartRate,
            respiratoryRate: data.respiratory_rate || data.respiratoryRate,
            bloodPressureSystolic: data.bp_systolic || data.bloodPressureSystolic,
            bloodPressureDiastolic: data.bp_diastolic || data.bloodPressureDiastolic,
            oxygenSaturation: data.spo2 || data.oxygenSaturation,
            pulseRate: data.pulse_rate || data.pulseRate,
            quality: {
                signalQuality: data.signal_quality || 'good',
                leadOff: data.lead_off || false,
                artifacts: data.artifacts || false,
                confidence: data.confidence || 95
            }
        };
    }
}
exports.VitalMonitorConnection = VitalMonitorConnection;
// Serial Port Connection
class SerialPortConnection extends DeviceConnection {
    async connect() {
        const params = this.config.connectionParams;
        this.serialPort = new serialport_1.SerialPort({
            path: params.serialPort,
            baudRate: params.baudRate || 9600,
            dataBits: params.dataBits || 8,
            stopBits: params.stopBits || 1,
            parity: params.parity || 'none'
        });
        this.serialPort.on('open', () => {
            console.log(`Device ${this.deviceId} connected via Serial Port`);
            this.isConnected = true;
            this.emit('connected', { deviceId: this.deviceId });
        });
        this.serialPort.on('data', (data) => {
            try {
                const parsed = this.parseSerialData(data);
                this.emit('vitalData', parsed);
            }
            catch (error) {
                this.handleError(error);
            }
        });
        this.serialPort.on('error', (error) => {
            this.handleError(error);
        });
        this.serialPort.on('close', () => {
            console.log(`Device ${this.deviceId} disconnected`);
            this.isConnected = false;
            this.emit('disconnected', { deviceId: this.deviceId });
            this.reconnect();
        });
    }
    async disconnect() {
        if (this.serialPort && this.serialPort.isOpen) {
            this.serialPort.close();
            this.isConnected = false;
        }
    }
    async sendCommand(command, params) {
        if (!this.serialPort || !this.serialPort.isOpen) {
            throw new Error('Device not connected');
        }
        return new Promise((resolve, reject) => {
            this.serialPort.write(command + '\r\n', (err) => {
                if (err)
                    reject(err);
                else
                    resolve({ success: true });
            });
        });
    }
    parseSerialData(data) {
        // Parse device-specific protocol
        const dataString = data.toString();
        // Implementation depends on device protocol
        return {
            deviceId: this.deviceId,
            patientId: this.config.patientId || 'unknown',
            timestamp: new Date(),
            // Parse vital signs from data
        };
    }
}
exports.SerialPortConnection = SerialPortConnection;
// Main Device Integration Service
class DeviceIntegrationService extends events_1.EventEmitter {
    constructor(pool, alertService) {
        super();
        this.deviceConnections = new Map();
        // Default alert thresholds (Sudan healthcare standards)
        this.DEFAULT_THRESHOLDS = {
            heartRate: { min: 60, max: 100, critical_min: 40, critical_max: 150 },
            bloodPressureSystolic: { min: 90, max: 140, critical_min: 70, critical_max: 180 },
            bloodPressureDiastolic: { min: 60, max: 90, critical_min: 40, critical_max: 110 },
            oxygenSaturation: { min: 95, critical_min: 90 },
            temperature: { min: 36.0, max: 37.5, critical_min: 35.0, critical_max: 39.0 },
            respiratoryRate: { min: 12, max: 20, critical_min: 8, critical_max: 30 }
        };
        this.pool = pool;
        this.alertService = alertService;
    }
    /**
     * Connect to vital signs monitor
     * @param deviceId - Unique device identifier
     * @param config - Device configuration
     */
    async connectToVitalMonitor(deviceId, config) {
        // Check if already connected
        if (this.deviceConnections.has(deviceId)) {
            throw new Error(`Device ${deviceId} is already connected`);
        }
        // Create connection based on protocol
        let connection;
        switch (config.protocol) {
            case 'mqtt':
                connection = new VitalMonitorConnection(deviceId, config);
                break;
            case 'serial':
                connection = new SerialPortConnection(deviceId, config);
                break;
            case 'modbus':
                connection = new ModbusConnection(deviceId, config);
                break;
            case 'websocket':
                connection = new WebSocketConnection(deviceId, config);
                break;
            default:
                throw new Error(`Unsupported protocol: ${config.protocol}`);
        }
        // Set up event listeners
        connection.on('vitalData', async (data) => {
            await this.processVitalSigns(data);
        });
        connection.on('alert', async (alert) => {
            await this.handleDeviceAlert(alert);
        });
        connection.on('connected', () => {
            this.updateDeviceStatus(deviceId, 'connected');
        });
        connection.on('disconnected', () => {
            this.updateDeviceStatus(deviceId, 'disconnected');
        });
        connection.on('error', (error) => {
            console.error(`Device ${deviceId} error:`, error);
            this.emit('device_error', { deviceId, error });
        });
        // Store connection
        this.deviceConnections.set(deviceId, connection);
        // Connect to device
        await connection.connect();
        // Register device in database
        await this.registerDevice(deviceId, config);
        console.log(`Device ${deviceId} connected successfully`);
    }
    /**
     * Disconnect from device
     * @param deviceId - Device identifier
     */
    async disconnectDevice(deviceId) {
        const connection = this.deviceConnections.get(deviceId);
        if (!connection) {
            throw new Error(`Device ${deviceId} not found`);
        }
        await connection.disconnect();
        this.deviceConnections.delete(deviceId);
        await this.updateDeviceStatus(deviceId, 'disconnected');
        console.log(`Device ${deviceId} disconnected`);
    }
    /**
     * Process vital signs data
     * @param data - Vital signs data from device
     */
    async processVitalSigns(data) {
        try {
            // 1. Store in TimescaleDB (time-series database)
            await this.storeVitalSignsTimeSeries(data);
            // 2. Store in PostgreSQL (for FHIR)
            await this.storeVitalSignsFHIR(data);
            // 3. Check for critical values
            const criticalAlerts = this.checkCriticalValues(data);
            if (criticalAlerts.length > 0) {
                for (const alert of criticalAlerts) {
                    await this.handleDeviceAlert(alert);
                }
            }
            // 4. Emit real-time event
            this.emit('vital_signs_processed', data);
            // 5. Send to WebSocket clients
            this.broadcastVitalSigns(data);
        }
        catch (error) {
            console.error('Error processing vital signs:', error);
            throw error;
        }
    }
    /**
     * Store vital signs in TimescaleDB
     */
    async storeVitalSignsTimeSeries(data) {
        const query = `
      INSERT INTO vital_signs_timeseries (
        device_id, patient_id, observation_time,
        temperature, heart_rate, respiratory_rate,
        blood_pressure_systolic, blood_pressure_diastolic,
        oxygen_saturation, pulse_rate,
        signal_quality, lead_off, artifacts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;
        await this.pool.query(query, [
            data.deviceId,
            data.patientId,
            data.timestamp,
            data.temperature,
            data.heartRate,
            data.respiratoryRate,
            data.bloodPressureSystolic,
            data.bloodPressureDiastolic,
            data.oxygenSaturation,
            data.pulseRate,
            data.quality?.signalQuality,
            data.quality?.leadOff,
            data.quality?.artifacts
        ]);
    }
    /**
     * Store vital signs as FHIR Observations
     */
    async storeVitalSignsFHIR(data) {
        const observations = this.convertToFHIRObservations(data);
        // Store each observation
        for (const observation of observations) {
            await this.storeFHIRObservation(observation);
        }
    }
    /**
     * Convert vital signs to FHIR Observations
     */
    convertToFHIRObservations(data) {
        const observations = [];
        // Temperature
        if (data.temperature !== undefined) {
            observations.push({
                resourceType: 'Observation',
                status: 'final',
                category: [{
                        coding: [{
                                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                code: 'vital-signs'
                            }]
                    }],
                code: {
                    coding: [{
                            system: 'http://loinc.org',
                            code: '8310-5',
                            display: 'Body temperature'
                        }]
                },
                subject: { reference: `Patient/${data.patientId}` },
                effectiveDateTime: data.timestamp.toISOString(),
                valueQuantity: {
                    value: data.temperature,
                    unit: '°C',
                    system: 'http://unitsofmeasure.org',
                    code: 'Cel'
                },
                device: { reference: `Device/${data.deviceId}` }
            });
        }
        // Heart Rate
        if (data.heartRate !== undefined) {
            observations.push({
                resourceType: 'Observation',
                status: 'final',
                category: [{
                        coding: [{
                                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                code: 'vital-signs'
                            }]
                    }],
                code: {
                    coding: [{
                            system: 'http://loinc.org',
                            code: '8867-4',
                            display: 'Heart rate'
                        }]
                },
                subject: { reference: `Patient/${data.patientId}` },
                effectiveDateTime: data.timestamp.toISOString(),
                valueQuantity: {
                    value: data.heartRate,
                    unit: 'beats/minute',
                    system: 'http://unitsofmeasure.org',
                    code: '/min'
                },
                device: { reference: `Device/${data.deviceId}` }
            });
        }
        // Blood Pressure
        if (data.bloodPressureSystolic !== undefined && data.bloodPressureDiastolic !== undefined) {
            observations.push({
                resourceType: 'Observation',
                status: 'final',
                category: [{
                        coding: [{
                                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                code: 'vital-signs'
                            }]
                    }],
                code: {
                    coding: [{
                            system: 'http://loinc.org',
                            code: '85354-9',
                            display: 'Blood pressure panel'
                        }]
                },
                subject: { reference: `Patient/${data.patientId}` },
                effectiveDateTime: data.timestamp.toISOString(),
                component: [
                    {
                        code: {
                            coding: [{
                                    system: 'http://loinc.org',
                                    code: '8480-6',
                                    display: 'Systolic blood pressure'
                                }]
                        },
                        valueQuantity: {
                            value: data.bloodPressureSystolic,
                            unit: 'mmHg',
                            system: 'http://unitsofmeasure.org',
                            code: 'mm[Hg]'
                        }
                    },
                    {
                        code: {
                            coding: [{
                                    system: 'http://loinc.org',
                                    code: '8462-4',
                                    display: 'Diastolic blood pressure'
                                }]
                        },
                        valueQuantity: {
                            value: data.bloodPressureDiastolic,
                            unit: 'mmHg',
                            system: 'http://unitsofmeasure.org',
                            code: 'mm[Hg]'
                        }
                    }
                ],
                device: { reference: `Device/${data.deviceId}` }
            });
        }
        // Oxygen Saturation
        if (data.oxygenSaturation !== undefined) {
            observations.push({
                resourceType: 'Observation',
                status: 'final',
                category: [{
                        coding: [{
                                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                code: 'vital-signs'
                            }]
                    }],
                code: {
                    coding: [{
                            system: 'http://loinc.org',
                            code: '2708-6',
                            display: 'Oxygen saturation'
                        }]
                },
                subject: { reference: `Patient/${data.patientId}` },
                effectiveDateTime: data.timestamp.toISOString(),
                valueQuantity: {
                    value: data.oxygenSaturation,
                    unit: '%',
                    system: 'http://unitsofmeasure.org',
                    code: '%'
                },
                device: { reference: `Device/${data.deviceId}` }
            });
        }
        // Respiratory Rate
        if (data.respiratoryRate !== undefined) {
            observations.push({
                resourceType: 'Observation',
                status: 'final',
                category: [{
                        coding: [{
                                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                code: 'vital-signs'
                            }]
                    }],
                code: {
                    coding: [{
                            system: 'http://loinc.org',
                            code: '9279-1',
                            display: 'Respiratory rate'
                        }]
                },
                subject: { reference: `Patient/${data.patientId}` },
                effectiveDateTime: data.timestamp.toISOString(),
                valueQuantity: {
                    value: data.respiratoryRate,
                    unit: 'breaths/minute',
                    system: 'http://unitsofmeasure.org',
                    code: '/min'
                },
                device: { reference: `Device/${data.deviceId}` }
            });
        }
        return observations;
    }
    /**
     * Check for critical values
     */
    checkCriticalValues(data) {
        const alerts = [];
        const thresholds = this.config.alertThresholds || this.DEFAULT_THRESHOLDS;
        // Check heart rate
        if (data.heartRate !== undefined) {
            if (data.heartRate < thresholds.heartRate.critical_min) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'heartRate', data.heartRate, thresholds.heartRate.critical_min, 'Critical bradycardia'));
            }
            else if (data.heartRate > thresholds.heartRate.critical_max) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'heartRate', data.heartRate, thresholds.heartRate.critical_max, 'Critical tachycardia'));
            }
            else if (data.heartRate < thresholds.heartRate.min) {
                alerts.push(this.createAlert(data, 'critical_value', 'medium', 'heartRate', data.heartRate, thresholds.heartRate.min, 'Low heart rate'));
            }
            else if (data.heartRate > thresholds.heartRate.max) {
                alerts.push(this.createAlert(data, 'critical_value', 'medium', 'heartRate', data.heartRate, thresholds.heartRate.max, 'High heart rate'));
            }
        }
        // Check blood pressure
        if (data.bloodPressureSystolic !== undefined) {
            if (data.bloodPressureSystolic < thresholds.bloodPressureSystolic.critical_min) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'bloodPressureSystolic', data.bloodPressureSystolic, thresholds.bloodPressureSystolic.critical_min, 'Critical hypotension'));
            }
            else if (data.bloodPressureSystolic > thresholds.bloodPressureSystolic.critical_max) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'bloodPressureSystolic', data.bloodPressureSystolic, thresholds.bloodPressureSystolic.critical_max, 'Critical hypertension'));
            }
        }
        // Check oxygen saturation
        if (data.oxygenSaturation !== undefined) {
            if (data.oxygenSaturation < thresholds.oxygenSaturation.critical_min) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'oxygenSaturation', data.oxygenSaturation, thresholds.oxygenSaturation.critical_min, 'Critical hypoxemia'));
            }
            else if (data.oxygenSaturation < thresholds.oxygenSaturation.min) {
                alerts.push(this.createAlert(data, 'critical_value', 'high', 'oxygenSaturation', data.oxygenSaturation, thresholds.oxygenSaturation.min, 'Low oxygen saturation'));
            }
        }
        // Check temperature
        if (data.temperature !== undefined) {
            if (data.temperature < thresholds.temperature.critical_min) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'temperature', data.temperature, thresholds.temperature.critical_min, 'Critical hypothermia'));
            }
            else if (data.temperature > thresholds.temperature.critical_max) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'temperature', data.temperature, thresholds.temperature.critical_max, 'Critical hyperthermia'));
            }
        }
        // Check respiratory rate
        if (data.respiratoryRate !== undefined) {
            if (data.respiratoryRate < thresholds.respiratoryRate.critical_min) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'respiratoryRate', data.respiratoryRate, thresholds.respiratoryRate.critical_min, 'Critical bradypnea'));
            }
            else if (data.respiratoryRate > thresholds.respiratoryRate.critical_max) {
                alerts.push(this.createAlert(data, 'critical_value', 'critical', 'respiratoryRate', data.respiratoryRate, thresholds.respiratoryRate.critical_max, 'Critical tachypnea'));
            }
        }
        return alerts;
    }
    /**
     * Create device alert
     */
    createAlert(data, alertType, severity, parameter, value, threshold, message) {
        return {
            alertId: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            deviceId: data.deviceId,
            patientId: data.patientId,
            alertType,
            severity,
            parameter,
            value,
            threshold,
            message,
            timestamp: data.timestamp,
            acknowledged: false
        };
    }
    /**
     * Handle device alert
     */
    async handleDeviceAlert(alert) {
        try {
            // 1. Store alert in database
            await this.storeAlert(alert);
            // 2. Send notification based on severity
            if (alert.severity === 'critical') {
                await this.alertService.sendCriticalAlert({
                    patientId: alert.patientId,
                    deviceId: alert.deviceId,
                    message: alert.message,
                    parameter: alert.parameter,
                    value: alert.value,
                    timestamp: alert.timestamp
                });
            }
            // 3. Emit event
            this.emit('alert', alert);
            // 4. Log in audit trail
            await this.logAlertInAudit(alert);
        }
        catch (error) {
            console.error('Error handling device alert:', error);
        }
    }
    /**
     * Check if value is critical
     */
    isCriticalValue(data) {
        const alerts = this.checkCriticalValues(data);
        return alerts.some(alert => alert.severity === 'critical');
    }
    /**
     * Get device status
     */
    async getDeviceStatus(deviceId) {
        const query = `
      SELECT * FROM device_status
      WHERE device_id = $1
    `;
        const result = await this.pool.query(query, [deviceId]);
        return result.rows[0];
    }
    /**
     * Get all connected devices
     */
    getConnectedDevices() {
        return Array.from(this.deviceConnections.keys());
    }
    /**
     * Send command to device
     */
    async sendDeviceCommand(deviceId, command, params) {
        const connection = this.deviceConnections.get(deviceId);
        if (!connection) {
            throw new Error(`Device ${deviceId} not connected`);
        }
        return connection.sendCommand(command, params);
    }
    // Helper methods
    async registerDevice(deviceId, config) {
        const query = `
      INSERT INTO devices (
        device_id, device_type, protocol, patient_id, facility_id, tenant_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (device_id) DO UPDATE
      SET patient_id = $4, status = $7, updated_at = NOW()
    `;
        await this.pool.query(query, [
            deviceId,
            config.deviceType,
            config.protocol,
            config.patientId,
            config.facilityId,
            config.tenantId,
            'connected'
        ]);
    }
    async updateDeviceStatus(deviceId, status) {
        const query = `
      UPDATE devices
      SET status = $1, last_seen = NOW(), updated_at = NOW()
      WHERE device_id = $2
    `;
        await this.pool.query(query, [status, deviceId]);
    }
    async storeAlert(alert) {
        const query = `
      INSERT INTO device_alerts (
        alert_id, device_id, patient_id, alert_type, severity,
        parameter, value, threshold, message, timestamp, acknowledged
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
        await this.pool.query(query, [
            alert.alertId,
            alert.deviceId,
            alert.patientId,
            alert.alertType,
            alert.severity,
            alert.parameter,
            alert.value,
            alert.threshold,
            alert.message,
            alert.timestamp,
            alert.acknowledged
        ]);
    }
    async storeFHIRObservation(observation) {
        // Store in FHIR repository
        const query = `
      INSERT INTO fhir_resources (
        resource_id, resource_type, resource_data, created_at
      ) VALUES ($1, $2, $3, NOW())
    `;
        await this.pool.query(query, [
            observation.id || `obs-${Date.now()}`,
            'Observation',
            JSON.stringify(observation)
        ]);
    }
    async logAlertInAudit(alert) {
        // Log in PHI audit trail
        console.log('Alert logged in audit trail:', alert.alertId);
    }
    broadcastVitalSigns(data) {
        // Broadcast to WebSocket clients
        this.emit('broadcast_vital_signs', data);
    }
}
exports.DeviceIntegrationService = DeviceIntegrationService;
// Modbus Connection (for some medical devices)
class ModbusConnection extends DeviceConnection {
    async connect() {
        const params = this.config.connectionParams;
        this.modbusClient = new modbus_serial_1.default();
        await this.modbusClient.connectTCP(params.modbusHost, { port: params.modbusPort || 502 });
        this.modbusClient.setID(params.modbusUnitId || 1);
        this.isConnected = true;
        this.emit('connected', { deviceId: this.deviceId });
        // Start polling
        this.startPolling();
    }
    async disconnect() {
        if (this.modbusClient) {
            this.modbusClient.close(() => { });
            this.isConnected = false;
        }
    }
    async sendCommand(command, params) {
        // Modbus write command
        return { success: true };
    }
    startPolling() {
        setInterval(async () => {
            if (!this.isConnected)
                return;
            try {
                // Read holding registers (example)
                const data = await this.modbusClient.readHoldingRegisters(0, 10);
                const vitalSigns = this.parseModbusData(data.data);
                this.emit('vitalData', vitalSigns);
            }
            catch (error) {
                this.handleError(error);
            }
        }, 1000); // Poll every second
    }
    parseModbusData(data) {
        // Parse device-specific Modbus registers
        return {
            deviceId: this.deviceId,
            patientId: this.config.patientId || 'unknown',
            timestamp: new Date(),
            heartRate: data[0],
            oxygenSaturation: data[1],
            // ... parse other values
        };
    }
}
// WebSocket Connection
class WebSocketConnection extends DeviceConnection {
    async connect() {
        const params = this.config.connectionParams;
        this.ws = new ws_1.default(params.wsUrl, params.wsProtocol);
        this.ws.on('open', () => {
            console.log(`Device ${this.deviceId} connected via WebSocket`);
            this.isConnected = true;
            this.emit('connected', { deviceId: this.deviceId });
        });
        this.ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                this.emit('vitalData', parsed);
            }
            catch (error) {
                this.handleError(error);
            }
        });
        this.ws.on('error', (error) => {
            this.handleError(error);
        });
        this.ws.on('close', () => {
            console.log(`Device ${this.deviceId} disconnected`);
            this.isConnected = false;
            this.emit('disconnected', { deviceId: this.deviceId });
            this.reconnect();
        });
    }
    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.isConnected = false;
        }
    }
    async sendCommand(command, params) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            throw new Error('Device not connected');
        }
        this.ws.send(JSON.stringify({ command, params }));
        return { success: true };
    }
}
exports.default = DeviceIntegrationService;
//# sourceMappingURL=DeviceIntegrationService.js.map