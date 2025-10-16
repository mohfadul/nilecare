"use strict";
/**
 * @nilecare/service-clients
 *
 * Centralized service clients for all NileCare microservices
 * Provides type-safe, circuit-breaker protected API access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentServiceClient = exports.InventoryServiceClient = exports.MedicationServiceClient = exports.LabServiceClient = exports.AuthServiceClient = exports.ClinicalServiceClient = void 0;
var ClinicalServiceClient_1 = require("./ClinicalServiceClient");
Object.defineProperty(exports, "ClinicalServiceClient", { enumerable: true, get: function () { return ClinicalServiceClient_1.ClinicalServiceClient; } });
var AuthServiceClient_1 = require("./AuthServiceClient");
Object.defineProperty(exports, "AuthServiceClient", { enumerable: true, get: function () { return AuthServiceClient_1.AuthServiceClient; } });
var LabServiceClient_1 = require("./LabServiceClient");
Object.defineProperty(exports, "LabServiceClient", { enumerable: true, get: function () { return LabServiceClient_1.LabServiceClient; } });
var MedicationServiceClient_1 = require("./MedicationServiceClient");
Object.defineProperty(exports, "MedicationServiceClient", { enumerable: true, get: function () { return MedicationServiceClient_1.MedicationServiceClient; } });
var InventoryServiceClient_1 = require("./InventoryServiceClient");
Object.defineProperty(exports, "InventoryServiceClient", { enumerable: true, get: function () { return InventoryServiceClient_1.InventoryServiceClient; } });
var AppointmentServiceClient_1 = require("./AppointmentServiceClient");
Object.defineProperty(exports, "AppointmentServiceClient", { enumerable: true, get: function () { return AppointmentServiceClient_1.AppointmentServiceClient; } });
